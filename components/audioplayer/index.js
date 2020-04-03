import { h, Component } from 'preact';
import AudioPlayerSource from '../audioplayersource';

const RECONNECT_TIMEOUT = 1000;
const RECONNECT_MAXTRIES = 120;

export default class AudioPlayer extends Component {  
  constructor(props) {
    super(props);
    
    this.state = {
      isPlaying: false,
      promiseIsPlaying:false,
      mediaid: '',
      errorMessage: null,
      srcItems:[],
      sources:[],
      callbackId: -1,
      reconnectTimerWorker: null,
      reconnectTriesCount:0,
      usePause: false,
      isCasting: false
    };
  }

  componentWillUnmount() {
    this.props.onRef(null);
  }

  method(AIsPlaying, ASrcs, AMediaIDPlaying, AUsePause, ASecondsElapsed) {
    let self = this;
    let mediaPlaying = this.state.mediaid;
    let resumeAtSeconds = 0;
    if (AIsPlaying && (mediaPlaying != AMediaIDPlaying || !this.state.srcItems.length)) {
      let srcItems = [];
      if (ASrcs && ASrcs.length) {
        mediaPlaying = AMediaIDPlaying;
        ASrcs.forEach((source) => {
          srcItems.push(<AudioPlayerSource isPlaying={AIsPlaying} usePause={AUsePause} source={source} />);
        });
      } else {
        this.props.sources.forEach((source) => {
          srcItems.push(<AudioPlayerSource isPlaying={AIsPlaying} usePause={AUsePause} source={source} />);
        });
      }
      this.setState({
        sources: ASrcs,
        srcItems: srcItems,
        errorMessage: null,
        usePause: AUsePause
      }, () => {
        self.props.hasError(null);
        if (AUsePause && ASecondsElapsed) {
          resumeAtSeconds = ASecondsElapsed;
        }
        self.checkAudio(AIsPlaying, AMediaIDPlaying, resumeAtSeconds); 
      });      
    } else {
      if (this.state.usePause != AUsePause) {
        this.setState({usePause: AUsePause}, () => {
          self.checkAudio(AIsPlaying, AMediaIDPlaying, resumeAtSeconds); 
        });
      } else {
        self.checkAudio(AIsPlaying, AMediaIDPlaying, resumeAtSeconds); 
      }
    }
  }

  seekAudio = (ASeconds) => {
    if (!ASeconds) {
      return;
    }
    if (this.state.isCasting) {
      let request = new chrome.cast.media.SeekRequest();
      if (request) {
        request.currentTime = AResumeAtSeconds;
        request.resumeState = chrome.cast.media.ResumeState.PLAYBACK_START;
        session.media[0].seek(request,
        ()=>{console.log('seek success')},
        ()=>{console.log('seek error')});
      }
    } else {
      let audioPL = document.getElementById('audioPlay');
      if (ASeconds < 0) {
        ASeconds = Math.abs(ASeconds);
        if (audioPL.currentTime<=ASeconds) {
          audioPL.currentTime = 0;
        } else {
          audioPL.currentTime -= ASeconds;
        }
      } else {
        if (audioPL.currentTime >= audioPL.duration - ASeconds) {
          audioPL.currentTime = audioPL.duration-.1;
        } else {
          audioPL.currentTime += ASeconds;
        }
      }
    }
  }
  
  componentDidMount() {	
    this.props.onRef(this);	
    var self = this;
    if (typeof window !== 'undefined') {
      window.addEventListener('offline', function() { self.handleAudioError(); });
    }
  }

  setReconnectTimer = () => {
    let thisTimerWorker = this.state.reconnectTimerWorker;
    if (thisTimerWorker) {
      return; //Worker is running, return
    }
    let self= this;
    if (window.Worker && thisTimerWorker==null) {
      try {
        thisTimerWorker = new Worker('/assets/workers/timer.js');
        thisTimerWorker.postMessage(RECONNECT_TIMEOUT);
        thisTimerWorker.addEventListener('message', function(AMessage) { self.handleMessageFromTimerWorker(AMessage, self); });
        self.setState({
          reconnectTimerWorker: thisTimerWorker,
          reconnectTriesCount: 0
        });
      } catch(error) {
        console.log(error);
        self.setState({
          reconnectTimerWorker: null,
          reconnectTriesCount: 0
        });
      }
    }
  }

  handleMessageFromTimerWorker = (AMessage, ASelfRef) => {
    let self = ASelfRef || this;
    let triesCount = this.state.reconnectTriesCount + 1;
    if (triesCount >= RECONNECT_MAXTRIES) {
      self.killReconnectTimer();
      self.checkAudio(false);      
    } else {
      this.setState({
        reconnectTriesCount: triesCount
      });
      self.checkAudio(true);
    }
  }

