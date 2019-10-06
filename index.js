import './style/index.scss';

import { h, Component } from 'preact';
import { Router } from 'preact-router';

import FilterPanel from './components/filterpanel';
import Nav from './components/nav';
import Footer from './components/footer';
import Home from './routes/home';
import Stations from './routes/stations';
import Podcasts from './routes/podcasts';
import Podcast from './routes/podcast';
import Station from './routes/station';
import Planner from './routes/planner';
import Planning from './routes/planning';
import PlanningEdit from './routes/planning-edit';
import About from './routes/about';
import Error from './routes/error';
import { version as AppVersion } from './package.json';
import { get, set } from './utils/idb-keyval';
import * as Languages from './assets/data/languages.json';

export default class App extends Component {
	constructor(props) {
		super(props);
		this.state = {
			store: null,
			listeningMode: 0,
			featured: null,
			station: null,
			stationList: null,
			lastStationList: null,
			podcast: null,
			podcastList: null,
			planning: null,
			planningList: null,			
			languageList: null,
			showFilterPanel:false,
			enableFilterPanel:false,
			stationsLoading:false,
			languagesLoading:false,
			lastPodcastSearchQuery:null,
			lastPodcastSearchResult:null,
			version: AppVersion,
			userVersion: null,
		};
		let self = this;
		if (typeof indexedDB !== 'undefined') {
			get('lm').then(val => self.setState({listeningMode: val ? val : 0}));
			get('version').then(val => self.setState({userVersion: val}));
			get('station').then(val => self.setState({station: val}));
			get('planning').then(val => self.setState({planning: val}));
			get('planning-list').then(val => self.setState({planningList: val}));
			get('language-list').then(val => self.setState({languageList: val}));
			get('podcast-list').then(val => self.setState({podcastList: val}));
		}
	}

	render() {
		if (this.state.stationList == null && !this.state.stationsLoading) {
			this.setIsLoading(1, true);
			if (typeof indexedDB !== 'undefined') {
				let self = this;
				get('station-list').then(val => self.loadStationList(val));
			} else {
			  this.loadStationList();
			}
		}
		if (this.state.languageList == null && !this.state.languagesLoading) {
			this.setIsLoading(2, true);
			this.loadLanguageList();
		}
		if (this.state.planningList == null) {
			this.loadPlanningList();
		}
		return (
		<div id="app">
			<Nav />
			{this.state.enableFilterPanel ?
			<FilterPanel setLanguageList={this.setLanguageList.bind(this)} languageList={this.state.languageList} showFilterPanel={this.state.showFilterPanel} toggleFilterPanel={this.toggleFilterPanel.bind(this)} />
			:
			null
			}
			<Router onChange={this.handleRoute.bind(this)}>
				<Home path="/" planningList={this.state.planningList} fullStationList={this.state.stationList} stationList={this.state.lastStationList} podcastList={this.state.podcastList} featured={this.state.featured} changeStation={this.changeStation.bind(this)} changePlanning={this.changePlanning.bind(this)} />
				<Stations path="/radio-stations" stationList={this.state.stationList} changeStation={this.changeStation.bind(this)} languageList={this.state.languageList} toggleFilterPanel={this.toggleFilterPanel.bind(this)} showFilterPanel={this.state.showFilterPanel} />
				<Station path="/radio-station/:id?" stationList={this.state.stationList} languageList={this.state.languageList} changeStation={this.changeStation.bind(this)} />
				<Planner path="/planner" planningList={this.state.planningList} stationList={this.state.stationList} changePlanning={this.changePlanning.bind(this)} />
				<Planning path="/planning/:name/:params?" planningList={this.state.planningList} stationList={this.state.stationList} addPlanning={this.addPlanning.bind(this)} deletePlanning={this.deletePlanning.bind(this)} changePlanning={this.changePlanning.bind(this)}/>
				<PlanningEdit path="/planning-edit/:name?/:params?" planningList={this.state.planningList} languageList={this.state.languageList} stationList={this.state.stationList} addPlanning={this.addPlanning.bind(this)} resetPlanningList={this.resetPlanningList.bind(this)} />
				<Podcasts path="/podcasts" latestPodcastSearchResult={this.latestPodcastSearchResult.bind(this)} searchQuery={this.state.lastPodcastSearchQuery} lastSearchResult={this.state.lastPodcastSearchResult} podcastList={this.state.podcastList} languageList={this.state.languageList} />
				<Podcast path="/podcast/:name/:params?" savePodcastHistory={this.savePodcastHistory.bind(this)} podcastList={this.state.podcastList} lastPodcastSearchResult={this.state.lastPodcastSearchResult} playEpisode={this.playPodcastEpisode.bind(this)} />
				<About path="/about" version={this.state.version} />
				<Error type="404" default />
			</Router>
			<Footer onRef={ref => (this.child = ref)} listeningMode={this.state.listeningMode} stationList={this.state.stationList} podcast={this.state.podcast} planning={this.state.planning} station={this.state.station} setPodcastEpisodeTimeElapsed={this.setPodcastEpisodeTimeElapsed.bind(this)} closeFooter={this.closeFooter.bind(this)} />
		</div>
		);
	}

