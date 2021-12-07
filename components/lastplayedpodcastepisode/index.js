import { h, Component } from 'preact';
import style from './style';
import { getTimeFromSeconds } from '../../utils/misc';

export default class LastPlayedPodcastEpisode extends Component {
  constructor(props) {
    super(props);
  }

  render({ episode, onClick }) {
    if (episode) {
      return (
        <div class={style.lastPlayed}>
          <div class={style.lastPlayedText}>
            <h4>{episode.title} </h4>
            <p>({episode.duration + '  - played ' + getTimeFromSeconds(episode.secondsElapsed)})</p>
          </div>
          <div class={style.lastPlayedButton}>
            <button data-href={episode.url} onClick={(e) => onClick(e)} class={'btn btn--secondary btn--play'}></button>
          </div>
        </div>
      );
    } else {
      return null;
    }
  }
}
