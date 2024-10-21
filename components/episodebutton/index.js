import { h, Component } from 'preact';
import style from './style';
import { getTimeFromSeconds } from '../../utils/misc';

export default class EpisodeButton extends Component {
  constructor(props) {
    super(props);
  }
  render({ episode, onEpisodeClick, featured }) {
    if (!episode) {
      return null;
    }
    return (
      <button class={`btn btn--naked${featured ? ` ${style.featured}` : ''}`} data-href={episode.url} onClick={onEpisodeClick}>
        <span class={`button__text${featured ? ` ${style.featuredText}` : ''}`}>
          <b>{episode.title}</b>{' '}
          <span class={style.played}>
            ({episode.duration}
            {episode.secondsElapsed ? ' - played ' + getTimeFromSeconds(episode.secondsElapsed) : ''})
          </span>
          {typeof episode.pubDate === 'object' ? (
            <span class={style.pubdate}>{episode.pubDate.toLocaleDateString(undefined, { dateStyle: 'full' })}</span>
          ) : null}
        </span>
        <span class={`button__icon button__icon--play${featured ? ` ${style.featuredButton}` : ''}`}>Play</span>
      </button>
    );
  }
}