	saveLocal = (AInit) => {
		if (typeof indexedDB !== 'undefined') {
			//console.log('saveLocal');
			set('lm', this.state.listeningMode);
			set('station', this.state.station);
			set('planning', this.state.planning);
			set('planning-list', this.state.planningList);
			set('podcast-list', this.state.podcastList);
			set('language-list', this.state.languageList);
			set('last-station-list', this.state.lastStationList);
			if (AInit) {
				set('version', this.state.version);
				set('station-list', this.state.stationList);
			}
		}
	}

	addToLastStationList = (AStation) => {
		let lsIndex = -1;
		let stationItem = null;
		let lsArray = this.state.lastStationList;
		if (lsArray) {
			for (var i=0; i<lsArray.length; i++) {
				if (lsArray[i].id == AStation) {
					stationItem = lsArray[i];
					lsIndex = i;
					break;
				}
			}
			if (lsIndex >= 0) {
				lsArray.splice(lsIndex, 1);
				lsArray.unshift(stationItem);
				this.setState({lastStationList:lsArray});
				this.saveLocal();
				return;
			}
			if (this.state.stationList) {
				for (var i=0; i<this.state.stationList.length; i++) {
					if (this.state.stationList[i].id == AStation) {
						stationItem = this.state.stationList[i];
						break;
					}
				}
				if (stationItem) {
					lsArray.splice(lsIndex, 1);
					lsArray.unshift(stationItem);
					this.setState({lastStationList:lsArray});
					this.saveLocal();
				}
			} 
		}		
	}

	changeStation = (AStation, AForcePlay) => {
		if (typeof AStation !== 'undefined' && AStation!=this.state.station) {
			this.addToLastStationList(AStation);
			this.setState({
				listeningMode: 1,
				station: AStation,
				planning: null
			});
			this.saveLocal();
		}
		if (AForcePlay && this.child) {
			this.child.forcePlay(AForcePlay);
		}
	}
	
	playPodcastEpisode = (APodcast, AForcePlay) => {
		if (APodcast) {
			this.setState({
				listeningMode: 3,
				podcast: APodcast
			});
			this.saveLocal();
			if (AForcePlay && this.child) {
				this.child.forcePlay(AForcePlay);
			}
		}
	}

	setPodcastEpisodeTimeElapsed = (AFeedUrl, AMediaUrl, ASeconds) => {
		let podcastList = this.state.podcastList;
		for (let i=0; i<podcastList.length; i++) {
			let podcast = podcastList[i];
			if (!podcast || podcast.feedUrl!=AFeedUrl || !podcast.episodes || !podcast.episodes.length) {
				continue;
			}
			for (let j=0;j<podcast.episodes.length; j++) {
				if (podcast.episodes[j].url==AMediaUrl) {
					podcastList[i].episodes[j].secondsElapsed = ASeconds;
					this.setState({podcastList: podcastList});
					this.saveLocal();
					return;
				}
			}
		}
	}

	changePlanning = (APlanning, AForcePlay) => {
		if (APlanning && !this.state.planning || (this.state.planning && APlanning.href!=this.state.planning.href)) {
			this.setState({
				listeningMode: 2,
				station: null,
				planning: APlanning
			});
			this.saveLocal();
		}
		if (AForcePlay && this.child) {
			this.child.forcePlay(AForcePlay);
		}
	}	

