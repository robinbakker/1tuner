import { h, Component } from 'preact';
import { Link } from 'preact-router/match';
import { getColorString, slugify } from '../../utils/misc';

export default class PodcastItem extends Component {
	constructor(props) {
		super(props);
  }

	render({podcastItem, small}) {
		if (podcastItem) {
			let pcLink = '/podcast/' + slugify(podcastItem.name) + '/' + btoa(podcastItem.feedUrl);
			return (
				<div class={'preset-list__item-content preset-list__item-content--podcast'}>
					<Link href={pcLink} title={podcastItem.name} class={'preset-list__button'  + (small ? ' preset-list__button--small' : '') + (podcastItem.artworkUrl ? '' : ' icon--podcast')} style={(podcastItem.artworkUrl ? '' : getColorString(podcastItem.collectionId))}>
						{podcastItem.artworkUrl ?
						<div class="button__image-container">
							<img class={'button__image button__image--bg'} alt={podcastItem.name} src={podcastItem.artworkUrl} />
							<img class={'button__image'} alt={podcastItem.name} src={podcastItem.artworkUrl} />
						</div>
						: null}
						<span class={'button__text' + (podcastItem.artworkUrl ? '' : ' button__text--inverted')}>{podcastItem.name}</span>
					</Link>
					{small ?
						null
						:
						<div class={'preset-list__link-content'}>
							<Link href={pcLink} class={'preset-list__link'}>{podcastItem.name}</Link>
							{podcastItem.artistName ?
							<span class={'preset-list__link-description'}>{podcastItem.artistName}</span>
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
