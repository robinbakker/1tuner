import './style/index.css';

import { h, Component } from 'preact';
import { Router } from 'preact-router';
// import FilterPanel from './components/filterpanel';
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
import * as Featured from './assets/data/featured.json';

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
			presetStationList: null,
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
	}

	componentDidMount() {
		this.loadData();
	}

	loadData = async () => {
		let stationList = this.state.stationList || await get('station-list');

		let userVersion = await get('version');
		if (!stationList || !stationList.length || AppVersion != userVersion) {
			stationList = await this.loadStationList();
		}
		let listeningMode = await get('lm') || 0;
		let station = await get('station');
		let planning = await get('planning');
		let podcastList = await get('podcast-list');									
		let lastStationList = await get('last-station-list') || this.getLastStationList(stationList);
		let featured = this.loadFeatured(stationList);
						
		let languageList = this.state.languageList || await get('language-list') || this.loadLanguageList();
		let planningList = this.state.planningList || await get('planning-list') || this.loadPlanningList();

		this.setState({
			listeningMode: listeningMode,
			userVersion: userVersion,
			station: station,
			planning: planning,
			planningList: planningList,
			languageList: languageList,
			podcastList: podcastList,
			stationList: stationList,
			lastStationList: lastStationList,
			presetStationList: JSON.parse(JSON.stringify(lastStationList)), // For now, we are filling the preset list with the previous last played station list
			featured: featured
		});
	}

	render({}, {enableFilterPanel, showFilterPanel, listeningMode, languageList, station, stationList, lastStationList,
			planning, planningList, podcast, podcastList, featured, lastPodcastSearchQuery, lastPodcastSearchResult, version}) {		
		return (
		<div id="app">
			<Nav />
			<Router>
				<Home path="/" stationList={lastStationList} planningList={planningList} podcastList={podcastList} featured={featured} changeStation={this.changeStation.bind(this)} changePlanning={this.changePlanning.bind(this)} />
				<Stations path="/radio-stations" stationList={stationList} languageList={languageList} changeStation={this.changeStation.bind(this)} toggleFilterPanel={this.toggleFilterPanel.bind(this)} setLanguageList={this.setLanguageList.bind(this)} />
				<Station path="/radio-station/:id?" stationList={stationList} languageList={languageList} changeStation={this.changeStation.bind(this)} />
				<Planner path="/planner" planningList={planningList} stationList={stationList} changePlanning={this.changePlanning.bind(this)} />
				<Planning path="/planning/:name/:params?" planningList={planningList} stationList={stationList} addPlanning={this.addPlanning.bind(this)} deletePlanning={this.deletePlanning.bind(this)} changePlanning={this.changePlanning.bind(this)}/>
				<PlanningEdit path="/planning-edit/:name?/:params?" planningList={planningList} languageList={languageList} stationList={stationList} addPlanning={this.addPlanning.bind(this)} resetPlanningList={this.resetPlanningList.bind(this)} />
				<Podcasts path="/podcasts" latestPodcastSearchResult={this.latestPodcastSearchResult.bind(this)} searchQuery={lastPodcastSearchQuery} lastSearchResult={lastPodcastSearchResult} podcastList={podcastList} languageList={languageList} />
				<Podcast path="/podcast/:name/:params?" savePodcastHistory={this.savePodcastHistory.bind(this)} podcastList={podcastList} lastPodcastSearchResult={lastPodcastSearchResult} playEpisode={this.playPodcastEpisode.bind(this)} />
				<About path="/about" version={version} />
				<Error type="404" default />
			</Router>
			<Footer onRef={ref => (this.child = ref)} listeningMode={listeningMode} stationList={stationList} tuneToStation={this.tuneToStation.bind(this)} podcast={podcast} planning={planning} station={station} setPodcastEpisodeTimeElapsed={this.setPodcastEpisodeTimeElapsed.bind(this)} closeFooter={this.closeFooter.bind(this)} />
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
			if(this.state.lastStationList) {
				set('last-station-list', this.state.lastStationList);
			}
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
				this.setState({lastStationList:lsArray}, () => {
					this.saveLocal();
				});
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
					this.setState({lastStationList:lsArray}, () => {
						this.saveLocal();
					});
				}
			} 
		}		
	}

	tuneToStation = (APrev) => {
		let presetList = this.state.presetStationList;
		let lastPlayedList = this.state.lastStationList;
		if (!presetList || presetList.length < 2 || !lastPlayedList || lastPlayedList.length < 2) {
			// something is wrong with the data, ignore tuning
			return;
		}
		if (!this.state.station) {
			this.changeStation(lastPlayedList[0].id, true);
		}
		let isFound = false;
		for (let i=0; i<presetList.length; i++) {
			if (presetList[i].id === this.state.station) {
				let newIndex = APrev ? i-1 : i+1;
				if (newIndex >= presetList.length) {
					newIndex = 0;
				} else if(newIndex < 0) {
					newIndex = presetList.length-1;
				}
				this.changeStation(presetList[newIndex].id, true);
				isFound = true;
				break;
			}
		}
		if (!isFound) {
			let stationItem = null;
			for (var i=0; i<this.state.stationList.length; i++) {
				if (this.state.stationList[i].id == this.state.station) {
					stationItem = this.state.stationList[i];
					break;
				}
			}
			if (stationItem) {
				let insertIndex = 0;
				for (let i=0; i<presetList.length; i++) {
					// find the last played station in the presetlist, use this index for the insert
					if (presetList[i].id === lastPlayedList[1].id) { 
						insertIndex = i+1;
						if (insertIndex >= presetList.length) {
							insertIndex = 0;
						}
						break;
					}
				}
				presetList.splice(insertIndex, 0, stationItem);
				let newIndex = APrev ? insertIndex-1 : insertIndex+1;
				if (newIndex >= presetList.length) {
					newIndex = 0;
				} else if(newIndex < 0) {
					newIndex = presetList.length-1;
				}
				this.setState({
					presetStationList: presetList
				}, () => {
					this.changeStation(presetList[newIndex].id, true);
				});
			}
		}
	}

	changeStation = (AStation, AForcePlay) => {
		if (typeof AStation !== 'undefined' && AStation !== this.state.station) {
			this.addToLastStationList(AStation);
			this.setState({
				listeningMode: 1,
				station: AStation,
				planning: null
			}, () => {
				this.saveLocal();
			});
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
			}, () => {
				this.saveLocal();
				if (AForcePlay && this.child) {
					this.child.forcePlay(AForcePlay);
				}
			});
		}
	}

	setPodcastEpisodeTimeElapsed = (AFeedUrl, AMediaUrl, ASeconds) => {
		if(!AFeedUrl || !AMediaUrl || !ASeconds) {
			return;
		}
		let podcastList = this.state.podcastList;
		for (let i=0; i<podcastList.length; i++) {
			let podcast = podcastList[i];
			if (!podcast || podcast.feedUrl!=AFeedUrl || !podcast.episodes || !podcast.episodes.length) {
				continue;
			}
			for (let j=0; j<podcast.episodes.length; j++) {
				if (podcast.episodes[j].url==AMediaUrl) {
					podcast.episodes[j].secondsElapsed = ASeconds;
					this.savePodcastHistory(podcast);
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
			}, () => {
				this.saveLocal();
			});
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
			}, () => {
				this.saveLocal();
			});
		}
	}

	addPlanning = (APlanningItem) => {
		if (APlanningItem && APlanningItem.href) {			
			if (this.indexOfPlanningList(APlanningItem.href)<0) {
				let sList = this.state.planningList || [];
				sList.push(APlanningItem);
				this.setState({
					planningList: sList
				}, () => {
					this.saveLocal();
				});
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
		if (!APodcast || !APodcast.feedUrl) {
			return;
		}
		let podcastArray = this.state.podcastList || [];
		let pcIndexArray = [];
		for (let i=0; i<podcastArray.length; i++) {
			if (podcastArray[i].feedUrl == APodcast.feedUrl) {
				pcIndexArray.push(i);
			}
		}
		if (pcIndexArray.length) {
			pcIndexArray.forEach(function(pcIndex) {
				podcastArray.splice(pcIndex, 1);			
			});
		}
		podcastArray.unshift(APodcast);
		if (podcastArray.length>50) {
			podcastArray.slice(0, 50);
		}
		this.setState({
			podcastList: podcastArray
		}, () => {
			this.saveLocal();
		});
	}

	closeFooter = () => {
		this.setState({
			listeningMode: 0,
			station: null,
			planning: null
		}, () => {
			this.saveLocal();
			if (this.child) {
				this.child.forcePlay(true);
			}
		});		
	}
	
	loadLanguageList = () => {
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
		return langs;
	}
	loadStationList = async () => {
		let stationList = this.state.stationList
		if (!stationList || stationList.length == 0) {
			await fetch(window.location.origin + '/assets/data/stations.json?v=' + AppVersion, {
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
				stationList = newState;	
			}).catch(function(err) {
			  // Error :(
				console.log(err);
			});
		}
		return stationList;
	}
	loadFeatured = (AStationList) => {
		let newFeatured = this.state.featured; 
		if (!newFeatured) {
			let items = Featured.featured;
			if (items && items.length) {
				let newState = {
					stationItem: this.getStation(items[0].station, AStationList),
					description: items[0].description
				}
				newFeatured = newState;
			}
		}
		return newFeatured;
	}
	loadPlanningList = () => {
		return [{
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
		}];
	}

	getStation = (AStation, AStationList) => {
		let stationList = this.state.stationList || AStationList;
    if (!stationList || !stationList.length) {
      return null;
    }
    let Result = null;
    for (let i=0; i<stationList.length; i++) {
      if (stationList[i].id == AStation) {
        Result = stationList[i];
        break;
      }
    }
		return Result;
	}

	setLanguageList = (ALanguageList) => {
		if(ALanguageList) {
			this.setState({
				languageList: ALanguageList
			}, () => {
				this.saveLocal();
			});
		}
	}
	
	getLastStationList = (AStationList) => {
		let stationList = AStationList || this.state.stationList;
		if (!stationList) {
			return;
		}
		let lastStations = [];
		for (var i=0; i<10; i++) {
			if (stationList.length <= i) break;
			lastStations.push(stationList[i]);
		}
		return lastStations;
	}
	setPlanningList = (APlanningList) => {
		if (APlanningList) {
			this.setState({
				planningList: APlanningList
			}, () => {
				this.saveLocal();
			});
		}
	}
}