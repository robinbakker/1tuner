import { h, Component } from 'preact';
import style from './style';
import Loader from '../../components/loader';
import Header from '../../components/header';
import StationList from '../../components/stationlist';
import PodcastList from '../../components/podcastlist';
import { Link } from 'preact-router/match';
import { getFlagEmojiFromLanguage } from '../../utils/misc';

export default class Station extends Component {
	constructor(props) {
    super(props);
		this.state = {
			baseDocTitle: 'Radio Station - Listen now at 1tuner.com',
			currentStation: null,
			relatedStationList: [],
			podcastList: []
		};
	}

	getStation = (AStation) => {
    if (!AStation || !this.props.stationList || !this.props.stationList.length) {
      return null;
		}
    let Result = null;
		let stationList = this.props.stationList;		
    for (let i=0; i < stationList.length; i++) {
      if (stationList[i].id == AStation) {
				Result = stationList[i];
        break;
      }
		}
		return Result;
	}

	getSameGenreStations = (AStation) => {
    if (!AStation.genres || !Array.isArray(AStation.genres) || !this.props.stationList || !this.props.stationList.length) {
      return null;
		}
		let genreArrayString = JSON.stringify(AStation.genres.sort());
    let result = [];
		let stationList = this.props.stationList;		
    for (let i = 0; i < stationList.length; i++) {
			if (stationList[i].id==AStation.id) {
				continue;
			}
			let thisStationGenres = stationList[i].genres;
      if (thisStationGenres && Array.isArray(thisStationGenres)) {
				if (JSON.stringify(thisStationGenres.sort()) === genreArrayString) {
					result.push(stationList[i]);
				}
      }
		}		
		return result;
	}

	changeStation = (AStationID) => {
		let stationID = AStationID;
		if (typeof stationID !== 'string') {
			stationID = this.state.currentStation.id;
		}
		this.props.changeStation(stationID, true);
	}

	getPodcast = (AFeedUrl) => {
		for (let i = 0; i < this.props.podcastList.length; i++) {
			if (this.props.podcastList[i].feedUrl == AFeedUrl) {
				return this.props.podcastList[i];
			}
		}
		return null;
	}

	loadData = () => {
		let station = this.getStation(this.props.id);
		if (station) {
			document.title = station.name + ' - ' + this.state.baseDocTitle;
		}
		var podcastList = [];
		if (station.podcasts && station.podcasts.length && this.props.podcastList && this.props.podcastList.length) {
			for (let i = 0; i < station.podcasts.length; i++) {
				let podcastItem = this.getPodcast(station.podcasts[i]);
				if (podcastItem) {
				  podcastList.push(podcastItem);
				}
			}			
		}
		let relatedStationList = this.getSameGenreStations(station) || [];
		let self = this;
		if (station.related && station.related.length) {
			station.related.forEach(function(stationid) {
				if (!relatedStationList.filter(relStation => relStation.id==stationid).length) {
					relatedStationList.push(self.getStation(stationid));
				}
			});
		}
		if (relatedStationList && relatedStationList.length) {
			relatedStationList.sort(function(keyA, keyB) {
				if (keyA.language==keyB.language) {
					return 0;
				}
				if (keyA.language==station.language) {
					return -1;
				}
				if (keyB.language==station.language) {
					return 1;
				}
				return 0;
			});
		}
		this.setState({currentStation: station, relatedStationList: relatedStationList, podcastList: podcastList});
	}

	shouldComponentUpdate() {
		if (!this.state.currentStation && this.props.stationList && this.props.stationList.length) {
			this.loadData();
		}
	}

	render({id,stationList},{currentStation,relatedStationList,podcastList}) {	
		if (currentStation && currentStation.id==id) {
			return (
				<div class={'page-container'}>
				<Header title={currentStation.name} inverted={true} sharetext={'Listen now at 1tuner.com'} />
				<main class={'content ' + (style.station)}>
					<header class={style.header} style={'background-image:url(' + currentStation.logosource +')'}>
						<div class={style['header__bg-image-container']}>
							<img class={style['header__bg-image']} alt={currentStation.name} src={currentStation.logosource} /> 
						</div>
						<div class={style['header__content']}>
							<div class={style['header__title']}>
								<img class={style['header__image']} alt={currentStation.name} src={currentStation.logosource} />
								<h1 class={'main-title main-title--inverted'}>{currentStation.name}
								<small class={'main-subtitle main-subtitle--inverted'}>{getFlagEmojiFromLanguage(currentStation.language)} Radio station</small></h1>
							</div>
							{currentStation.website ?
							<p><a href={currentStation.website} class={'link--inverted'} target={'_blank'} rel={'noopener'}>{currentStation.website}</a></p>
							:
							null }
						</div>
						<div class={'btn-container ' + style['header__button']}>
							<button onClick={this.changeStation.bind(this)} class={'btn btn--play btn--big'}>Listen now</button>
						</div>
					</header>
					{podcastList && podcastList.length ?
						<article class={'content__section ' + style.related}>
							<header class={'section-header'}>
								<h3 class={'section-title'}>Podcasts</h3>
								<Link href={'/podcasts/?q=' + currentStation.name} native class="btn btn--secondary btn--float-right">More</Link>
							</header>
							<div>
								<PodcastList podcastList={podcastList} limitCount={20} horizontal={true} small={true} />
							</div>
						</article> 
						: null
					}
					{relatedStationList && relatedStationList.length ?
						<article class={'content__section ' + style.related}>
							<header class={'section-header'}>
								<h3 class={'section-title'}>Suggested stations</h3>
							</header>
							<div>
								<StationList stationList={relatedStationList} useLinksOnly={true} horizontal={true} small={true} changeStation={this.changeStation.bind(this)} limitCount={10}  />
							</div>
						</article> 
						: null
					}
				</main>
				</div>
			);
		} else {
			if (stationList && stationList.length) {
				this.loadData();
			}
			return(
				<div class={'page-container'}>
				<Header title="Station" />
				<main class={'content content--is-loading ' + (style.station)}>
					<Loader />
				</main>
				</div>
			);
		}
	}
}