  killReconnectTimer = () => {
    let thisTimerWorker = this.state.reconnectTimerWorker;
    if (thisTimerWorker != null) {
      thisTimerWorker.terminate();
      this.setState({
        reconnectTimerWorker: null,
        reconnectTriesCount: 0
      });
    }    
  }
  
  checkAudio = (AIsPlaying, AMediaPlayingID, AResumeAtSeconds) => {
    let mediaPlayingID = AMediaPlayingID ? AMediaPlayingID : this.props.mediaid;
    let isSameMedia = this.state.mediaid == mediaPlayingID;
    let isCasting = this.state.isCasting;
    let castSession = window && !(typeof cast === 'undefined') ? cast.framework.CastContext.getInstance().getCurrentSession() : null;
    let castSessionChanged = false;
    if (castSession == null) {
      castSessionChanged = isCasting; // no castSession, but has isCasting flag
    } else {
      let sessionState = castSession.getSessionState();
      if (sessionState === cast.framework.SessionState.SESSION_STARTED || sessionState === cast.framework.SessionState.SESSION_RESUMED) {
        if (!isCasting) {
          isCasting = true;
          castSessionChanged = true;
        }
      }
    }
    if (this.state.isPlaying == AIsPlaying && isSameMedia && !this.state.errorMessage && !castSessionChanged) {
      return; // Nothing changed
    }
    let self = this;
    let isOffline = ('onLine' in navigator && !navigator.onLine);
    if (isOffline) {
      // Makes no sense to checkAudio/reconnect now... Try again later
      //console.log('checkAudio: offline, try again later');
      this.setReconnectTimer();
      this.setState({
        errorMessage: {
          code: 1000,
          message: 'Offline',
          source: ''
        }
      }, () => {
        self.props.hasError(self.state.errorMessage);
      });      
      return;
    }
    this.killReconnectTimer();
    let audioPL = document.getElementById('audioPlay');
    if (typeof audioPL === 'undefined' || audioPL == null) {
      return;
    }
    let errorMessage = this.state.errorMessage;
    if (!AIsPlaying || mediaPlayingID!=this.props.mediaid || errorMessage!=null || castSessionChanged) {
      if (!audioPL.paused) {
        audioPL.pause();
      }
      if (!this.state.usePause || isCasting) {
        audioPL.removeAttribute('src');
        audioPL.load();
      }
      if (isCasting) {
        var player = new cast.framework.RemotePlayer();
        var controller = new cast.framework.RemotePlayerController(player);
        if (controller) {
          if (this.state.usePause) {
            controller.playOrPause();
          } else {
            controller.stop();
          }
        }
      }
      errorMessage = null;
      this.props.hasError();
      if (!AIsPlaying) {
        this.setState({
          isPlaying: AIsPlaying,
          mediaid: mediaPlayingID,
          errorMessage: errorMessage,
          isCasting: isCasting
        });
        return;
      }
    }
    if (!this.state.usePause || !isSameMedia) {
      audioPL.removeAttribute('src');
      audioPL.load();
      if (AResumeAtSeconds) {
        if (isCasting) {
          let castSession = window && !(typeof cast === 'undefined') ? cast.framework.CastContext.getInstance().getCurrentSession() : null;
          var request = new chrome.cast.media.SeekRequest();
          if (request && castSession) {
            request.currentTime = AResumeAtSeconds;
            request.resumeState = chrome.cast.media.ResumeState.PLAYBACK_START;            
            castSession.media[0].seek(request,
            ()=>{console.log("seek success")},
            ()=>{console.log("seek error")});
          }
        } else {
          this.seekAudio(AResumeAtSeconds);
        }
      }
    } else {
      this.handleLoadedData();
    }
    if(isCasting && this.state.sources.length) {
      // Play on Chromecast
      const mediaInfo = new chrome.cast.media.MediaInfo(this.state.sources[0].url, this.state.sources[0].mimetype);
      mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata();
      mediaInfo.metadata.metadataType = chrome.cast.media.MetadataType.GENERIC;
      mediaInfo.metadata.title = this.props.mediatitle || this.props.mediaartist;
      mediaInfo.metadata.images = [
        {'url':this.props.medialogo || 'https://1tuner.com/assets/icons/icon-512x512.png'}
      ];

      var request = new chrome.cast.media.LoadRequest(mediaInfo);
      castSession.loadMedia(request).then(
        function() { console.log('Load succeed'); },
        function(errorCode) { console.log('Error code: ' + errorCode); debugger; console.log(castSession); });
    } else {
      let playPromise = audioPL.play();
      if (playPromise !== undefined) {
        playPromise.then(_ => {
          // Automatic playback started! // Show playing UI.
          self.setState({
            isPlaying: true,
            promiseIsPlaying: true,
            errorMessage: null,
            mediaid: mediaPlayingID
          });
        }).catch(() => {
          // Auto-play was prevented // Show paused UI.
          self.setState({
            isPlaying: false,
            promiseIsPlaying:false,
            errorMessage: null,
            mediaid: mediaPlayingID
          });
        });
      }
    }
    this.startMediaSession();    
  }

