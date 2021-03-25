import { h, Component } from 'preact';
import { Link } from 'preact-router/match';
import { getColorString, slugify } from '../../utils/misc';

export default class PodcastItem extends Component {
  constructor(props) {
    super(props);
  }

  render({ podcastItem, small }) {
    if (podcastItem) {
      let pcLink = '/podcast/' + slugify(podcastItem.name) + '/' + btoa(podcastItem.feedUrl);
      return (
        <div class={'preset-list__item-content preset-list__item-content--podcast'}>
          <Link
            href={pcLink}
            title={podcastItem.name}
            class={'preset-list__button' + (small ? ' preset-list__button--small' : '') + (podcastItem.logo ? '' : ' icon--podcast')}
            style={podcastItem.logo ? '' : getColorString(podcastItem.collectionId)}
          >
            {podcastItem.logo ? (
              <div class="button__image-container">
                <img class={'button__image button__image--bg'} loading="lazy" width="64" height="64" alt={podcastItem.name} src={podcastItem.logo} />
                <img class={'button__image'} loading="lazy" width="64" height="64" alt={podcastItem.name} src={podcastItem.logo} />
              </div>
            ) : null}
            <span class={'button__text' + (podcastItem.logo ? '' : ' button__text--inverted')}>{podcastItem.name}</span>
          </Link>
          {small ? null : (
            <div class={'preset-list__link-content'}>
              <Link href={pcLink} class={'preset-list__link'}>
                {podcastItem.name}
              </Link>
              {podcastItem.artistName ? <span class={'preset-list__link-description'}>{podcastItem.artistName}</span> : null}
            </div>
          )}
        </div>
      );
    } else {
      return;
    }
  }
}
