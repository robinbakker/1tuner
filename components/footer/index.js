import { h, Component } from 'preact';
import style from './style';
import AudioPlayer from '../audioplayer';
import { Link } from 'preact-router/match';
import { getTime, getTimeFromSeconds } from '../../utils/misc';

const LM_None = 0;
const LM_Station = 1;
const LM_Playlist = 2;
const LM_Podcast = 3;

const MEDIA_EMPTY = {
  name: '',
  link: '',
  logoUrl: '',
  programInfo:'',
  nextProgram:''
};

const PLAYLIST_EMPTY = {
  href:'',
  name:'',
  schedule:[],
};

export default class Footer extends Component {
	constructor(props) {
    super(props);
    this.handleMediaSessionEvent = this.handleMediaSessionEvent.bind(this);

    this.state = {
      listeningMode: LM_None,
      isPlaying: false,
      isLoading: false,
      playlist: PLAYLIST_EMPTY,
      station: {},
      mediaPlayingID:'',
      audioSources: [],
      stationList: [],
      media: MEDIA_EMPTY,
      timerWorker: null,
      audioError: null,
      elapsedtime: 0,
      elapsedtimeText:'',
      progressvalue: 0,
      chromeCastSession: null,
      chromeCastScriptLoadStep: 0
    };
  }

  componentDidMount() {
    this.props.onRef(this);
    this.loadData();
  }

  componentWillUnmount() {
    this.props.onRef(null);
  }

  forcePlay = (APlayAudio) => {
    this.setState({
      isPlaying:APlayAudio
    }, () => { this.playAudio(); });
  }

  loadData = () => {
    let self = this;
    let wasPlaying = this.state.isPlaying;
    if (this.props.listeningMode == LM_Station || this.props.listeningMode == LM_Playlist) {
      if ((!this.state.stationList || !this.state.stationList.length)) {
        if (this.props.stationList && this.props.stationList.length) {
          this.setState({stationList:this.props.stationList}, () => {
            this.loadData();
          });
        } else {
          // Load stations or show error?
          console.log('no station list found');
        }
        return;
      }
    }
    let thisTimerWorker = this.state.timerWorker;
    if (this.props.listeningMode!=LM_Playlist && thisTimerWorker!=null) {
      thisTimerWorker.terminate();
    }
    switch (this.props.listeningMode) {
      case LM_None:
        this.setDataNone();
        break;
      case LM_Station:
        if (!this.props.station) {
          this.setDataNone();
          break;
        }
        let currentStation = this.getStation(this.props.station);
        if (currentStation == null) {
          this.setDataNone(); // Station was not found... Display error?
          break;
        }
        let asrcs = self.getAudioSources(currentStation);
        this.setState({
          listeningMode: LM_Station,
          isPlaying: wasPlaying,
          playlist: PLAYLIST_EMPTY,
          media: {
            name: currentStation.name,
            link: '/radio-station/' + this.props.station,
            logoUrl: currentStation.logosource,
            programInfo: '',
            nextProgram: ''
          },
          podcast: null,
          station: currentStation,
          mediaPlayingID: '',
          audioSources: asrcs,
          timerWorker: null
        }, () => {
          if(wasPlaying) {
            self.playAudio(false, self);
          }
        });
        break;
      case LM_Podcast:
        if(!this.props.podcast || !this.props.podcast.episodes || !this.props.podcast.episodes.length) {
          this.setDataNone();
          break;
        }
        let currentPodcast = this.props.podcast;
        let currentEpisode = this.getCurrentEpisode(currentPodcast.episodes);
        if (!currentEpisode) {
          this.setDataNone();
          break;
        }
        let epAudioSource = [{ url:currentEpisode.url, mimetype:currentEpisode.type }];
        if (!this.state.audioSources || (this.state.audioSources.length && this.state.audioSources[0].url != currentEpisode.url)) {
          this.setState({
            listeningMode: LM_Podcast,
            isPlaying: wasPlaying,
            playlist: PLAYLIST_EMPTY,
            media: {
              name: currentPodcast.name,
              link: `/podcast/${encodeURIComponent(currentPodcast.name)}/${encodeURIComponent(currentPodcast.feedUrl)}`,
              logoUrl: currentPodcast.artworkUrl,
              programInfo: currentEpisode.title,
              nextProgram:''
            },
            podcast: currentPodcast,
            station: null,
            mediaPlayingID:'',
            audioSources: epAudioSource,
            timerWorker: null
          }, () => {
            if (wasPlaying) {
              this.playAudio();
            }
          });
        } else {
          this.setState({
            listeningMode: LM_Podcast,
            timerWorker: null,
            playlist: PLAYLIST_EMPTY,
            station: null
          }, () => {
            if (wasPlaying) {
              this.playAudio();
            }
          });
        }
        break;
      case LM_Playlist:
        let currentPlaylist = this.props.playlist;
        if(!currentPlaylist || !currentPlaylist.href || !currentPlaylist.schedule) {
          this.setDataNone();
          break;
        }
        currentPlaylist.schedule.forEach(function(prog) {
          prog.active = false;
          prog.stationData = self.getStation(prog.station);
        });
        if (window.Worker && thisTimerWorker==null) {
          thisTimerWorker = new Worker('/assets/workers/timer.js');
          thisTimerWorker.postMessage(5000);
          thisTimerWorker.addEventListener('message', function(AMessage) { self.handleMessageFromWorker(AMessage, self); });
        }
        this.setState({
          listeningMode: LM_Playlist,
          isPlaying: wasPlaying,
          playlist: currentPlaylist,
          station: {},
          media: {
            name: currentPlaylist.name,
            link: currentPlaylist.href,
            logoUrl: '',
            programInfo: '',
            nextProgram: ''
          },
          podcast:null,
          mediaPlayingID:'',
          audioSources: [],
          timerWorker:thisTimerWorker
        }, () => {
          if (!this.setActiveStation() && wasPlaying) {
            this.playAudio();
          }
        });
        break;
      default:
        this.setDataNone();
        break;
    }
  }

