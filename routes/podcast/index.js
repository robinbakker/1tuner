import { h, Component } from 'preact';
import style from './style';
import { route } from 'preact-router';
import { Link } from 'preact-router/match';
import SocialLinkList from '../../components/sociallinklist';
import Loader from '../../components/loader';
import Header from '../../components/header';
import PodcastPageHeader from '../../components/podcastpageheader';
import {
  isValidUrl,
  getUrlQueryParameterByName,
  removeHtml,
  getTimeFromSeconds,
  getTime,
  getSecondsFromTime,
  getFlagEmojiFromLanguage,
  setDocumentMetaTags,
  slugify,
} from '../../utils/misc';

export default class Podcast extends Component {
  constructor(props) {
    super(props);
    this.state = {
      docTitle: 'Podcast',
      docDescription: 'Listen now at 1tuner.com',
      podcastInfo: null,
      errorMessage: null,
      isLoading: false,
    };
  }

  getPodcast = (AFeedUrl) => {
    this.setState({ isLoading: true });
    AFeedUrl = AFeedUrl ? decodeURIComponent(AFeedUrl) : null;
    if (!AFeedUrl || !isValidUrl(AFeedUrl)) {
      this.setState({ errorMessage: 'Error: The feed url is invalid.' });
      return null;
    }
    if (AFeedUrl.indexOf('https://feeds.megaphone.fm/fullsend') !== -1) {
      // DMCA Takedown Request
      this.setState({ errorMessage: 'Error: The feed url is invalid (DMCA Takedown Request).' });
      return null;
    }
    let loadXml = true;
    let podcastInfo = this.state.podcastInfo;
    const podcastSearchResult = this.props.lastPodcastSearchResult;
    const stationPodcastList = this.props.stationPodcastList;
    const podcastList = this.props.podcastList;
    if (!podcastInfo && podcastList) {
      for (let i = 0; i < podcastList.length; i++) {
        if (podcastList[i].feedUrl == AFeedUrl) {
          const dateNowMs = new Date().getTime();
          podcastInfo = podcastList[i];
          if (podcastInfo.modified && (dateNowMs - podcastInfo.modified.getTime()) / 3600000 < 24) {
            loadXml = false;
          } else {
            loadXml = true;
          }
          this.setState({ podcastInfo: podcastInfo, isLoading: false });
          break;
        }
      }
    }
    if (!podcastInfo && podcastSearchResult) {
      for (let i = 0; i < podcastSearchResult.length; i++) {
        if (podcastSearchResult[i].feedUrl == AFeedUrl) {
          podcastInfo = podcastSearchResult[i];
          this.setState({ podcastInfo: podcastInfo, isLoading: false });
          loadXml = true;
          break;
        }
      }
    }
    if (!podcastInfo && stationPodcastList) {
      for (let i = 0; i < stationPodcastList.length; i++) {
        if (stationPodcastList[i].feedUrl == AFeedUrl) {
          podcastInfo = stationPodcastList[i];
          this.setState({ podcastInfo: podcastInfo, isLoading: false });
          loadXml = true;
          break;
        }
      }
    }
    if (!podcastInfo) {
      podcastInfo = {
        feedUrl: AFeedUrl,
      };
    }
    if (loadXml) {
      this.loadXmlFeed(podcastInfo, AFeedUrl);
    }
    return podcastInfo;
  };

