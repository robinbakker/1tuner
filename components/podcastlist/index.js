import { h, Component } from 'preact';
import Loader from '../loader';
import PodcastItem from '../podcastitem';
import style from './style';

export default class PodcastList extends Component {
  constructor(props) {
    super(props);
    this.state = {			
			items: null,
			selectedLangArray: null,
			podcastSearchQuery: null
		};
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
		if ((!this.props.podcastSearchQuery || !this.props.podcastSearchQuery.length)) {
			if((!this.state.podcastSearchQuery || !this.state.podcastSearchQuery.length)) {
				return false;
			} else {				
				return true;
			}
		} else {
			if((!this.state.podcastSearchQuery || !this.state.podcastSearchQuery.length) || this.state.podcastSearchQuery!=this.props.podcastSearchQuery) {
				return true;
			} else {				
				return false;
			}
		}
	}

	render() {
    if (!this.props.podcastList) {
      return(
				<div>
				{this.props.errorMessage ? 
					<p class={style.error}>{this.props.errorMessage}</p>
					:
					<Loader />
				}
				</div>
      );
    } else {
       return (
				<div>
				{this.props.errorMessage ? 
					<p class={style.error}>{this.props.errorMessage}</p>
					: null}
         <ul class={'preset-list' + (this.props.horizontal ? ' preset-list--horizontal' : ' preset-list--page')}>
          {this.props.podcastList.map(podcastItem => (
            <li class={'preset-list__item'}>
							<PodcastItem podcastItem={podcastItem} small={this.props.small} />
            </li>
          ))}
				</ul>				
				</div>
      );
    }
	}
}