  setDataNone = () => {
    if (this.state.isPlaying && this.child) {
      // Stop playing, child! :P
      this.child.method(false, null, '');
    }
    this.setState({
      listeningMode: LM_None,
      isPlaying: false,
      playlist: PLAYLIST_EMPTY,
      media: MEDIA_EMPTY,
      station: {},
      mediaPlayingID:'',
      audioSources: [],
      timerWorker: null
    });
    this.props.setListeningMode(LM_None);
  }

  getCurrentEpisode = (AEpisodeList) => {
    if(!AEpisodeList || !AEpisodeList.length) {
      return null;
    }
    for(let i=0;i<AEpisodeList.length; i++) {
      if(AEpisodeList[i].isPlaying) {
        return AEpisodeList[i];
      }
    }
    return null;
  }

  handleMessageFromWorker = (AMessage, ASelfRef) => {
    let self = ASelfRef || this;
    self.setActiveStation(self);
  }

  getStation = (AStationID) => {
    return this.getArrayItemObjectByID(this.state.stationList, AStationID);
  }
  getPlaylist = (APlaylist) => {
    return APlaylist;
  }
  getArrayItemObjectByID = (AArray, AID) => {
    if (!AArray || !AArray.length) {
      return null;
    }
    let Result = null;
    for (let i=0;i<AArray.length;i++) {
      if (AArray[i].id==AID) {
        Result = AArray[i];
        break;
      }
    }
		return Result;
  }

  setActiveStation = (ASelfRef) => {
    let self = ASelfRef || this;
    if (self.state.listeningMode != LM_Playlist) return;
    let currentHour = new Date().getHours();
    let currentMinute = new Date().getMinutes();
    let prevItem = null;
    let tempPlaylist = self.state.playlist;
    if (typeof tempPlaylist === 'undefined' || typeof tempPlaylist.schedule === 'undefined') {
      return false;
    }
    for (var i = 0; i < tempPlaylist.schedule.length; i++) {
      if (prevItem != null) {
        if (currentHour >= prevItem.startHour && currentHour < prevItem.endHour) {
          let hasChanged = !(prevItem.active);
          prevItem.active = true;
          let activeScheduleState = self.setActiveSchedule(prevItem, i==1, currentMinute);
          if (activeScheduleState!=null) {
            self.setState(activeScheduleState, () => {
              if (hasChanged && activeScheduleState.isPlaying) {
                self.playAudio(false, self);
              }
            });
          }
          return true;
        } else {
          prevItem.active = false;
        }
      }
      prevItem = tempPlaylist.schedule[i];
    }
    if (prevItem != null) {
      if (currentHour >= prevItem.startHour && currentHour < prevItem.endHour) {
        let hasChanged = !(prevItem.active);
        prevItem.active = true;
        let activeScheduleState = self.setActiveSchedule(prevItem, false);
        if (activeScheduleState!=null) {
          self.setState(activeScheduleState, () => {
            if (hasChanged && activeScheduleState.isPlaying) {
              self.playAudio(false, self);
            }
          });
        }
        return true;
      } else {
        prevItem.active=false;
        self.playAudio(false, self);
      }
    }
    self.setState({
      isPlaying: false,
      playlist: tempPlaylist,
      station: {},
      audioSources: []
    });
    return false;
  }

