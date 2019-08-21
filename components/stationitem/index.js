import { h, Component } from 'preact';
import { Link } from 'preact-router/match';

export default class StationItem extends Component {
	constructor(props) {
    super(props);
	}
	setStation = (e) => {
		if (typeof e.currentTarget.attributes['data-station'] !== 'undefined') {
			this.props.changeStation(e.currentTarget.attributes['data-station'].value);
		}
		e.preventDefault();
	}
	getStyleString = (AString) => {
		let idNrTxt = AString.split('').map(c => c.charCodeAt()).reduce((v1, v2) => v1 + v2)+'';
		let offset = 140;
		let nr1 = parseInt(idNrTxt.substr(0,2));
		let nr2 = parseInt(idNrTxt.substr(-2));
		let r=(offset+nr1-90), g=(offset-nr1+AString.length),b=(offset+nr2);
		return 'background-color:rgba('+r+','+g+','+b+',.75)';
	}
	render() {
		if (this.props.stationItem) {
			return (
				<div class={'preset-list__item-content preset-list__item-content--station'}>
					<button data-station={this.props.stationItem.id} onClick={this.setStation} title={this.props.stationItem.name} class={'preset-list__button'  + (this.props.small ? ' preset-list__button--small' : '') + (this.props.stationItem.logosource ? '' : ' icon--station')} style={(this.props.stationItem.logosource ? '' : this.getStyleString(this.props.stationItem.id))}>
						{this.props.stationItem.logosource ? <img class="button__image" alt={this.props.stationItem.name} loading={'lazy'} src={this.props.stationItem.logosource} /> : null}
						<span class={'button__text' + (this.props.stationItem.logosource ? '' : ' button__text--inverted')}>{this.props.stationItem.name}</span>
					</button>
					<Link href={'/radio-station/'+this.props.stationItem.id} class={'preset-list__link'}>{this.props.stationItem.name}</Link>
				</div>
			);
		} else {
			return;
		}
	}
}