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

	render({podcastList, horizontal, small, errorMessage},{}) {
    if (!podcastList) {
      return(
				<div>
				{errorMessage ?
					<p class={style.error}>{errorMessage}</p>
					:
					<Loader />
				}
				</div>
      );
    } else {
       return (
				<div>
				{errorMessage ?
					<p class={style.error}>{errorMessage}</p>
					: null}
         <ul class={'preset-list' + (horizontal ? ' preset-list--horizontal' : ' preset-list--page')}>
          {podcastList.map(podcastItem => (
            <li class={'preset-list__item'}>
							<PodcastItem podcastItem={podcastItem} small={small} />
            </li>
          ))}
				</ul>
				</div>
      );
    }
	}
}