  setActiveSchedule = (ASchedule, AFirstItem, ACurrentMinute) => {
    let isPlaying = this.state.isPlaying;
    if (AFirstItem) {
      if (!isPlaying && ACurrentMinute==0) {
        // First hour of the playlist, first minute, so autostart if needed
        isPlaying = true;
      }
    }
    let loadedStation = ASchedule.stationData;
    if (!loadedStation) return null;
    loadedStation.id = ASchedule.station;
    let asrcs = this.getAudioSources(loadedStation);
    let nextProgram = '';
    let nextProgramItem = this.getNextScheduleItem();
    if (nextProgramItem) {
      let nextStation = this.getStation(nextProgramItem.station);
      nextProgram = getTime(nextProgramItem.startHour) + ' ' + nextStation.name;
    }
    let currentMedia = this.state.media;
    currentMedia.programInfo = loadedStation.name;
    currentMedia.nextProgram = nextProgram;

    return {
      isPlaying: isPlaying,
      media: currentMedia,
      station: loadedStation,
      audioSources: asrcs,
    };
  }

  getNextScheduleItem = () => {
    let tempPlaylist = this.state.playlist;
    if (typeof tempPlaylist === 'undefined' ||
        typeof tempPlaylist.schedule === 'undefined' ||
        tempPlaylist.schedule.length<=1) {
      return null;
    }
    for (let i=0; i<tempPlaylist.schedule.length; i++) {
      if (tempPlaylist.schedule[i].active) {
        if (i+1 < tempPlaylist.schedule.length) {
          return tempPlaylist.schedule[i+1];
        } else {
          return tempPlaylist.schedule[0];
        }
      }
    }
    return null;
  }

  changeAudio = (AUserSetIsPlaying) => {
    if (this.props.listeningMode != this.state.listeningMode ||
      (this.state.listeningMode==LM_Playlist && !this.state.station) ||
      (this.state.listeningMode==LM_Station && this.state.station && this.props.station!=this.state.station.id)) {
      this.loadData();
      return null;
    }
    if (this.state.listeningMode == LM_None) {
      // Strange to get here with LM_None, maybe the prop wasn't reset yet?
      setTimeout(this.loadData, 200);
      return null;
    }
    if (this.state.listeningMode == LM_Podcast) {
      let currentPodcast = this.props.podcast;
      let currentEpisode = this.getCurrentEpisode(currentPodcast.episodes);
      if (this.state.podcast && currentEpisode && this.state.mediaPlayingID != currentEpisode.url) {
        this.props.setPodcastEpisodeTimeElapsed(this.state.podcast.feedUrl, this.state.mediaPlayingID, this.state.elapsedtime);
      }
      let playingOutcome = this.state.isPlaying || this.state.mediaPlayingID != currentEpisode.url;
      return {
        isPlaying: playingOutcome,
        podcast: currentPodcast,
        audioSources: [{ url:currentEpisode.url, mimetype:currentEpisode.type }],
        mediaPlayingID: currentEpisode.url,
        elapsedtime: currentEpisode.secondsElapsed || 0,
        elapsedtimeText: getTimeFromSeconds(currentEpisode.secondsElapsed || 0),
        progressvalue: 0,
        media: {
          name: currentPodcast.name,
          link: `/podcast/${encodeURIComponent(currentPodcast.name)}/${encodeURIComponent(currentPodcast.feedUrl)}`,
          logoUrl: currentPodcast.artworkUrl,
          programInfo: currentEpisode.title,
          nextProgram:''
        },
      };
    }
    let stationid = this.state.station.id;
    if (!this.state.station || !stationid) {
      return {
        isPlaying: false
      };
    }
    let isPlaying = AUserSetIsPlaying==null ? this.state.isPlaying : AUserSetIsPlaying;
    if (!isPlaying) {
      return {
        isPlaying: false
      };
    }
    let self = this;
    if (self.state.mediaPlayingID == stationid) {
      if (AUserSetIsPlaying) {
        return {
          isPlaying: true
        };
      }
      return null; // nothing changes
    }

    if (typeof this.state.station.streams === 'undefined') {
      let CurrentStation = self.getStation(stationid);
      if (CurrentStation && CurrentStation.streams && typeof CurrentStation.streams !== 'undefined' && CurrentStation.streams.length) {
        let asrcs = [];
        CurrentStation.streams.some(function(obj, i) {
          asrcs.push({ url:obj.url, mimetype:obj.mimetype });
        });
        return {
          mediaPlayingID: stationid,
          audioSources: asrcs,
          isPlaying: self.state.audioSources.length>0
        };
      };
    } else {
      let asrcs = this.getAudioSources(this.state.station);
      return {
        mediaPlayingID: stationid,
        audioSources: asrcs,
        isPlaying: asrcs.length > 0
      };
    }
    return {
      mediaPlayingID: stationid,
      isPlaying: isPlaying
    };
  }

