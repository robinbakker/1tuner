import { h, Component } from 'preact';
import style from './style';
import { removeHtml, getTimeFromSeconds } from '../../utils/misc';

export default class PodcastPageHeader extends Component {
  constructor(props) {
    super(props);
  }

  render({ logo, podcastName, description, lastPlayedEpisode, onLastPlayedClick, lastUpdated, onReloadClick, isReloading }) {
    return (
      <div class={style.header}>
        <img class={style.artwork} src={logo} alt={podcastName} />
        {lastPlayedEpisode ? (
          <div class={style.lastPlayed}>
            <div class={style.lastPlayedText}>
              <h4>{lastPlayedEpisode.title} </h4>
              <p class={style.duration}>({lastPlayedEpisode.duration + '  - played ' + getTimeFromSeconds(lastPlayedEpisode.secondsElapsed)})</p>
            </div>
            <div class={style.lastPlayedButton}>
              <button data-href={lastPlayedEpisode.url} onClick={onLastPlayedClick} class={'btn btn--secondary btn--play'}></button>
            </div>
          </div>
        ) : null}
        <div class={style.description}>
          <p class={style.descriptiontext}>{removeHtml(description)}</p>
        </div>
        {lastUpdated ? (
          <p class={style.reloadbutton}>
            <button onClick={onReloadClick} class={'btn ' + style.btnreload} title="Reload">
              <span class={style.reloadicon + (isReloading ? ' ' + style.loading : '')}>
                <svg xmlns="http://www.w3.org/2000/svg" style="isolation:isolate" viewBox="0 0 96 96">
                  <defs>
                    <clipPath id="a">
                      <path d="M0 0h96v96H0z" />
                    </clipPath>
                  </defs>
                  <g clip-path="url(#a)">
                    <path d="M63.415 32.585l5.798-5.798v15.415H53.798l5.799-5.799c-6.364-6.364-16.759-6.434-23.194 0a16.567 16.567 0 00-4.101 6.789h-5.657c.92-3.889 2.758-7.566 5.799-10.607 8.697-8.556 22.415-8.556 30.971 0zM36.403 59.597c6.364 6.364 16.759 6.434 23.194 0a16.567 16.567 0 004.101-6.789h5.657c-.92 3.889-2.758 7.566-5.799 10.607-8.556 8.556-22.344 8.485-30.83 0l-5.868 5.869V53.869l15.344-.071-5.799 5.799z" />
                  </g>
                </svg>
              </span>
            </button>
            <span class={style.modifieddate}>{lastUpdated ? lastUpdated.toLocaleDateString(undefined, { dateStyle: 'short' }) : ''}</span>
          </p>
        ) : null}
      </div>
    );
  }
}
