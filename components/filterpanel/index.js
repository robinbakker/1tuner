import { h, Component } from 'preact';
import style from './style';

export default class FilterPanel extends Component {
	constructor(props) {
    super(props);
	}

	countLanguagesSelected = () => {
		var result = 0;
		if (this.props.languageList) {
			for (var i = 0; i < this.props.languageList.length; i++) {
				if (this.props.languageList[i].active) {
					result++;
				}
			}
		}
		return result;
	}
	clickLanguage = (e) => {
		if (!e || !e.target || !this.props.languageList || !this.props.languageList.length) {
			return false;
		}
		let ResultArray = this.props.languageList;
		let isChanged = false;
		for (var i = 0; i < ResultArray.length; i++) {
			if (ResultArray[i].id == e.target.value) {
				if (ResultArray[i].active != e.target.checked) {
					ResultArray[i].active = e.target.checked;
					isChanged = true;
				}
				break;
			}
		}
		if(isChanged) {
			this.props.setLanguageList(ResultArray);
		}
	}
	clickAllLanguages = (e) => {
		if (!e || !e.target || !this.props.languageList || !this.props.languageList.length) {
			return false;
		}
		let ResultArray = this.props.languageList;
		let isChanged = false;
		for (var i=0; i<ResultArray.length; i++) {
			if (ResultArray[i].active != e.target.checked) {
				ResultArray[i].active = e.target.checked;
				isChanged = true;
			}
		}
		if (isChanged) {
			this.props.setLanguageList(ResultArray);
		}
	}

	clickNoLanguages = (e) => {
		if (!e || !e.target || !this.props.languageList || !this.props.languageList.length) {
			return false;
		}
		let resultArray = this.props.languageList;
		let isChanged = false;
		for (var i = 0; i < resultArray.length; i++) {
			if (resultArray[i].active != e.target.checked) {
				resultArray[i].active = e.target.checked;
				isChanged = true;
			}
		}
		if (isChanged) {
			this.props.setLanguageList(resultArray);
		}
	}
	
	toggleFilterPanel = (e) => {
		if (e && e.target && e.target.id=='filtercontainer') {
			if (this.props.showFilterPanel) {
				this.props.toggleFilterPanel();
			}
		}
	}

	render() {
		if (this.props.languageList) {
			let langSelectedCount = this.countLanguagesSelected();
			let allLanguagesSelected = this.props.languageList && langSelectedCount === this.props.languageList.length;
			return (
				<div id="filtercontainer" onClick={this.toggleFilterPanel.bind(this)} class={style['filter-panel-container'] + ' ' + (this.props.showFilterPanel ? style['filter-panel-container--show'] : '')}>
				<div class={style['filter-panel'] + ' ' + (this.props.showFilterPanel ? style['filter-panel--show'] : '')}>
					<div class={style['filter-panel-item']}>
						<h4 class={style['filter-panel-item__title']}>Regions</h4>
						<div class={style['filter-panel-item__content']}>
						<ul id="langselection" class={style['lang-selection']}>
							<li class={style['lang-selection__item']}><label><input name={'lang-all'} value={'all'} type="checkbox" onClick={this.clickAllLanguages.bind(this)} checked={allLanguagesSelected} />All / None</label></li>
							{this.props.languageList.map(langItem => (
								<li class={style['lang-selection__item']}><label><input name={'lang-' + langItem.id} value={langItem.id} type="checkbox" checked={langItem.active} onClick={this.clickLanguage.bind(this)} />{langItem.flag} {langItem.country}</label></li>
							))}
						</ul>
						</div>
					</div>
				</div>
				</div>
			);
		} else {
			return;
		}
	}
}