	toggleFilterPanel = () => {
		var show = !this.state.showFilterPanel;
		this.setState({showFilterPanel:show}); 
	}

	indexOfPlanningList = (APlanningHref) => {
		if (this.state.planningList) {
			for (let i=0; i<this.state.planningList.length; i++) {
				if (this.state.planningList[i].href==APlanningHref) {
					return i;
				}
			}
		}
		return -1;
	}

	deletePlanning = (APlanningUrl) => {
		APlanningUrl = APlanningUrl.substr(APlanningUrl.indexOf('/planning'));
		let sList = this.state.planningList || [];
		let puIndex = this.indexOfPlanningList(APlanningUrl);
		if (puIndex >= 0) {
			sList.splice(puIndex, 1);
			this.setState({
				planningList: sList
			});
			this.saveLocal();
		}
	}

	addPlanning = (APlanningItem) => {
		if (APlanningItem && APlanningItem.href) {			
			if (this.indexOfPlanningList(APlanningItem.href)<0) {
				let sList = this.state.planningList || [];
				sList.push(APlanningItem);
				this.setState({
					planningList: sList
				});
				this.saveLocal();
			}
		}
	}

	resetPlanningList = () => {
		if (this.state.planningList) {
			this.setState({
				planningList: null
			});
		}
	}

	latestPodcastSearchResult = (ASearchQuery, ASearchResult) => {
		this.setState({
			lastPodcastSearchQuery: ASearchQuery,
			lastPodcastSearchResult: ASearchResult
		});
	}

	savePodcastHistory = (APodcast) => {
		let podcastArray = this.state.podcastList || [];
		let pcIndex = -1;
		for (let i=0; i<podcastArray.length; i++) {
			if (podcastArray[i].feedUrl == APodcast.feedUrl) {
				pcIndex = i;
				break;
			}
		}
		if (pcIndex >= 0) {
			podcastArray.slice(pcIndex, 1);			
		}
		podcastArray.unshift(APodcast);
		if (podcastArray.length>100) {
			podcastArray.slice(0, 100);
		}
		this.setState({
			podcastList: podcastArray
		});
		this.saveLocal();
	}

	closeFooter = () => {
		this.setState({
			listeningMode: 0,
			station: null,
			planning: null
		});
		this.saveLocal();
	}
	
	handleRoute = (e) => {
		if (e.url=='/radio-stations' || e.url=='/radio-stations/') {
			this.setState({enableFilterPanel:true});
    } else {
			this.setState({enableFilterPanel:false});
		}
	}
	
	setIsLoading = (ALoadingType, AIsLoading) => {
		if (ALoadingType==1) {
			this.setState({stationsLoading:AIsLoading});
		} else if(ALoadingType==2) {
			this.setState({languagesLoading:AIsLoading});
		}
	}
	
