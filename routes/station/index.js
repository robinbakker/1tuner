import { h, Component } from 'preact';
import style from './style';
import Loader from '../../components/loader';
import Header from '../../components/header';

export default class Station extends Component {
	constructor(props) {
    super(props);
		this.state = {
			baseDocTitle: 'Radio Station - Listen now at 1tuner.com',
			currentStation: null
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
				Result.langObj = this.getLang(Result.language);
        break;
      }
		}
		return Result;
	}

	getLang = (ALang) => {
		if (!ALang || !this.props.languageList || !this.props.languageList.length) {
      return null;
		}
		let Result = null;
		let languageList = this.props.languageList;
		for (let i=0;i<languageList.length;i++) {
      if (languageList[i].id==ALang) {
        Result = languageList[i];
        break;
      }
		}
		return Result;
	}

	changeStation = () => {
		this.props.changeStation(this.state.currentStation.id, true);
	}

	loadData = () => {
		let station = this.getStation(this.props.id);
		this.setState({currentStation: station});
		if (station) {
			document.title = station.name + ' - ' + this.state.baseDocTitle;
		}
	}

	shouldComponentUpdate() {
		if (!this.state.currentStation && this.props.stationList && this.props.stationList.length) {
			this.loadData();
		}
	}

	render({stationList},{currentStation}) {	
		if (currentStation) {
			return (
				<div class={'page-container'}>
				<Header title={currentStation.name} sharetext={'Listen now at 1tuner.com'} />
				<main class={'content ' + (style.station)} style={'background-image:url(' + currentStation.logosource +')'}>
					<h1 class={'main-title'}>{this.state.currentStation.name}
					<small class={'main-subtitle main-subtitle--loud'}>{currentStation.langObj ? currentStation.langObj.flag : null} Radio station</small></h1>
					<div class={'btn-container'}>
						<button onClick={this.changeStation.bind(this)} class={'btn btn--play'}>Listen now</button>
					</div>
					{currentStation.website ?
					<p><a href={currentStation.website} target="_blank" rel="noopener">{currentStation.website}</a></p>
					:
					null }
				</main>
				</div>
			);
		} else {
			if(stationList && stationList.length) {
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