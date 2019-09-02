import { h, Component } from 'preact';
import style from './style';
import AudioPlayer from '../audioplayer';
import { Link } from 'preact-router/match';

const LM_None = 0;
const LM_Station = 1;
const LM_Planning = 2;

export default class Footer extends Component {
	constructor(props) {
    super(props);
    this.handleMediaSessionEvent = this.handleMediaSessionEvent.bind(this);

    this.state = {
      listeningMode: LM_None,
      isPlaying: false,
      isLoading: true,
      planning: {
        name:'',
        href:'',
        schedule:[],
      },
      station: {},
      stationPlaying:'', 
      audioSources: [],
      stationList: [],
      timerWorker:null,
      audioError:null,
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
  
  forcePlay(APlayAudio) {
    if (APlayAudio) {
      this.setState({
        isPlaying:true
      });
      this.playAudio();
    }
  }

	loadData = () => {
    let self = this;
    let wasPlaying = this.state.isPlaying; 
    if (this.state.isPlaying) {
      this.playAudio(true);
    }
    if ((!this.state.stationList || !this.state.stationList.length)) {
      if (this.props.stationList && this.props.stationList.length) {
        this.setState({stationList:this.props.stationList});
      } else {
        // Load stations?
        return;
      }
    }
    let thisTimerWorker = this.state.timerWorker;
    if (this.props.listeningMode==LM_None) {
      if (thisTimerWorker!=null) {
        thisTimerWorker.terminate();
      }
      this.setState({
        listeningMode: LM_None,
        isPlaying: false,
        planning: {
          href:'',
          name:'',
          schedule:[],
        },
        station: {},        
        stationPlaying:'', 
        audioSources: [],
        timerWorker: null
      });
    } else if (this.props.listeningMode == LM_Station && this.props.station != null && this.props.station != '') {
      if (thisTimerWorker!=null) {
        thisTimerWorker.terminate();
      }
      this.setState({timerWorker: null});
      let currentStation = this.getStation(this.props.station);
      if (currentStation!=null) {
        let asrcs = self.getAudioSources(currentStation);
        this.setState({
          listeningMode: LM_Station,
          isPlaying: wasPlaying,
          planning: {
            href:'',
            name:'',
            schedule:[],
          },
          station: currentStation,
          stationPlaying:'', 
          audioSources: asrcs,
        });
      }
      if(wasPlaying) {
        this.playAudio();
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
          stationPlaying:'',
          audioSources: [],
          timerWorker:thisTimerWorker
        });
        self.setActiveStation(self);
        if (wasPlaying) {
          this.playAudio();
        }
      }
    }
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
              self.playAudio();
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
            self.playAudio();
          }
          return true;
        } else {
          prevItem.active=false;
          self.playAudio(); 
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
      this.setState({
        isPlaying: isPlaying,
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
      if (!this.state.station) {
        this.setState({
          isPlaying: false
        });
        // Stop audio?
        return false;
      }
      if (!this.state.isPlaying) {
        return false;
      } 
      var self = this;
      var stationid = null;
      if (typeof this.state.station.id !== 'undefined') {
        stationid = this.state.station.id;
      }
      if (stationid == null) return false;
      if (self.state.stationPlaying == stationid) return true;
      self.setState({
        stationPlaying: stationid
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

    playAudio = (AUserEvent) => {
      let asrcs = null;
      if (AUserEvent) {
        let isPlaying = this.state.isPlaying;
        this.setState({
          isPlaying: !isPlaying
        });
      }
      asrcs = this.state.audioSources;
      if (this.child) {
        let isPlayingOutcome = this.changeAudio();
        if (isPlayingOutcome) {
          this.setState({isLoading:true});
        }
        this.child.method(isPlayingOutcome, asrcs, this.state.stationPlaying);
      }
    }

    promptForRemoteDevice = () => {
      if (this.child) {
        this.child.promptForRemoteDevice();
      }
    }

    handleMediaSessionEvent = (AEvent) => {
      this.playAudio(AEvent);
    }

    closeFooter = () => {
      this.props.closeFooter();
    }

    getTime = (ANumber) => {
      if(ANumber<10) {
        return '0' + ANumber + ':00';
      } else {
        return ANumber + ':00';
      }
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

	render() {
    if ((this.props.listeningMode != this.state.listeningMode) || 
        (this.props.listeningMode == LM_Station && this.props.station != this.state.station.id) || 
        (this.props.listeningMode == LM_Planning && this.props.planning.href != this.state.planning.href)) {
      this.loadData();
    }
    let programInfo = '';
    let nextProgram = '';
    let programLogo = this.state.station.logosource ? this.state.station.logosource : null;
    let mediaName = this.state.listeningMode == LM_Station ? this.state.station.name : this.state.planning.name;
    if (this.state.listeningMode == LM_Station) {
      mediaName = <Link href={'/radio-station/'+this.props.station} class={style['footer__link'] + ' icon--info'}>{mediaName}</Link>;
    } else if (this.state.listeningMode == LM_Planning && this.state.planning && this.state.planning.href) {
      mediaName = <Link href={this.props.planning.href} class={style['footer__link'] + ' icon--info'}>{mediaName}</Link>;
      programInfo = this.state.station.name;
      let nextProgramItem = this.getNextScheduleItem();
      if(nextProgramItem) {
        let nextStation = this.getStation(nextProgramItem.station);
        nextProgram = this.getTime(nextProgramItem.startHour) + ' ' + nextStation.name;
      }
    }
    return (
			<footer class={style['footer'] + ' ' + (this.state.listeningMode==LM_None ? style['footer--hidden'] : style['footer--visible'])} style={programLogo ? 'background-image:url(' + programLogo + ')':null}>
				<div class={style['footer__item'] + ' ' + style['footer__item--audio']}>
          <button className={style['play-button'] + ' ' + (this.state.isPlaying ? style['play-button--stop'] : style['play-button--play']) + ' ' + (this.state.isPlaying && this.state.isLoading ? style['play-button--loading'] : '')} onClick={this.playAudio} data-isplaying={this.state.isPlaying} id="icoAudioControl">{this.state.isPlaying ? 'Stop' : 'Play'}</button>
          <AudioPlayer onRef={ref => (this.child = ref)} isPlaying={this.state.isPlaying} dataLoaded={this.dataLoaded} setRemoteDeviceSupport={this.setRemoteDeviceSupport} setConnectedToRemote={this.setConnectedToRemote} handleMediaSessionEvent={this.handleMediaSessionEvent} mediatitle={this.state.planning.name} mediaartist={programInfo} medialogo={programLogo} hasError={this.audioError} station={this.state.stationPlaying} sources={this.state.audioSources} />
          { this.state.hasRemoteDeviceSupport ? 
            <button class={'cast-button' + (this.state.connectedToRemote ? ' is-active' : '' )} onClick={this.promptForRemoteDevice}>Cast...</button>
            : null
          }
          <span class={style['audio-error'] + (this.state.audioError && this.state.audioError.message ? ' ' + style['audio-error--active'] : '')}>{(this.state.audioError && this.state.audioError.message ? this.state.audioError.message : '')}</span>
        </div>
        <div class={style['footer__item']}>
          <h3>{mediaName}</h3>
          {programInfo ? <p>{programInfo} <span class={style['footer__next-program']}>{nextProgram}</span></p> : null}          
        </div>
        <div class={style['footer__item'] + ' ' + style['footer__item--close']}>
          <button className={style['close-button']} title="Close" onClick={this.closeFooter}>Close</button>
        </div>
			</footer>
		);
	}
}