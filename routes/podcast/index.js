import { h, Component } from 'preact';
import style from './style';
import { Link } from 'preact-router/match';
import Loader from '../../components/loader';
import Header from '../../components/header';
import { isValidUrl, getUrlQueryParameterByName, removeHtml, getTimeFromSeconds, getTime } from '../../utils/misc';

export default class Podcast extends Component {
	constructor(props) {
    super(props);
		this.state = {
			baseDocTitle: 'Podcast - Listen now at 1tuner.com',
			podcastInfo: null,
			errorMessage: null,
			isLoading: false
		};
	}

	getPodcast = (AFeedUrl) => {
		this.setState({isLoading:true});
		AFeedUrl = AFeedUrl ? decodeURI(AFeedUrl) : null;
    if (!AFeedUrl || !isValidUrl(AFeedUrl)) {
			this.setState({errorMessage:'Error: The feed url is invalid.'});
      return null;
		}		
		let loadXml = true;
		let podcastInfo;		
		let podcastSearchResult = this.props.lastPodcastSearchResult;
		let podcastList = this.props.podcastList;
		if (podcastList) {
			for (let i=0; i < podcastList.length; i++) {
				if (podcastList[i].feedUrl==AFeedUrl) {
					let dateNowMs = new Date().getTime();
					podcastInfo = podcastList[i];
					if(podcastInfo.modified && (dateNowMs - podcastInfo.modified.getTime())/3600000 < 24) {
						loadXml = false;
					} else {
						loadXml = true;
					}
					this.setState({podcastInfo: podcastInfo, isLoading: false});
					break;
				}
			}
		}
		if (!podcastInfo && podcastSearchResult) {
			for (let i=0; i < podcastSearchResult.length; i++) {
				if (podcastSearchResult[i].feedUrl==AFeedUrl) {
					podcastInfo = podcastSearchResult[i];
					this.setState({podcastInfo: podcastInfo, isLoading: false});
					loadXml = true;
					break;
				}
			}
		}
		if (!podcastInfo) {
			podcastInfo = {
				feedUrl: AFeedUrl
			};
			this.setState({podcastInfo: podcastInfo});
		}
		if (loadXml) {
			this.loadXmlFeed(AFeedUrl, 'https://dented-radiosaurus.glitch.me/?url=' + AFeedUrl);
		}
		return podcastInfo;
	}

	loadXmlFeed = (AFeedUrl, AAlternativeFeedUrl) => {
		let self = this;
		let podcastInfo = this.state.podcastInfo || {};
		fetch(AFeedUrl)
		.then(resp => resp.text())
    .then(str => (new window.DOMParser()).parseFromString(str, 'text/xml'))
    .then(xmlDoc => {
			if (!xmlDoc || !xmlDoc.getElementsByTagName('channel')[0]) {
				return;
			}
			podcastInfo.feedUrl = self.state.podcastInfo.feedUrl || AFeedUrl;
			podcastInfo.modified = new Date();
			podcastInfo.name = xmlDoc.getElementsByTagName('channel')[0].getElementsByTagName('title')[0].childNodes[0].nodeValue;
			let description = xmlDoc.getElementsByTagName('channel')[0].getElementsByTagName('description')[0].childNodes[0].wholeText || xmlDoc.getElementsByTagName('channel')[0].getElementsByTagName('description')[0].childNodes[0].nodeValue;
			podcastInfo.description	= description;
			podcastInfo.artworkUrl = self.getArtworkUrl(xmlDoc);
			podcastInfo.episodes = self.getFeedEpisodeArray(xmlDoc); 
			self.setState({
				podcastInfo: podcastInfo,
				isLoading: false
			});
			self.props.savePodcastHistory(podcastInfo);
		}).catch(err => {
			if (AAlternativeFeedUrl) {
				self.loadXmlFeed(AAlternativeFeedUrl);
			} else {
				self.setState({errorMessage:'⚡KA-POW! - That\'s an error... Sorry! Please try again later, or another podcast maybe?'});
			}
			console.log(err);
		});
	}

