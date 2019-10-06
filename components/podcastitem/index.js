import { h, Component } from 'preact';
import { Link } from 'preact-router/match';
import { getColorString } from '../../utils/misc';

export default class PodcastItem extends Component {
	constructor(props) {
		super(props);
		this.state = {
		};
	}
	render() {
		if (this.props.podcastItem) {
			let pcLink = '/podcast/' + encodeURI(this.props.podcastItem.name) + '/?feedurl=' + encodeURI(this.props.podcastItem.feedUrl);
			return (
				<div class={'preset-list__item-content preset-list__item-content--podcast'}>
					<Link href={pcLink} title={this.props.podcastItem.name} class={'preset-list__button'  + (this.props.small ? ' preset-list__button--small' : '') + (this.props.podcastItem.artworkUrl ? '' : ' icon--podcast')} style={(this.props.podcastItem.artworkUrl ? '' : getColorString(this.props.podcastItem.collectionId))}>
						{this.props.podcastItem.artworkUrl ? <img class={'button__image'} alt={this.props.podcastItem.name} loading={'lazy'} src={this.props.podcastItem.artworkUrl} /> : null}
						<span class={'button__text' + (this.props.podcastItem.artworkUrl ? '' : ' button__text--inverted')}>{this.props.podcastItem.name}</span>
					</Link>
					<Link href={pcLink} class={'preset-list__link'}>{this.props.podcastItem.name}</Link>
				</div>
			);
		} else {
			return;
		}
	}
}