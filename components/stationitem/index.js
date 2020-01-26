import { h, Component } from 'preact';
import { Link } from 'preact-router/match';
import { getColorString, getFlagEmojiFromLanguage } from '../../utils/misc';

export default class StationItem extends Component {
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
						<Link href={stLink} title={this.props.stationItem.name} class={'preset-list__button'  + (this.props.small ? ' preset-list__button--small' : '') + (this.props.stationItem.logosource ? '' : ' icon--station')} style={(this.props.stationItem.logosource ? '' : getColorString(this.props.stationItem.id))}>
							{this.props.stationItem.logosource ? 
							<div class="button__image-container">
								<img class="button__image button__image--bg" alt={this.props.stationItem.name} src={this.props.stationItem.logosource} /> 
								<img class="button__image" alt={this.props.stationItem.name} src={this.props.stationItem.logosource} /> 
							</div>
							: null}
							<span class={'button__text' + (this.props.stationItem.logosource ? '' : ' button__text--inverted')}>{this.props.stationItem.name}</span>							
						</Link>
						:
						<button data-station={this.props.stationItem.id} onClick={this.setStation} title={this.props.stationItem.name} class={'preset-list__button'  + (this.props.small ? ' preset-list__button--small' : '') + (this.props.stationItem.logosource ? '' : ' icon--station')} style={(this.props.stationItem.logosource ? '' : getColorString(this.props.stationItem.id))}>
							{this.props.stationItem.logosource ? 
							<div class="button__image-container">
							<img class="button__image button__image--bg" alt={this.props.stationItem.name} src={this.props.stationItem.logosource} /> 
							<img class="button__image" alt={this.props.stationItem.name} src={this.props.stationItem.logosource} /> 
							</div>
							: null}
							<span class={'button__text' + (this.props.stationItem.logosource ? '' : ' button__text--inverted')}>{this.props.stationItem.name}</span>
						</button>
					}
					{this.props.small ? 
						null 
						:
						<div class={'preset-list__link-content'}>
							<Link href={stLink} class={'preset-list__link'}>{this.props.stationItem.name}</Link>
							<span class={'preset-list__link-description'}>{getFlagEmojiFromLanguage(this.props.stationItem.language)} Radio station</span>
						</div>
					}
					{this.props.small ?
						null
						:
						<button data-station={this.props.stationItem.id} onClick={this.setStation} title={'Play'} class={'btn btn--secondary btn--play'}></button>
					}
				</div>
			);
		} else {
			return;
		}
	}
}