  startMediaSession = () =>  {
    if ('mediaSession' in navigator) {
      let logoSource = {};
      let mLogo = this.props.medialogo;
      if (typeof mLogo === 'undefined' || (typeof mLogo !== 'undefined' && mLogo.indexOf('data')==0)) { 
        logoSource = { src: 'https://1tuner.com/assets/icons/icon-512x512.png', type: 'image/png' };
      } else {
        let imgType = 'image/png';
        if (mLogo.indexOf('.svg') > 0) {
          imgType = 'image/svg+xml';
        } else if (mLogo.indexOf('.jpg')>0) {
          imgType = 'image/jpg';
        }
        logoSource = { src: mLogo,  type: imgType };
      }
      navigator.mediaSession.metadata = new MediaMetadata({
        title: this.props.mediatitle,
        artist: this.props.mediaartist,
        album: this.props.mediaid,
        artwork: [
          logoSource
        ]
      });
      navigator.mediaSession.setActionHandler('play', _ => this.mediaSessionPlay());
      navigator.mediaSession.setActionHandler('pause', _ => this.mediaSessionPause());
      //navigator.mediaSession.setActionHandler('stop', _ => self.mediaSessionStop());
      navigator.mediaSession.setActionHandler('previoustrack', _ => this.mediaSessionPrev());
      navigator.mediaSession.setActionHandler('nexttrack', _ => this.mediaSessionNext());
    }
  }

  mediaSessionPlay = () => {
    this.props.handleMediaSessionEvent('play');
    navigator.mediaSession.playbackState = 'playing';
  }
  mediaSessionPause = () => {
    this.props.handleMediaSessionEvent('pause');
    navigator.mediaSession.playbackState = 'paused';
  }
  mediaSessionStop = () => {
    this.props.handleMediaSessionEvent('stop');
    navigator.mediaSession.playbackState = 'none';
  }
  mediaSessionPrev = () => {
    this.props.handleMediaSessionEvent('prev');
  }
  mediaSessionNext = () => {
    this.props.handleMediaSessionEvent('next');
  }

  handleAudioError = (e) => {
    let Error = null;
    if (!e || !e.target || typeof e.target.error === 'undefined' || typeof e.target.error.code === 'undefined') {
      if ('onLine' in navigator && !navigator.onLine) {
        Error = {
          code: 1000,
          message: 'Offline',
          source: ''
        };
        this.setReconnectTimer();
        console.log('handleAudioError: offline, try again later');
      } else {
        Error = {
          code: 0,
          message: 'An unknown source error occured.',
          source: '' //this.props.source
        };
      }
    } else {
      switch (e.target.error.code) {
        case e.target.error.MEDIA_ERR_ABORTED:
          Error = {
            code: e.target.error.code,
            message: 'You aborted the playback?',
            source: '' //this.props.source
          };
          break;
        case e.target.error.MEDIA_ERR_NETWORK:
          Error = {
            code: e.target.error.code,
            message:'A network error caused the audio download to fail.',
            source: '' //this.props.source 
          };
          this.setReconnectTimer();
          console.log('handleAudioError: network error, try again later');
          break;
        case e.target.error.MEDIA_ERR_DECODE:
        case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
          Error = {
            code: e.target.error.code,
            message:'The audio could not be played. Will try another source.',
            source: '' //this.props.source 
          };
          break;
        default:
          Error = {
            code: e.target.error.code,
            message:'An unknown error occurred.',
            source: '' //this.props.source 
          };
          break;
      }
    }
    if (Error != null) {
      this.setState({
        isPlaying: Error && Error.code == 1000, // try playing state for offline mode 
        errorMessage: Error
      }, () => {
        this.props.hasError(Error);
      });      
    }
  }

  timeUpdate = (AEvent) => {
    this.props.timeUpdate(AEvent.currentTarget);
  }

  handleLoadedData = () => {
    this.props.dataLoaded();
  }

	render() {
    return (
      <audio id="audioPlay" onLoadedData={this.handleLoadedData.bind(this)} ontimeupdate={this.timeUpdate.bind(this)} onerror={this.handleAudioError.bind(this)}>{this.state.srcItems}</audio>
		);
	}
}