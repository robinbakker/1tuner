import { h, Component } from 'preact';
import { Link } from 'preact-router/match';
import { getColorString } from '../../utils/misc';

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
	render() {
		if (this.props.stationItem) {
			let stLink = '/radio-station/'+this.props.stationItem.id;
			return (
				<div class={'preset-list__item-content preset-list__item-content--station'}>
					{this.props.useLinksOnly ? 
						<Link href={stLink} title={this.props.stationItem.name} class={'preset-list__button'  + (this.props.small ? ' preset-list__button--small' : '') + (this.props.stationItem.logosource ? '' : ' icon--station')} style={(this.props.stationItem.logosource ? '' : getColorString(this.props.stationItem.logosource))}>
							{this.props.stationItem.logosource ? <img class="button__image" alt={this.props.stationItem.name} loading={'lazy'} src={this.props.stationItem.logosource} /> : null}
							<span class={'button__text' + (this.props.stationItem.logosource ? '' : ' button__text--inverted')}>{this.props.stationItem.name}</span>
						</Link>
						:
						<button data-station={this.props.stationItem.id} onClick={this.setStation} title={this.props.stationItem.name} class={'preset-list__button'  + (this.props.small ? ' preset-list__button--small' : '') + (this.props.stationItem.logosource ? '' : ' icon--station')} style={(this.props.stationItem.logosource ? '' : getColorString(this.props.stationItem.id))}>
							{this.props.stationItem.logosource ? <img class="button__image" alt={this.props.stationItem.name} loading={'lazy'} src={this.props.stationItem.logosource} /> : null}
							<span class={'button__text' + (this.props.stationItem.logosource ? '' : ' button__text--inverted')}>{this.props.stationItem.name}</span>
						</button>
					}
					<Link href={stLink} class={'preset-list__link'}>{this.props.stationItem.name}</Link>
				</div>
			);
		} else {
			return;
		}
	}
}