	loadLanguageList = () => {
		let self = this;
		if (!this.state.languageList || this.state.languageList.length==0) {
			let selectedLanguages = [];
			if (typeof navigator !== 'undefined') {
				if (navigator.languages) {
					navigator.languages.forEach(e => selectedLanguages.push(e.toLowerCase()));
				} else if (navigator.language){
					selectedLanguages.push(navigator.language.toLowerCase());
				}
			}
			let items = Languages;
			let langs = [];
			for (let item in items) {
				let country = items[item].country_en;
				if (!country) country = items[item].country;
				langs.push({
					id: item,
					abbr: items[item].abbr,
					displayorder: items[item].displayorder, 
					name: items[item].name,
					country: country,
					flag: items[item].flag,
					active: (selectedLanguages.indexOf(item.toLowerCase())!=-1),
					preferred: (selectedLanguages.length && selectedLanguages[0]==item)
				});
			}
			langs.sort(function(a, b) {
				var startA = a.displayorder;
				var startB = b.displayorder;
				if (startA < startB) {
					return -1;
				}
				if (startA > startB) {
					return 1;
				}
				return 0;
			});
			self.setLanguageList(langs);
		}
	}
	loadStationList = (AStationList) => {
		this.setIsLoading(1, true);
		if (AStationList && this.state.version == this.state.userVersion) {
			this.setStationList(AStationList, true);
			return;
		}
		let self = this;
		if (!this.state.stationList || this.state.stationList.length == 0 || this.state.version!=this.state.userVersion) {
			fetch('https://1tuner.com/assets/data/stations.json?v=' + this.state.version, {
				method: 'get'
			}).then((resp) => resp.json()).then(function(items) {
				let newState = [];
				for (let item in items) {
					newState.push({
						id: item,
						name: items[item].name,
						displayorder: items[item].displayorder,
						logosource: items[item].logosource,
						streams: items[item].streams,
						website: items[item].website,
						language: items[item].language,
						genres: items[item].genres
					});
				}
				newState.sort(function(a, b) {
					var startA = a.displayorder;
					var startB = b.displayorder;
					if (startA < startB) {
						return -1;
					}
					if (startA > startB) {
						return 1;
					}
					return 0;
				});
				self.setStationList(newState);				
			}).catch(function(err) {
			  // Error :(
				console.log(err);
			});
		}
	}
	loadFeatured = () => {
		let self = this;
		if (this.state.featured==null) {
			fetch('https://1tuner.com/assets/data/featured.json?v=' + this.state.version, {
				method: 'get'
			}).then((resp) => resp.json()).then(function(items) {
				if (items && items.length) {
					let newState = {
						stationItem: self.getStation(items[0].station),
						description: items[0].description
					}
					self.setState({featured:newState});
				}
			}).catch(function(err) {
				// Error :(
			});
		}
	}
	loadPlanningList = () => {
		if (!this.state.planningList || this.state.planningList.length == 0) {
			this.setPlanningList([{
				href: '/planning/Radio%202.5/?h0=3fm&h6=radio2&h9=3fm&h14=radio2&h18=3fm&h22=radio2',
				name: 'Radio 2.5',
				color: 'rgba(110, 156, 140, 0.75)',
				schedule: [
					{
						'startHour': 0,
						'endHour': 6,
						'station': '3fm'
					},
					{
						'startHour': 6,
						'endHour': 9,
						'station': 'radio2'
					},
					{
						'startHour': 9,
						'endHour': 14,
						'station': '3fm'
					},
					{
						'startHour': 14,
						'endHour': 18,
						'station': 'radio2'
					},
					{
						'startHour': 18,
						'endHour': 22,
						'station': '3fm'
					},
					{
						'startHour': 22,
						'endHour': 24,
						'station': 'radio2'
					}
				]
			}]);
		}
	}

	getStation = (AStation) => {
    if (!this.state.stationList || !this.state.stationList.length) {
      return null;
    }
    let Result = null;
    for (let i=0;i<this.state.stationList.length;i++) {
      if (this.state.stationList[i].id==AStation) {
        Result = this.state.stationList[i];
        break;
      }
    }
		return Result;
	}

	setLanguageList = (ALanguageList) => {
		if(ALanguageList) {
			this.setState({
				languageList: ALanguageList
			});
			this.saveLocal();
		}
		this.setIsLoading(2, false);
	}
	setStationList = (AStationList, ANoSaveLocal) => {
		if(AStationList) {
			this.setState({
				stationList: AStationList
			});
			if(!ANoSaveLocal) this.saveLocal(true);
		}
		this.setLastStationList();
		this.loadFeatured();
		this.setIsLoading(1, false);
	}
	loadLastStationList = () => {
		if (!this.state.lastStationList || !this.state.lastStationList.length) {
			let self = this;
			get('last-station-list').then(val => {
				self.setLastStationList(val);
			});
		}
	}
	setLastStationList = (ALastStationList) => {
		if (ALastStationList) {
			this.setState({
				lastStationList: ALastStationList
			});
			return;
		} 
		let stationList = this.state.stationList;
		let lastStations = [];
		for (var i=0; i<10; i++) {
			if (stationList.length <= i) break;
			lastStations.push(stationList[i]);
		}
		this.setState({
			lastStationList: lastStations
		});
		this.saveLocal();
	}
	setPlanningList = (APlanningList) => {
		if (APlanningList) {
			this.setState({
				planningList: APlanningList
			});
			this.saveLocal();
		}
	}
}