	getArtworkUrl = (AXmlDoc) => {
		if (AXmlDoc.getElementsByTagName('channel')[0].getElementsByTagName('media:thumbnail')[0] !== undefined) {
			return AXmlDoc.getElementsByTagName('channel')[0].getElementsByTagName('media:thumbnail')[0].getAttribute('url'); 
		} else if (AXmlDoc.getElementsByTagName('channel')[0].getElementsByTagName('itunes:image')[0] !== undefined) {
			return AXmlDoc.getElementsByTagName('channel')[0].getElementsByTagName('itunes:image')[0].getAttribute('href');
		} else {
			if(!AXmlDoc.getElementsByTagName('item')) {
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
	}

	getFeedEpisodeArray = (AXmlDoc) => {
		let itemArray = [];
		for (let i = 0; i < AXmlDoc.getElementsByTagName('item').length; i++) {
			let item = AXmlDoc.getElementsByTagName('item')[i];
			let encl = item.getElementsByTagName('enclosure');
			if (encl.length) {
				let durationKey = item.getElementsByTagName('itunes:duration').length ? 'itunes:duration' : 'duration';
				let durationElm = item.getElementsByTagName(durationKey);
				itemArray.push({
					title: item.getElementsByTagName('title')[0].childNodes[0].nodeValue,
					length: encl[0].getAttribute('length'),
					type: encl[0].getAttribute('type'),
					url: encl[0].getAttribute('url'),
					description: item.getElementsByTagName('itunes:subtitle')[0] ? item.getElementsByTagName('itunes:subtitle')[0].textContent : item.getElementsByTagName('description')[0].textContent,
					pubDate: item.getElementsByTagName('pubDate')[0].childNodes[0].nodeValue,
					duration: durationElm && durationElm.length ? this.getFeedEpisodeDuration(item.getElementsByTagName(durationKey)[0].innerHTML.split(':')) : ''
				});
			}
		}
		return itemArray;
	}

	getFeedEpisodeDuration = (ADurationArr) => {
		if(!ADurationArr || !ADurationArr.length) {
			return '';
		}
		if(ADurationArr.length>=2) {
			return getTime(ADurationArr[0], ADurationArr[1]);
		} else {
			return getTimeFromSeconds(ADurationArr[0] / 60);
		}
	}

	playEpisode = (e) => {
		if (this.state.podcastInfo && this.state.podcastInfo.episodes) {
			let podcast = this.state.podcastInfo;
		 	for (let i=0; i<podcast.episodes.length;i++) {
				if (podcast.episodes[i].url == e.target.getAttribute('data-href')) {
					podcast.episodes[i].isPlaying = true;
				} else{
					podcast.episodes[i].isPlaying = false;
				}
		 	}
		 	this.props.playEpisode(podcast, true);
		 	this.setState({
				podcastInfo: podcast
			});		 
		}
		e.preventDefault();
	}

	tryAgain = () => {
		this.setState({podcastInfo:null,isLoading:false});
	}

	render() {
		if (!this.state.podcastInfo) {
			if (!this.state.isLoading) {
				let feedUrl = getUrlQueryParameterByName('feedurl', window.location.href.split('/?')[1]);
				this.getPodcast(feedUrl);
			}
			return(
				<div class={'page-container'}>
				<Header title="Podcast" />
				<main class={'content content--is-loading ' + style.podcast + ' ' + style['podcast--empty']}>
					<h1>{this.props.name}</h1>
					{ this.state.isLoading && !this.state.errorMessage ? 
						<Loader /> 
						: 
						<div><p>{this.state.errorMessage}</p>
						<p><button onClick={this.tryAgain} class={'btn btn--cancel margin--right'}>Try again</button> <Link href={'/podcasts'} class={'btn btn--search'}>Find other podcasts</Link></p></div>
					}
				</main>
				</div>
			);
		} else {
			document.title = this.state.podcastInfo.name + ' - ' + this.state.baseDocTitle;
			return (
				<div class={'page-container'}>
				<Header title={this.state.podcastInfo.name} sharetext={'Listen to this podcast at 1tuner.com'} />
				<div class={style.pageheader}>
					<h1 class={'main-title'}>{this.state.podcastInfo.name}
					<small class={'main-subtitle main-subtitle--loud'}>{this.state.podcastInfo.langObj ? this.state.podcastInfo.langObj.flag : null} Podcast</small></h1>
				</div>
				<main class={'content ' + (style.podcast)}>
					<div class={style.start}>
						<img class={style.artwork} src={(this.state.podcastInfo.artworkUrl600 ? this.state.podcastInfo.artworkUrl600 : this.state.podcastInfo.artworkUrl)} alt={this.state.podcastInfo.name} />
						<div class={style.description}>{removeHtml(this.state.podcastInfo.description)}</div>
					</div>
					<div class={style.end}>
						{this.state.podcastInfo.episodes ? 
						<ul class={style['podcast-episode__list']}>
						{this.state.podcastInfo.episodes.map(ep => (
							<li class={style['podcast-episode__item'] + (ep.isPlaying ? ' ' + style['podcast-episode__item--is-playing'] : '')}>
								<button data-href={ep.url} onClick={this.playEpisode.bind(this)} class={style['btn--play-episode'] + ' btn btn--play'}></button>
								<b>{ep.title}</b> ({ep.duration}{ep.secondsElapsed ? ' - played ' + getTimeFromSeconds(ep.secondsElapsed) : ''})<br />
								{removeHtml(ep.description)}
							</li>
						))}
						</ul>
						: (this.state.errorMessage ? 
							<div><p>{this.state.errorMessage}</p>
							<p><button onClick={this.tryAgain} class={'btn btn--cancel margin--right'}>Try again</button> <Link href={'/podcasts'} class={'btn btn--search'}>Find other podcasts</Link></p></div> 
							: <Loader />)}
					</div>
				</main>
				</div>
			);
		}
	}
}