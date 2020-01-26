import { h, Component } from 'preact';
import { Link } from 'preact-router/match';
import { getColorString } from '../../utils/misc';

export default class PodcastItem extends Component {
	constructor(props) {
		super(props);
	}
	render() {
		if (this.props.podcastItem) {
			let pcLink = '/podcast/' + encodeURI(this.props.podcastItem.name) + '/?feedurl=' + encodeURI(this.props.podcastItem.feedUrl);
			return (
				<div class={'preset-list__item-content preset-list__item-content--podcast'}>
					<Link href={pcLink} title={this.props.podcastItem.name} class={'preset-list__button'  + (this.props.small ? ' preset-list__button--small' : '') + (this.props.podcastItem.artworkUrl ? '' : ' icon--podcast')} style={(this.props.podcastItem.artworkUrl ? '' : getColorString(this.props.podcastItem.collectionId))}>
						{this.props.podcastItem.artworkUrl ? 
						<div class="button__image-container">
							<img class={'button__image button__image--bg'} alt={this.props.podcastItem.name} src={this.props.podcastItem.artworkUrl} />
							<img class={'button__image'} alt={this.props.podcastItem.name} src={this.props.podcastItem.artworkUrl} /> 
						</div>
						: null}
						<span class={'button__text' + (this.props.podcastItem.artworkUrl ? '' : ' button__text--inverted')}>{this.props.podcastItem.name}</span>
					</Link>
					{this.props.small ? 
						null 
						:
						<div class={'preset-list__link-content'}>
							<Link href={pcLink} class={'preset-list__link'}>{this.props.podcastItem.name}</Link>
							{this.props.podcastItem.artistName ?
							<span class={'preset-list__link-description'}>{this.props.podcastItem.artistName}</span>
							: null}
						</div>
					}
				</div>
			);
		} else {
			return;
		}
	}
}