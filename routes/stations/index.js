import { h, Component } from 'preact';
import style from './style';
import StationList from '../../components/stationlist';
import Loader from '../../components/loader';
import Header from '../../components/header';

export default class Stations extends Component {
	constructor(props) {
		super(props);
		this.state = {
			searchQuery: null
		};
	}

	componentDidMount() {
		document.title = 'Radio Stations - 1tuner';		
	}

	changeStation = (AStation) => {
		this.props.changeStation(AStation);
	}

	toggleFilterPanel = () => {
		this.props.toggleFilterPanel();
	}

	setSearchQuery = (e) => {
		this.setState({searchQuery:e.target.value});
	}
	resetSearchQuery = () => {
		this.setState({searchQuery:''});
	}

	setSearchInputBlur = () => {
		if(typeof document != 'undefined') {
			document.body.classList.remove('search-focus');
		}
	}
	setSearchInputFocus = () => {
		if(typeof document != 'undefined') {
			document.body.classList.add('search-focus');
		}
	}
	onKeyDown = (e) => {
		if(e.keyCode===13) {
			e.preventDefault();
		}
		return false;
	}

	render() {
		if (!this.props.stationList) {			
			return(
				<div class={'page-container'}>
				<Header title="Radio Stations" />
				<main class={'content content--is-loading ' + (style.stations)}>
					<h1 class={'main-title'}>Radio Stations
					<small class={'main-subtitle'}>Listen to the radio 📻</small></h1>
					<Loader />
				</main>
				</div>
			);			
		} else {
			return (
				<div class={'page-container'}>
				<Header title="Radio Stations" sharetext={'Listen to online radio at 1tuner.com'} />
				<main class={'content ' + (style.stations) + ' ' + (this.props.showFilterPanel ? style['stations--show-panel'] : '')}>
					<h1 class={'main-title'}>Radio Stations
					<small class={'main-subtitle'}>Listen to the radio 📻</small></h1>
					<form class={style['form-search']}>
						<input type="text" placeholder="Find..." maxlength="100" required pattern="[a-zA-Z0-9\s]+" class={'textfield ' + style['textfield--search']} onFocus={this.setSearchInputFocus.bind(this)} onBlur={this.setSearchInputBlur.bind(this)} onKeyDown={this.onKeyDown} onInput={this.setSearchQuery.bind(this)} />
						<button class={style['btn-search-reset']} onClick={this.resetSearchQuery.bind(this)} type="reset">Reset</button>
					</form>
					<button class={'btn ' + style['btn--toggle-filter']} onClick={this.toggleFilterPanel.bind(this)}>Filter</button>
					<StationList languageList={this.props.languageList} useLinksOnly={false} stationList={this.props.stationList} stationSearchQuery={this.state.searchQuery} changeStation={this.changeStation.bind(this)} limitCount={100} />
				</main>
				</div>
			);
		}
	}
}