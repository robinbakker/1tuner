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

	isLanguageSelected = (ALangID) => {
		if (!this.state.selectedLangArray || !ALangID) {
			return false;
		}
		if (this.state.selectedLangArray.indexOf(ALangID) != -1) {
			return true;
		}
		return false;
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

	loadData = () => {
		if (this.props.stationList && this.props.stationList.length>0) {
			let newState = this.props.stationList;
			if (this.props.stationSearchQuery && this.props.stationSearchQuery.length) {
				let stationList = newState;
				newState = [];
				this.setState({stationSearchQuery:this.props.stationSearchQuery});
				for (var i = 0; i < stationList.length; i++) {
					if(stationList[i].name.toLowerCase().indexOf(this.props.stationSearchQuery.toLowerCase())!=-1) {
						newState.push(stationList[i]);
					}
				}
			} else {
				this.setState({stationSearchQuery: null}); // reset search query
			}
			if (this.props.languageList && this.props.languageList.length) {
				let stationList = newState;
				newState = [];
				let selectedLangs = this.getActiveLangIDArray(this.props.languageList);
				this.setState({selectedLangArray:selectedLangs});
				for (var i = 0; i < stationList.length; i++) {
					let st = stationList[i];
					let langID = st.language.toLowerCase();
					if (this.isLanguageSelected(langID)) {
						//st.langObj = getLang(langID);
						newState.push(st);
					}
				}
			} else {
				this.setState({selectedLangArray: null}); // reset lang list
			}
			if (this.props.limitCount) {
				newState = newState.slice(0, this.props.limitCount);
			}
			this.setState({items: newState});			
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
			if((!this.state.stationSearchQuery || !this.state.stationSearchQuery.length)) {
				return false;
			} else {				
				return true;
			}
		} else {
			if((!this.state.stationSearchQuery || !this.state.stationSearchQuery.length) || this.state.stationSearchQuery!=this.props.stationSearchQuery) {
				return true;
			} else {				
				return false;
			}
		}
	}

	render() {
		if ((!this.state.items && this.props.stationList && this.props.stationList.length>0) || 
				(this.state.items && (this.isLanguageSelectionChanged() || this.isSearchQueryChanged()))) {
			this.loadData();
		}
    if (!this.state.items) {
      return(
        <Loader />
      );
    } else {
       return (
         <ul class={'preset-list' + (this.props.horizontal ? ' preset-list--horizontal' : ' preset-list--page')}>
          {this.state.items.map(stationItem => (
            <li class={'preset-list__item'}>
							<StationItem stationItem={stationItem} useLinksOnly={this.props.useLinksOnly} small={this.props.small} changeStation={this.changeStation.bind(this)} />
            </li>
          ))}
				</ul>
      );
    }
	}
}