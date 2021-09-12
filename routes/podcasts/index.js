import { h, Component } from 'preact';
import style from './style';
import PodcastList from '../../components/podcastlist';
import Header from '../../components/header';
import { isValidUrl, getUrlQueryParameterByName, setDocumentMetaTags } from '../../utils/misc';

export default class Podcasts extends Component {
  constructor(props) {
    super(props);
    this.state = {
      docTitle: 'Podcasts',
      docDescription: 'Find podcasts at 1tuner.com',
      searchQuery: null,
      searchIsUrl: false,
      searchTimer: 0,
      lastSearchResult: null,
      podcastList: null,
      featuredPodcastList: null,
      errorMessage: null,
    };
  }

  componentDidMount() {
    setDocumentMetaTags(this.state.docTitle, this.state.docDescription);
    let searchQuery = getUrlQueryParameterByName('q', window.location.href.split('/?')[1]);
    let q = searchQuery || this.props.searchQuery;
    this.setState(
      {
        searchQuery: q,
        searchIsUrl: isValidUrl(q),
        lastSearchResult: this.props.lastSearchResult,
        podcastList: this.props.podcastList,
        featuredPodcastList: this.props.featuredPodcastList,
      },
      () => {
        if (searchQuery) {
          this.findPodcasts();
        }
      }
    );
  }

  toggleFilterPanel = () => {
    this.props.toggleFilterPanel();
  };

  setSearchQuery = (e) => {
    let q = e.target.value;
    let timer = this.state.searchTimer;
    let self = this;
    clearTimeout(timer);
    if (q && q.length > 2) {
      timer = setTimeout(function () {
        self.findPodcasts();
      }, 500);
    }
    this.setState({ searchQuery: q, searchTimer: timer });
    e.preventDefault();
  };

  findPodcasts = () => {
    if (!this.state.searchQuery) {
      return;
    }
    if (isValidUrl(this.state.searchQuery)) {
      this.setState({ searchIsUrl: true });
      return;
    }
    let self = this;
    if (this.props.settings && this.props.settings.experimental && this.props.settings.experimental.podcastindex) {
      fetch('https://podcastindex.robinbakker.workers.dev', {
        method: 'POST',
        body: self.state.searchQuery,
      })
        .then((resp) => resp.json())
        .then(function (data) {
          if (!data || !data.feeds || !data.feeds.length) {
            self.setState({
              searchIsUrl: false,
              errorMessage: 'Sorry, nothing found for "' + self.state.searchQuery + '"... 😥 Maybe you can try to change your search query?',
            });
            return;
          }
          let newState = [];
          for (let item in data.feeds) {
            newState.push({
              feedUrl: data.feeds[item].url,
              name: data.feeds[item].title,
              artistName: data.feeds[item].author,
              logo: data.feeds[item].image,
              logo600: data.feeds[item].artwork,
              collectionid: data.feeds[item].itunesId,
            });
          }
          self.props.latestPodcastSearchResult(self.state.searchQuery, newState);
          self.setState({ searchIsUrl: false, lastSearchResult: newState, errorMessage: null });
        })
        .catch((err) => {
          self.setState({
            searchIsUrl: false,
            lastSearchResult: null,
            errorMessage: "🎇 BANG! - That's an error... Sorry! Please try again or rephrase your search query.",
          });
          console.log(err);
        });
    } else {
      fetch(`https://itunes.apple.com/search?term=${this.state.searchQuery}&media=podcast`)
        .then((resp) => resp.json())
        .then(function (data) {
          if (!data || !data.results || !data.results.length) {
            self.setState({
              searchIsUrl: false,
              errorMessage: `Sorry, nothing found for "${self.state.searchQuery}"... 😥 Maybe you can try to change your search query?`,
            });
            return;
          }
          let newState = [];
          for (let item in data.results) {
            newState.push({
              feedUrl: data.results[item].feedUrl,
              name: data.results[item].collectionName,
              artistName: data.results[item].artistName,
              logo: data.results[item].artworkUrl100,
              logo600: data.results[item].artworkUrl600,
              collectionid: data.results[item].collectionid,
            });
          }
          self.props.latestPodcastSearchResult(self.state.searchQuery, newState);
          self.setState({ searchIsUrl: false, lastSearchResult: newState, errorMessage: null });
        })
        .catch((err) => {
          self.setState({
            searchIsUrl: false,
            lastSearchResult: null,
            errorMessage: "🎇 BANG! - That's an error... Sorry! Please try again or rephrase your search query.",
          });
          console.log(err);
        });
    }
  };

  resetSearchQuery = () => {
    let timer = this.state.searchTimer;
    clearTimeout(timer);
    this.props.latestPodcastSearchResult('', null);
    this.setState({ searchIsUrl: false, searchQuery: '', lastSearchResult: null, errorMessage: null, searchTimer: 0 });
  };

  setSearchInputBlur = () => {
    if (typeof document != 'undefined') {
      setTimeout(function () {
        document.body.classList.remove('search-focus');
      }, 500);
    }
  };
  setSearchInputFocus = () => {
    if (typeof document != 'undefined') {
      document.body.classList.add('search-focus');
    }
  };
  onKeyDown = (e) => {
    if (e.keyCode === 13) {
      e.preventDefault();
    }
    return false;
  };

  render({}, { docTitle, docDescription, searchQuery, searchIsUrl, lastSearchResult, errorMessage, podcastList, featuredPodcastList }) {
    return (
      <div class={'page-container'}>
        <Header title={docTitle} sharetext={this.state.docDescription} />
        <main class={'content ' + style.podcasts}>
          <h1 class={'main-title'}>
            {docTitle}
            <small class={'main-subtitle'}>Listen to your favorite podcast 🎙️</small>
          </h1>
          <form class={'form-search'}>
            <input
              type="text"
              placeholder="Find..."
              value={searchQuery}
              maxlength="100"
              required
              pattern="[a-zA-Z0-9\s]+"
              class={'textfield textfield--search'}
              onFocus={this.setSearchInputFocus.bind(this)}
              onBlur={this.setSearchInputBlur.bind(this)}
              onKeyDown={this.onKeyDown}
              onInput={this.setSearchQuery.bind(this)}
            />
            <button class={'btn-search-reset'} onClick={this.resetSearchQuery.bind(this)} type="reset">
              Reset
            </button>
          </form>
          <div>
            {searchQuery && searchQuery.length ? (
              <div>
                {searchIsUrl ? (
                  <p>
                    🔗 This seems like a URL...{' '}
                    <a href={'/podcast/by-url/' + btoa(searchQuery)} class="btn">
                      Load podcast by URL?
                    </a>
                  </p>
                ) : null}
                <PodcastList podcastList={lastSearchResult} errorMessage={errorMessage} limitCount={100} />
              </div>
            ) : null}
          </div>
          {podcastList && podcastList.length ? (
            <article class={style.section + ' content__section content__section--podcasts'}>
              <header class={'section-header'}>
                <h3 class={'section-title'}>Last visited</h3>
              </header>
              <div class={'section-main'}>
                <PodcastList podcastList={podcastList} horizontal={true} small={true} limitCount={10} />
              </div>
            </article>
          ) : null}
          {featuredPodcastList && featuredPodcastList.length ? (
            <article class={style.section + ' content__section content__section--podcasts'}>
              <header class={'section-header'}>
                <h3 class={'section-title'}>Featured</h3>
              </header>
              <div class={'section-main'}>
                <PodcastList podcastList={featuredPodcastList} horizontal={true} small={true} limitCount={10} />
              </div>
            </article>
          ) : null}
        </main>
      </div>
    );
  }
}