  getAudioSources = (AStation) => {
    let Station = AStation ? AStation : this.state.station;
    let asrcs = [];
    if (!Station.streams) return asrcs;
    for (var i=0; i<Object.keys(Station.streams).length; i++) {
      let stream = Station.streams[i];
      asrcs.push({ url:stream.url, mimetype:stream.mimetype });
    }
    return asrcs;
  }

  playAudio = (AUserEvent, ASelfRef) => {
    let self = ASelfRef || this;
    let userSetIsPlaying = null;
    let wasPlaying = self.state.isPlaying;
    if (AUserEvent) {
      userSetIsPlaying = !wasPlaying;
      if (wasPlaying && self.state.listeningMode==LM_Podcast && self.state.podcast) {
        this.props.setPodcastEpisodeTimeElapsed(self.state.podcast.feedUrl, self.state.mediaPlayingID, self.state.elapsedtime);
      }
    }
    if (self.child) {
      let isPlayingOutcome = self.changeAudio(userSetIsPlaying);
      if (isPlayingOutcome != null) {
        isPlayingOutcome.isPlaying = AUserEvent ? userSetIsPlaying : isPlayingOutcome.isPlaying;
        isPlayingOutcome.audioSources = isPlayingOutcome.audioSources || self.state.audioSources;
        isPlayingOutcome.mediaPlayingID = isPlayingOutcome.mediaPlayingID || self.state.mediaPlayingID
        isPlayingOutcome.elapsedtime = isPlayingOutcome.elapsedtime || 0;
        isPlayingOutcome.progressvalue = isPlayingOutcome.progressvalue || 0;
        isPlayingOutcome.media = isPlayingOutcome.media || self.state.media;
        isPlayingOutcome.listeningMode = isPlayingOutcome.listeningMode || self.state.listeningMode;
        self.setState({
          isLoading: !wasPlaying || isPlayingOutcome.mediaPlayingID !== self.state.mediaPlayingID,
          isPlaying: isPlayingOutcome.isPlaying,
          podcast: isPlayingOutcome.podcast,
          listeningMode: isPlayingOutcome.listeningMode,
          audioSources: isPlayingOutcome.audioSources,
          mediaPlayingID: isPlayingOutcome.mediaPlayingID,
          elapsedtime: isPlayingOutcome.elapsedtime,
          elapsedtimeText: getTimeFromSeconds(isPlayingOutcome.elapsedtime),
          progressvalue: isPlayingOutcome.progressvalue,
          media: isPlayingOutcome.media
        }, () => {
          self.child.method(isPlayingOutcome.isPlaying, isPlayingOutcome.audioSources, isPlayingOutcome.mediaPlayingID, isPlayingOutcome.listeningMode==LM_Podcast, isPlayingOutcome.elapsedtime);
        });
      }
    }
  }

  handleMediaSessionEvent = (AEvent) => {
    switch(AEvent) {
      case 'prev':
        if (this.state.listeningMode == LM_Podcast) {
          this.rewind();
        } else {
          // load prevous station
          this.props.tuneToStation(true);
        }
        break;
      case 'next':
        if (this.state.listeningMode == LM_Podcast) {
          this.fastForward();
        } else {
          // load next station
          this.props.tuneToStation(false);
        }
        break;
      default:
        this.playAudio(AEvent, this);
    }
  }

  rewind = () => {
    this.child.seekAudio(-10);
  }

  fastForward = () => {
    this.child.seekAudio(30);
  }

  closeFooter = () => {
    this.props.closeFooter();
  }

  dataLoaded = () => {
    this.setState({isLoading:false});
  }

  audioError = (AError) => {
    let AE = AError;
    this.setState({
      audioError: AE
    });
  }

  prevTimeVal = '';

