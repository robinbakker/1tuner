import { h, Component } from 'preact';
import Loader from '../loader';
import StationItem from '../stationitem';

export default class StationList extends Component {
  constructor(props) {
    super(props);
    this.state = {
			items: null,
			selectedLangArray: null,
			stationSearchQuery: null
		};
	}

	changeStation = (AStation) => {
		if(AStation) {
			this.props.changeStation(AStation);
		}
	}

	getActiveLangIDArray = (ALangList) => {
		let Result = [];
		for(var i=0;i<ALangList.length;i++) {
			if(ALangList[i].active) {
				Result.push(ALangList[i].id.toLowerCase());
			}
		}
		return Result;
	}

	isLanguageSelected = (ASelectedLangArray, ALangID) => {
		if (!ASelectedLangArray || !ALangID) {
			return false;
		}
		if (ASelectedLangArray.indexOf(ALangID) != -1) {
			return true;
		}
		return false;
	}

	getLang = (ALang) => {
		if (!ALang || !this.props.languageList || !this.props.languageList.length) {
      return null;
		}
		let result = null;
		let languageList = this.props.languageList;
		for (let i=0; i<languageList.length; i++) {
      if (languageList[i].id==ALang) {
        result = languageList[i];
        break;
      }
		}
		return result;
	}

	loadData = () => {
		if (this.props.stationList && this.props.stationList.length>0) {
			let stationSearchQuery = this.props.stationSearchQuery;
			let selectedLangs = null;
			let newState = this.props.stationList;
			if (stationSearchQuery && stationSearchQuery.length) {
				let stationList = newState;
				newState = [];
				for (var i = 0; i < stationList.length; i++) {
					if(stationList[i].name.toLowerCase().indexOf(this.props.stationSearchQuery.toLowerCase())!=-1) {
						newState.push(stationList[i]);
					}
				}
			}
			if (this.props.languageList && this.props.languageList.length && newState.length) {
				let stationList = newState;
				newState = [];
				selectedLangs = this.getActiveLangIDArray(this.props.languageList);
				for (var i = 0; i < stationList.length; i++) {
					let st = stationList[i];
					let langID = st.language.toLowerCase();
					if (this.isLanguageSelected(selectedLangs, langID)) {
						newState.push(st);
					}
				}
			}
			if (this.props.limitCount) {
				newState = newState.slice(0, this.props.limitCount);
			}
			this.setState({
				items: newState,
				selectedLangArray: selectedLangs,
				stationSearchQuery: stationSearchQuery
			});
		}
	}

	isLanguageSelectionChanged = () => {
		if (!this.props.languageList || !this.props.languageList.length) {
			if (!this.state.selectedLangArray || !this.state.selectedLangArray.length) {
				return false;
			} else {
				return true;
			}
		} else {
			let activeFromProp = this.getActiveLangIDArray(this.props.languageList);
			return (this.state.selectedLangArray && activeFromProp.join()!=this.state.selectedLangArray.join());
		}
	}

	isSearchQueryChanged = () => {
		if ((!this.props.stationSearchQuery || !this.props.stationSearchQuery.length)) {
			if ((!this.state.stationSearchQuery || !this.state.stationSearchQuery.length)) {
				return false;
			} else {
				return true;
			}
		} else {
			if ((!this.state.stationSearchQuery || !this.state.stationSearchQuery.length) || this.state.stationSearchQuery!=this.props.stationSearchQuery) {
				return true;
			} else {
				return false;
			}
		}
	}

	render({stationList, horizontal, useLinksOnly, small}, {items}) {
		if (!items || (this.isLanguageSelectionChanged() || this.isSearchQueryChanged())) {
			if(stationList && stationList.length) {
				this.loadData();
			}
      return(
        <Loader />
      );
    }
		return(
				<ul class={'preset-list' + (horizontal ? ' preset-list--horizontal' : ' preset-list--page')}>
				{items.map(stationItem => (
					<li class={'preset-list__item'}>
						<StationItem stationItem={stationItem} useLinksOnly={useLinksOnly} small={small} changeStation={this.changeStation.bind(this)} />
					</li>
				))}
			</ul>
		);
	}
}
