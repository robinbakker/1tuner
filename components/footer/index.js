import { h, Component } from 'preact';
import style from './style';
import AudioPlayer from '../audioplayer';
import { Link } from 'preact-router/match';
import { getTime, getTimeFromSeconds } from '../../utils/misc';

const LM_None = 0;
const LM_Station = 1;
const LM_Planning = 2;
const LM_Podcast = 3;

const MEDIA_EMPTY = {
  name: '',
  link: '',
  logoUrl: '',
  programInfo:'',
  nextProgram:''
};
const PLANNING_EMPTY = {
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
      isLoading: true,
      loadDataActive: false,
      planning: PLANNING_EMPTY,
      station: {},
      mediaPlayingID:'', 
      audioSources: [],
      stationList: [],
      media: MEDIA_EMPTY,
      timerWorker: null,
      audioError: null,
      elapsedtime: 0,
      progressvalue: 0,
      hasRemoteDeviceSupport: false,
      connectedToRemote: false
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
    if (APlayAudio) {
      this.setState({
        isPlaying:true
      });
      this.playAudio();
    }
  }

  loadData = () => {
    this.setState({loadDataActive:true});
    let self = this;
    let wasPlaying = this.state.isPlaying; 
    if (this.props.listeningMode == LM_Station || this.props.listeningMode == LM_Planning) {
      if ((!this.state.stationList || !this.state.stationList.length)) {
        if (this.props.stationList && this.props.stationList.length) {
          this.setState({stationList:this.props.stationList});
        } else {
          // Load stations?
          this.setState({loadDataActive:false});
          return;
        }
      }
    }
    let thisTimerWorker = this.state.timerWorker;
    if (this.props.listeningMode!=LM_Planning && thisTimerWorker!=null) {
      thisTimerWorker.terminate();
    }
    if (this.props.listeningMode==LM_None) {
      this.setDataNone(); 
    } else if (this.props.listeningMode == LM_Station && this.props.station != null && this.props.station != '') {
      let currentStation = this.getStation(this.props.station);
      if (currentStation == null) {
        // Station was not found... Display error?
        this.setDataNone();
      } else {
        let asrcs = self.getAudioSources(currentStation);
        this.setState({
          listeningMode: LM_Station,
          isPlaying: wasPlaying,
          planning: PLANNING_EMPTY,
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
          timerWorker: null,
          loadDataActive:false
        });
        if(wasPlaying) {
          this.playAudio(false, this);
        }
      }     
    } else if (this.props.listeningMode == LM_Podcast && this.props.podcast && this.props.podcast.episodes && this.props.podcast.episodes.length) {
      let currentPodcast = this.props.podcast;
      let currentEpisode = this.getCurrentEpisode(currentPodcast.episodes);
      if (!currentEpisode) {
        // Podcast episode was not found... Display error?
        console.log('Current podcast episode was not found...');
        this.setDataNone();
        return;
      }
      let epAudioSource = [{ url:currentEpisode.url, mimetype:currentEpisode.type }];
      if (!this.state.audioSources || (this.state.audioSources.length && this.state.audioSources[0].url != epAudioSource.url)) {
        this.setState({
          listeningMode: LM_Podcast,
          isPlaying: wasPlaying,
          planning: PLANNING_EMPTY,
          media: {
            name: currentPodcast.name,
            link: `/podcast/${currentPodcast.name}/?feedurl=${currentPodcast.feedUrl}`,
            logoUrl: currentPodcast.artworkUrl,
            programInfo: currentEpisode.title,
            nextProgram:''
          },
          podcast: currentPodcast,
          station: null,
          mediaPlayingID:'', 
          audioSources: epAudioSource,
          timerWorker: null,
          loadDataActive:false
        });
      } else {
        // is the episode already playing?
        console.log('Podcast episode audioSource loaded already, looks the same?');
        this.setState({
          listeningMode: LM_Podcast,
          timerWorker: null,
          planning: PLANNING_EMPTY,
          station: null,
          loadDataActive: false
        });
      }
      if (wasPlaying) {
        this.playAudio(false, this);
      }
    } else if (this.props.listeningMode==LM_Planning && this.props.planning && this.props.planning.href) {
      let currentPlanning = this.props.planning;
      if (currentPlanning && currentPlanning.schedule) {
        currentPlanning.schedule.forEach(function(prog) {
          prog.active = false;
          prog.stationData = self.getStation(prog.station);
        });
        if (window.Worker && thisTimerWorker==null) {
          thisTimerWorker = new Worker('/assets/workers/timer.js');
          thisTimerWorker.postMessage(5000);
          thisTimerWorker.addEventListener('message', function(AMessage) { self.handleMessageFromWorker(AMessage, self); });
        }
        self.setState({
          isPlaying: wasPlaying,
          listeningMode: LM_Planning,
          planning: currentPlanning,
          station: {},
          media: {
            name: currentPlanning.name,
            link: currentPlanning.href,
            logoUrl: '',
            programInfo: '',
            nextProgram: ''
          },
          podcast:null,
          mediaPlayingID:'',
          audioSources: [],
          timerWorker:thisTimerWorker,
          loadDataActive:false
        });
        self.setActiveStation(self);
        if (wasPlaying) {
          this.playAudio(false, self);
        }
      } else {
        // Planning not found in props, show error?
        console.log('Planning not found in props...');
        this.setDataNone();
      }
    } else {
      this.setDataNone(); 
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
      planning: PLANNING_EMPTY,
      media: MEDIA_EMPTY,
      station: {},        
      mediaPlayingID:'', 
      audioSources: [],
      timerWorker: null
    });
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
  getPlanning = (APlanning) => {
    return APlanning;
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
    if (self.state.listeningMode != LM_Planning) return;
    let currentHour = new Date().getHours();
    let currentMinute = new Date().getMinutes();
    let prevItem = null;
      let tempPlanning = self.state.planning;
      if (typeof tempPlanning === 'undefined' || typeof tempPlanning.schedule === 'undefined') {
        return false;
      }
      for (var i = 0; i < tempPlanning.schedule.length; i++) {
        if (prevItem != null) {
          if (currentHour >= prevItem.startHour && currentHour < prevItem.endHour) {
            let hasChanged = !(prevItem.active);
            prevItem.active = true;
            self.setActiveSchedule(prevItem, i==1, currentMinute);
            if (hasChanged && self.state.isPlaying) {
              self.playAudio(false, self);
            }
            return true;
          } else {
            prevItem.active = false;
          }
        }
        prevItem = tempPlanning.schedule[i];
      }
      if (prevItem != null) {
        if (currentHour >= prevItem.startHour && currentHour < prevItem.endHour) {
          let hasChanged = !(prevItem.active);
          prevItem.active = true;
          self.setActiveSchedule(prevItem, false);
          if (hasChanged && self.state.isPlaying) {
            self.playAudio(false, self);
          }
          return true;
        } else {
          prevItem.active=false;
          self.playAudio(false, self); 
        }
      }
      self.setState({
        isPlaying: false,
        planning: tempPlanning,
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
      if (!loadedStation) return;
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
      this.setState({
        isPlaying: isPlaying,
        media: currentMedia,
        station: loadedStation,
        audioSources: asrcs,
      });
    }

    getNextScheduleItem = () => {
      let tempPlanning = this.state.planning;
      if (typeof tempPlanning === 'undefined' || 
          typeof tempPlanning.schedule === 'undefined' ||
          tempPlanning.schedule.length<=1) {
        return null;
      }
      for (let i=0; i<tempPlanning.schedule.length; i++) {
        if(tempPlanning.schedule[i].active) {
          if(i+1<tempPlanning.schedule.length) {
            return tempPlanning.schedule[i+1];
          } else {
            return tempPlanning.schedule[0];
          }
        }
      }
      return null;
    }

    changeAudio = () => {
      if (this.props.listeningMode != this.state.listeningMode) {
        this.loadData();
        return false;
      }
      if (this.state.listeningMode == LM_None) {
        // Strange to get here with LM_None, maybe the prop wasn't reset yet?
        setTimeout(this.loadData, 200);
        return false;
      }
      if (this.state.listeningMode == LM_Podcast) {
        let currentPodcast = this.props.podcast;
        let currentEpisode = this.getCurrentEpisode(currentPodcast.episodes);
        if (this.state.podcast && this.state.mediaPlayingID != currentEpisode.url) {
          this.props.setPodcastEpisodeTimeElapsed(this.state.podcast.feedUrl, this.state.mediaPlayingID, this.state.elapsedtime);
        }
        let playingOutcome = this.state.isPlaying || this.state.mediaPlayingID != currentEpisode.url;
        this.setState({
          podcast: currentPodcast,
          audioSources: [{ url:currentEpisode.url, mimetype:currentEpisode.type }],
          mediaPlayingID: currentEpisode.url,
          elapsedtime: currentEpisode.secondsElapsed || 0,
          progressvalue: 0,
          media: {
            name: currentPodcast.name,
            link: `/podcast/${currentPodcast.name}/?feedurl=${currentPodcast.feedUrl}`,
            logoUrl: currentPodcast.artworkUrl,
            programInfo: currentEpisode.title,
            nextProgram:''
          },
        });
        return playingOutcome;
      } 
      if (!this.state.station || !this.state.station.id) {
        this.setState({
          isPlaying: false
        });
        return false;
      }
      if (!this.state.isPlaying) {
        return false;
      } 
      var self = this;
      var stationid = this.state.station.id;
      if (self.state.mediaPlayingID == stationid) return true;
      self.setState({
        mediaPlayingID: stationid
      });
      if (typeof this.state.station.streams === 'undefined') {
        let CurrentStation = self.getStation(stationid);
        if(CurrentStation && CurrentStation.streams && typeof CurrentStation.streams !== 'undefined' && CurrentStation.streams.length) {
          var asrcs = [];
          CurrentStation.streams.some(function(obj, i) {
            asrcs.push({ url:obj.url, mimetype:obj.mimetype });
          });
          self.setState({
            audioSources: asrcs
          });
        }
        self.setState({
          isPlaying: self.state.audioSources.length>0
        });
      } else if (!this.state.audioSources || !this.state.audioSources.length) {
        var asrcs = this.getAudioSources();
        self.setState({
          audioSources: asrcs,
          isPlaying: asrcs.length > 0
        });
      }
      return this.state.isPlaying;
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
      if (AUserEvent) {
        let isPlaying = self.state.isPlaying;
        if (isPlaying && self.state.listeningMode==LM_Podcast && self.state.podcast) {
          this.props.setPodcastEpisodeTimeElapsed(self.state.podcast.feedUrl, self.state.mediaPlayingID, self.state.elapsedtime);
        }
        self.setState({
          isPlaying: !isPlaying
        });
      }
      if (self.child) {
        let wasPlaying = self.state.isPlaying;
        let isPlayingOutcome = self.changeAudio();
        if (isPlayingOutcome && !wasPlaying) {
          self.setState({isLoading:true});        
        }
        self.child.method(isPlayingOutcome, self.state.audioSources, self.state.mediaPlayingID, self.state.listeningMode==LM_Podcast, self.state.elapsedtime);
      }
    }

    promptForRemoteDevice = () => {
      if (this.child) {
        this.child.promptForRemoteDevice();
      }
    }

    handleMediaSessionEvent = (AEvent) => {
      this.playAudio(AEvent, this);
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

    setRemoteDeviceSupport = (AHasAvailableDevices) => {
      this.setState({hasRemoteDeviceSupport:AHasAvailableDevices});
    }

    setConnectedToRemote = (AIsConnected) => {
      this.setState({connectedToRemote:AIsConnected});
    }

    audioError = (AError) => {
      let AE = AError;
      this.setState({
        audioError: AE
      });
    }

    timeUpdate = (APlayer) => {
      if (this.state.listeningMode != LM_Podcast) {
        if (this.state.progressvalue) {
          this.setState({ 
            progressvalue: 0, 
            elapsedtime: null 
          });
        }
        return;
      }
      this.setState({ 
        isLoading: false,
        isPlaying: !APlayer.paused,
        progressvalue: APlayer.currentTime / APlayer.duration, 
        elapsedtime: APlayer.currentTime 
      });
    }

    anotherPodcastEpisodeIsRequested = (APodcast) => {
      if(!APodcast || !APodcast.episodes) {
        return false;
      }
      let ep = this.getCurrentEpisode(APodcast.episodes);
      if (!ep) {
        return false;
      }
      return this.state.mediaPlayingID != ep.url;
    }

	render() {
    if (!this.state.loadDataActive && (this.props.listeningMode != this.state.listeningMode || 
        (this.props.listeningMode == LM_Station && this.props.station != this.state.station.id) || 
        (this.props.listeningMode == LM_Podcast && (!this.state.podcast || this.anotherPodcastEpisodeIsRequested(this.props.podcast))) || 
        (this.props.listeningMode == LM_Planning && this.props.planning.href != this.state.planning.href))) {
      this.loadData();
    }
    return (
			<footer class={style['footer'] + ' ' + style['footer--mode'+this.state.listeningMode] + ' ' + (this.state.listeningMode==LM_None || !this.state.mediaPlayingID ? style['footer--hidden'] : style['footer--visible'])} style={this.state.media.logoUrl ? 'background-image:url(' + this.state.media.logoUrl + ')':null}>
				<div class={style['footer__item'] + ' ' + style['footer__item--audio']}>
          <button className={style['rew-button'] + ' ' + style['rew-button--mode'+this.state.listeningMode]} aria-label={'Rewind 10 seconds'} onClick={this.rewind.bind(this)} disabled={!this.state.isPlaying}>10s</button>
          <button className={style['play-button'] + ' ' + style['play-button--mode'+this.state.listeningMode] + ' ' + (this.state.isPlaying ? style['play-button--stop'] : style['play-button--play']) + ' ' + (this.state.isPlaying && this.state.isLoading ? style['play-button--loading'] : '')} onClick={this.playAudio.bind(this)} data-isplaying={this.state.isPlaying} id="icoAudioControl">{this.state.isPlaying ? 'Stop' : 'Play'}</button>
          <button className={style['ffw-button'] + ' ' + style['ffw-button--mode'+this.state.listeningMode]} aria-label={'Fast forward 30 seconds'} onClick={this.fastForward.bind(this)} disabled={!this.state.isPlaying}>30s</button>
          <AudioPlayer onRef={ref => (this.child = ref)} isPlaying={this.state.isPlaying} timeUpdate={this.timeUpdate} dataLoaded={this.dataLoaded} setRemoteDeviceSupport={this.setRemoteDeviceSupport} setConnectedToRemote={this.setConnectedToRemote} handleMediaSessionEvent={this.handleMediaSessionEvent} mediatitle={this.state.media.name} mediaartist={this.state.media.programInfo} medialogo={this.state.media.logoUrl} hasError={this.audioError} mediaid={this.state.mediaPlayingID} sources={this.state.audioSources} />
          { this.state.hasRemoteDeviceSupport ? 
            <button class={'cast-button' + (this.state.connectedToRemote ? ' is-active' : '' )} onClick={this.promptForRemoteDevice}>Cast...</button>
            : null
          }
          <progress id="audioProgress" class={style['audio-progress']} value={this.state.progressvalue} max="1"></progress>
          {this.state.listeningMode==LM_Podcast ? <div class={style.elapsed}>{getTimeFromSeconds(this.state.elapsedtime)}</div> : null}
          <span class={style['audio-error'] + (this.state.audioError && this.state.audioError.message ? ' ' + style['audio-error--active'] : '')}>{(this.state.audioError && this.state.audioError.message ? this.state.audioError.message : '')}</span>
        </div>
        <div class={style['footer__item']}>
          <h3><Link href={this.state.media.link} class={style['footer__link'] + ' icon--info'}>{this.state.media.name}</Link></h3>
          <p>
            {this.state.media.programInfo}
            {this.state.media.nextProgram ? <span class={style['footer__next-program']}>{this.state.media.nextProgram}</span> : null}
          </p> 
        </div>
        <div class={style['footer__item'] + ' ' + style['footer__item--close']}>
          <button className={style['close-button']} title="Close" onClick={this.closeFooter}>Close</button>
        </div>
			</footer>
		);
	}
}