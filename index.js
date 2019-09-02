import './style/index.scss';

import { h, Component } from 'preact';
import { Router } from 'preact-router';

import FilterPanel from './components/filterpanel';
import Nav from './components/nav';
import Footer from './components/footer';
import Home from './routes/home';
import Stations from './routes/stations';
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
			stationList: null,
			lastStationList: null,
			station: null,
			planningList: null,
			planning: null,
			languageList: null,
			showFilterPanel:false,
			enableFilterPanel:false,
			stationsLoading:false,
			languagesLoading:false,
			version: AppVersion,
			userVersion: null,
		};
		let self = this;
		if (typeof indexedDB !== 'undefined') {
			get('lm').then(val => self.setState({listeningMode: val ? val : 0}));
			get('version').then(val => self.setState({userVersion: val}));
			get('station-list').then(val => self.setState({stationList: val}));
			get('station').then(val => self.setState({station: val}));
			get('planning').then(val => self.setState({planning: val}));
			get('planning-list').then(val => self.setState({planningList: val}));
			get('language-list').then(val => self.setState({languageList: val}));
			get('last-station-list').then(val => self.setState({lastStationList: val}));
		}
	}

	render() {
		if (this.state.stationList == null && !this.state.stationsLoading) {
			this.setIsLoading(1, true);
			this.loadStationList();
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
				<Home path="/" planningList={this.state.planningList} fullStationList={this.state.stationList} stationList={this.state.lastStationList} featured={this.state.featured} changeStation={this.changeStation.bind(this)} changePlanning={this.changePlanning.bind(this)} />
				<Stations path="/radio-stations" stationList={this.state.stationList} changeStation={this.changeStation.bind(this)} languageList={this.state.languageList} toggleFilterPanel={this.toggleFilterPanel.bind(this)} showFilterPanel={this.state.showFilterPanel} />
				<Station path="/radio-station/:id?" stationList={this.state.stationList} languageList={this.state.languageList} changeStation={this.changeStation.bind(this)} />
				<Planner path="/planner" planningList={this.state.planningList} stationList={this.state.stationList} changePlanning={this.changePlanning.bind(this)} />
				<Planning path="/planning/:name/:params?" planningList={this.state.planningList} stationList={this.state.stationList} addPlanning={this.addPlanning.bind(this)} deletePlanning={this.deletePlanning.bind(this)} changePlanning={this.changePlanning.bind(this)}/>
				<PlanningEdit path="/planning-edit/:name?/:params?" planningList={this.state.planningList} languageList={this.state.languageList} stationList={this.state.stationList} addPlanning={this.addPlanning.bind(this)} resetPlanningList={this.resetPlanningList.bind(this)} />
				<About path="/about" version={this.state.version} />
				<Error type="404" default />
			</Router>
			<Footer onRef={ref => (this.child = ref)} listeningMode={this.state.listeningMode} stationList={this.state.stationList} planning={this.state.planning} station={this.state.station} closeFooter={this.closeFooter.bind(this)} />
		</div>
		);
	}

	saveLocal = (AInit) => {
		if (typeof indexedDB !== 'undefined') {
			set('lm', this.state.listeningMode);
			set('station', this.state.station);
			set('planning', this.state.planning);
			set('planning-list', this.state.planningList);
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
				if(stationItem) {
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
		if(this.state.planningList) {
			for(let i=0; i<this.state.planningList.length; i++) {
				if(this.state.planningList[i].href==APlanningHref) {
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

	closeFooter = () => {
		this.setState({
			listeningMode: 0,
			station: null,
			planning: null
		});
		this.saveLocal();
	}
	
	handleRoute = (e) => {
		if(e.url=='/radio-stations' || e.url=='/radio-stations/') {
			this.setState({enableFilterPanel:true});
    } else {
			this.setState({enableFilterPanel:false});
		}
	}
	
	setIsLoading = (ALoadingType, AIsLoading) => {
		if(ALoadingType==1) {
			this.setState({stationsLoading:AIsLoading});
		} else if(ALoadingType==2) {
			this.setState({languagesLoading:AIsLoading});
		}
	}
	
	loadLanguageList = () => {
		let self = this;
		if(!this.state.languageList || this.state.languageList.length==0) {
			let selectedLanguages = [];
			if(typeof navigator !== 'undefined') {
				if(navigator.languages) {
					navigator.languages.forEach(e => selectedLanguages.push(e.toLowerCase()));
				} else if(navigator.language){
					selectedLanguages.push(navigator.language.toLowerCase());
				}
			}
			let items = Languages;
			let langs = [];
			for (let item in items) {
				let country = items[item].country_en;
				if(!country) country = items[item].country;
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
	loadStationList = () => {
		this.setIsLoading(1, true);
		let self = this;
		if (!this.state.stationList || this.state.stationList.length == 0 || this.state.version!=this.state.userVersion) {
			fetch('/assets/data/stations.json?v=' + this.state.version, {
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
				if (!self.state.lastStationList || !self.state.lastStationList.length) {
					let lastStations = [];
					for (var i=0; i<10; i++) {
						if(newState.length<=i) break;
						lastStations.push(newState[i]);
					}
					self.setLastStationList(lastStations);
				}
			}).catch(function(err) {
			  // Error :(
			});
		}
	}
	loadFeatured = () => {
		let self = this;
		if (this.state.featured==null) {
			fetch('/assets/data/featured.json?v=' + this.state.version, {
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
    if(!this.state.stationList || !this.state.stationList.length) {
      return null;
    }
    let Result = null;
    for(let i=0;i<this.state.stationList.length;i++) {
      if(this.state.stationList[i].id==AStation) {
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
	setStationList = (AStationList) => {
		if(AStationList) {
			this.setState({
				stationList: AStationList
			});
			this.saveLocal(true);
		}
		this.loadFeatured();
		this.setIsLoading(1, false);
	}
	setLastStationList = (ALastStationList) => {
		if(ALastStationList) {
			this.setState({
				lastStationList: ALastStationList
			});
			this.saveLocal();
		}
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