  loadXmlFeed = (APodcastInfo, AFeedUrl, AFetchOptions) => {
    const self = this;
    const podcastInfo = APodcastInfo || this.state.podcastInfo || {};
    fetch(AFeedUrl, AFetchOptions || {})
      .then((resp) => (resp.ok ? resp.text() : Promise.reject(resp)))
      .then((str) => new window.DOMParser().parseFromString(str, 'text/xml'))
      .then((xmlDoc) => {
        if (!xmlDoc || !xmlDoc.getElementsByTagName('channel')[0]) {
          Promise.reject('no xml');
        }
        podcastInfo.feedUrl = podcastInfo.feedUrl || AFeedUrl;
        podcastInfo.modified = new Date();
        podcastInfo.name = xmlDoc.getElementsByTagName('channel')[0].getElementsByTagName('title')[0].childNodes[0].nodeValue;
        const description =
          xmlDoc.getElementsByTagName('channel')[0].getElementsByTagName('description')[0].childNodes[0].wholeText ||
          xmlDoc.getElementsByTagName('channel')[0].getElementsByTagName('description')[0].childNodes[0].nodeValue;
        podcastInfo.language = xmlDoc.getElementsByTagName('channel')[0].getElementsByTagName('language')[0].childNodes[0].nodeValue;
        podcastInfo.description = description;
        podcastInfo.logo = self.getArtworkUrl(xmlDoc);
        podcastInfo.episodes = self.getFeedEpisodeArray(podcastInfo, xmlDoc);
        if (self.props.name === 'by-url' && self.props.feedcode && podcastInfo.name) {
          route('/podcast/' + slugify(podcastInfo.name) + '/' + self.props.feedcode);
        }
        self.setState({
          podcastInfo: podcastInfo,
          isLoading: false,
        });
        self.props.savePodcastHistory(podcastInfo);
      })
      .catch((err) => {
        if (!AFetchOptions) {
          // Probably a CORS issue, try again via our special request worker
          self.loadXmlFeed(podcastInfo, 'https://request.robinbakker.workers.dev', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/text',
            },
            body: AFeedUrl,
          });
        } else {
          self.setState({ errorMessage: "⚡KA-POW! - That's an error... Sorry! Please try again later, or another podcast maybe?" });
        }
        console.log(err);
      });
  };

  getArtworkUrl = (AXmlDoc) => {
    if (AXmlDoc.getElementsByTagName('channel')[0].getElementsByTagName('media:thumbnail')[0] !== undefined) {
      return AXmlDoc.getElementsByTagName('channel')[0].getElementsByTagName('media:thumbnail')[0].getAttribute('url');
    } else if (AXmlDoc.getElementsByTagName('channel')[0].getElementsByTagName('itunes:image')[0] !== undefined) {
      return AXmlDoc.getElementsByTagName('channel')[0].getElementsByTagName('itunes:image')[0].getAttribute('href');
    } else {
      if (!AXmlDoc.getElementsByTagName('item')) {
        return null;
      }
      // Try to find any item with 'href' or 'url' attribute containing an image
      for (let i = 0; i < AXmlDoc.getElementsByTagName('item').length; i++) {
        let qSelect = AXmlDoc.getElementsByTagName('item')[i].querySelector('*[href*=".jpeg"],*[href*=".jpg"],*[href*=".png"]');
        if (qSelect && qSelect.length !== 0) {
          return qSelect.getAttribute('href');
        }
        qSelect = AXmlDoc.getElementsByTagName('item')[i].querySelector('*[url*=".jpeg"],*[url*=".jpg"],*[url*=".png"]');
        if (qSelect && qSelect.length !== 0) {
          return qSelect.getAttribute('url');
        }
      }
    }
    return null;
  };

  getFeedEpisodeArray = (APodcastInfo, AXmlDoc) => {
    let itemArray = [];
    for (let i = 0; i < AXmlDoc.getElementsByTagName('item').length; i++) {
      const item = AXmlDoc.getElementsByTagName('item')[i];
      const encl = item.getElementsByTagName('enclosure');
      if (encl.length) {
        const durationKey = item.getElementsByTagName('itunes:duration').length ? 'itunes:duration' : 'duration';
        const durationElm = item.getElementsByTagName(durationKey);
        const epItem = {
          title: item.getElementsByTagName('title')[0].childNodes[0].nodeValue,
          length: encl[0].getAttribute('length'),
          type: encl[0].getAttribute('type'),
          url: encl[0].getAttribute('url'),
          description: item.getElementsByTagName('itunes:subtitle')[0]
            ? item.getElementsByTagName('itunes:subtitle')[0].textContent
            : item.getElementsByTagName('description')[0].textContent,
          pubDate: new Date(item.getElementsByTagName('pubDate')[0].childNodes[0].nodeValue),
          duration: durationElm && durationElm.length ? this.getFeedEpisodeDuration(durationElm[0].innerHTML.split(':')) : '',
          durationSeconds: durationElm && durationElm.length ? getSecondsFromTime(durationElm[0].innerHTML) : 0,
        };
        if (APodcastInfo && APodcastInfo.episodes) {
          const oldEp = APodcastInfo.episodes.find((ep) => ep.secondsElapsed && ep.url === epItem.url);
          if (oldEp) {
            epItem.isPlaying = oldEp.isPlaying;
            epItem.secondsElapsed = oldEp.secondsElapsed;
          }
        }
        itemArray.push(epItem);
      }
    }
    return itemArray;
  };

  getFeedEpisodeDuration = (ADurationArr) => {
    if (!ADurationArr || !ADurationArr.length) {
      return '';
    }
    if (ADurationArr.length >= 2) {
      return getTime(ADurationArr[0], ADurationArr[1]);
    } else {
      return getTimeFromSeconds(ADurationArr[0] / 60);
    }
  };

  playEpisode = (e) => {
    if (this.state.podcastInfo && this.state.podcastInfo.episodes) {
      const podcast = this.state.podcastInfo;
      for (let i = 0; i < podcast.episodes.length; i++) {
        podcast.episodes[i].isPlaying = podcast.episodes[i].url === e.currentTarget.dataset['href'];
      }
      this.props.playEpisode(podcast, true);
      this.setState({
        podcastInfo: podcast,
      });
    }
    e.preventDefault();
  };

  tryAgain = () => {
    this.setState({ podcastInfo: null, isLoading: false });
  };
  reloadFeed = () => {
    this.getPodcast(this.state.podcastInfo.feedUrl);
  };

  render({ name, feedcode }, { podcastInfo, isLoading, docTitle, docDescription, errorMessage }) {
    if (!podcastInfo) {
      setDocumentMetaTags(this.props.name + ' | ' + docTitle, docDescription);
      if (!isLoading && typeof window !== 'undefined') {
        const urlParam = feedcode ? atob(feedcode) : null;
        const feedUrl = urlParam || getUrlQueryParameterByName('feedurl', window.location.href.split('/?')[1]);
        this.getPodcast(feedUrl);
      }
      return (
        <div class={'page-container'}>
          <Header title={docTitle} />
          <main class={'content content--is-loading ' + style.podcast + ' ' + style['podcast--empty']}>
            <h1>{name}</h1>
            {isLoading && !errorMessage ? (
              <Loader />
            ) : (
              <div>
                <p>{errorMessage}</p>
                <p>
                  <button onClick={this.tryAgain} class={'btn btn--cancel margin--right'}>
                    Try again
                  </button>{' '}
                  <Link href={'/podcasts'} class={'btn btn--search'}>
                    Find other podcasts
                  </Link>
                </p>
              </div>
            )}
          </main>
        </div>
      );
    } else {
      setDocumentMetaTags(
        podcastInfo.name + ' | ' + docTitle,
        docDescription,
        podcastInfo.logo600 ? podcastInfo.logo600 : podcastInfo.logo,
        (window ? window.location.origin : '') + '/podcast/' + slugify(podcastInfo.name) + '/' + btoa(podcastInfo.feedUrl)
      );
      return (
        <div class={'page-container'}>
          <Header title={podcastInfo.name} sharetext={'Listen to this podcast at 1tuner.com'} />
          <div class={style.pageheader}>
            <h1 class={'main-title'}>
              {podcastInfo.name}
              <small class={'main-subtitle main-subtitle--loud'}>{getFlagEmojiFromLanguage(podcastInfo.language)} Podcast</small>
            </h1>
            <SocialLinkList websiteUrl={podcastInfo.website} items={podcastInfo.social} />
          </div>
          <main class={'content ' + style.podcast}>
            <PodcastPageHeader
              podcastName={podcastInfo.name}
              logo={podcastInfo.logo600 ? podcastInfo.logo600 : podcastInfo.logo}
              lastPlayedEpisode={{ ...podcastInfo }?.episodes?.find((ep) => ep.isPlaying && ep.secondsElapsed)}
              description={podcastInfo.description}
              onLastPlayedClick={this.playEpisode.bind(this)}
              lastUpdated={podcastInfo.modified}
              onReloadClick={this.reloadFeed.bind(this)}
              isReloading={isLoading}
            ></PodcastPageHeader>
            <div class={style.episodes}>
              {podcastInfo.episodes ? (
                <div>
                  <ul class={style['podcast-episode__list']}>
                    {podcastInfo.episodes.map((ep) => (
                      <li class={style['podcast-episode__item'] + (ep.isPlaying ? ' ' + style['podcast-episode__item--is-playing'] : '')}>
                        <button class="btn btn--naked" data-href={ep.url} onClick={this.playEpisode.bind(this)}>
                          <span class="button__icon button__icon--play">Play</span>
                          <span class="button__text">
                            <b>{ep.title}</b>{' '}
                            <span>
                              ({ep.duration}
                              {ep.secondsElapsed ? ' - played ' + getTimeFromSeconds(ep.secondsElapsed) : ''})
                            </span>
                            {typeof ep.pubDate === 'object' ? (
                              <span class={style.pubdate}>{ep.pubDate.toLocaleDateString(undefined, { dateStyle: 'full' })}</span>
                            ) : null}
                          </span>
                        </button>
                        {removeHtml(ep.description)}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : errorMessage ? (
                <div>
                  <p>{errorMessage}</p>
                  <p>
                    <button onClick={this.tryAgain} class={'btn btn--cancel margin--right'}>
                      Try again
                    </button>{' '}
                    <Link href={'/podcasts'} class={'btn btn--search'}>
                      Find other podcasts
                    </Link>
                  </p>
                </div>
              ) : (
                <Loader />
              )}
            </div>
          </main>
        </div>
      );
    }
  }
}