  timeUpdate = (APlayer) => {
    if (this.state.listeningMode != LM_Podcast) {
      if (this.state.progressvalue) {
        this.prevTimeVal = '';
        this.setState({
          progressvalue: 0,
          elapsedtime: null,
          elapsedtimeText: ''
        });
      }
      return;
    }
      let newValue = getTimeFromSeconds(APlayer.currentTime);
      if (this.prevTimeVal != newValue) {
        this.prevTimeVal = newValue;
        let progVal = APlayer.currentTime / APlayer.duration;
        if (progVal > 0) {
          this.setState({
            progressvalue: progVal,
            elapsedtime: APlayer.currentTime,
            elapsedtimeText: newValue
          });
        }
      }
  }

  anotherPodcastEpisodeIsRequested = () => {
    if(!this.state.podcast || !this.props.podcast || !this.props.podcast.episodes) {
      return false;
    }
    let ep = this.getCurrentEpisode(this.props.podcast.episodes);
    if (!ep) {
      return false;
    }
    return this.audioSources && this.audioSources.length && this.audioSources.url != ep.url;
  }

	render({settings}, {isPlaying,isLoading,listeningMode,audioSources,media,mediaPlayingID,progressvalue,elapsedtimeText,audioError,chromeCastScriptLoadStep}) {
    if (
      (this.props.listeningMode == LM_Podcast && this.props.listeningMode != this.state.listeningMode) ||
      (this.props.listeningMode == LM_Station && (!this.state.station || this.props.station != this.state.station.id)) ||
      (this.props.listeningMode == LM_Podcast && this.props.podcast && this.anotherPodcastEpisodeIsRequested()) ||
      (this.props.listeningMode == LM_Playlist && (!this.state.playlist || this.props.playlist.href != this.state.playlist.href))) {
      this.loadData();
    }
    let footerModeStyle = 'footer--mode'+listeningMode;
    let rewModeStyle = 'rew-button--mode'+listeningMode;
    let playModeStyle = 'play-button--mode'+listeningMode;
    let ffwModeStyle = 'ffw-button--mode'+listeningMode;
    return (
			<footer class={style['footer'] + ' ' + style[footerModeStyle] + ' ' + (listeningMode==LM_None ? style['footer--hidden'] : style['footer--visible'])} style={media.logoUrl ? 'background-image:url(' + media.logoUrl + ')':null}>
				<div class={style['footer__item'] + ' ' + style['footer__item--audio']}>
          <button className={style['rew-button'] + ' ' + style[rewModeStyle]} aria-label={'Rewind 10 seconds'} onClick={this.rewind.bind(this)} disabled={!isPlaying}>10s</button>
          <button className={style['play-button'] + ' ' + style[playModeStyle] + ' ' + (isPlaying ? style['play-button--stop'] : style['play-button--play']) + ' ' + (isLoading ? style['play-button--loading'] : '')} onClick={this.playAudio.bind(this)} data-isplaying={isPlaying} id="icoAudioControl">{isPlaying ? 'Stop' : 'Play'}</button>
          <button className={style['ffw-button'] + ' ' + style[ffwModeStyle]} aria-label={'Fast forward 30 seconds'} onClick={this.fastForward.bind(this)} disabled={!isPlaying}>30s</button>
          <AudioPlayer onRef={ref => (this.child = ref)} isPlaying={isPlaying} timeUpdate={this.timeUpdate} dataLoaded={this.dataLoaded.bind(this)} handleMediaSessionEvent={this.handleMediaSessionEvent} mediatitle={media.name} mediaartist={media.programInfo} medialogo={media.logoUrl} hasError={this.audioError} mediaid={mediaPlayingID} sources={audioSources} />
          <progress id="audioProgress" class={style['audio-progress']} value={progressvalue} max="1"></progress>
          {listeningMode==LM_Podcast ? <div id="audioElapsedTime" class={style.elapsed}>{elapsedtimeText}</div> : null}
          <span class={style['audio-error'] + (audioError && audioError.message ? ' ' + style['audio-error--active'] : '')}>{(audioError && audioError.message ? audioError.message : '')}</span>
        </div>
        <div class={style['footer__item']}>
          <h3><Link href={media.link} class={style['footer__link']} title={'Info'}>{media.name}</Link></h3>
          <p>
            {media.programInfo}
            {media.nextProgram ? <span class={style['footer__next-program']}>{media.nextProgram}</span> : null}
          </p>
        </div>
        {settings && settings.experimental && settings.experimental.chromecast ?
          <div class={style['footer__item'] + ' ' + style['footer__item--chromecast']}>
            <google-cast-launcher></google-cast-launcher>
          </div>
        : null }
        <div class={style['footer__item'] + ' ' + style['footer__item--close']}>
          <button className={style['close-button']} title="Close" onClick={this.closeFooter.bind(this)}>Close</button>
        </div>
			</footer>
		);
	}
}
