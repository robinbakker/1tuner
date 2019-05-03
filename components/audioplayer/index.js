import { h, Component } from 'preact';
import AudioPlayerSource from '../audioplayersource'

export default class AudioPlayer extends Component {  
  constructor(props) {
    super(props);
    
    this.state = {
      isPlaying: false,
      promiseIsPlaying:false,
      station: '',
      errorMessage: null,
      srcItems:[],
      callbackId: -1
    };
  }

  componentWillUnmount() {
    this.props.onRef(null);
  }
  method(AIsPlaying, ASrcs, AStationPlaying) {
    let stationPlaying = this.props.station;
    if (AIsPlaying) {
      let srcItems = [];
      if(ASrcs && ASrcs.length) {
        stationPlaying = AStationPlaying;
        ASrcs.forEach((source) => {
          srcItems.push(<AudioPlayerSource isPlaying={AIsPlaying} source={source} />);
        });
      } else {
        this.props.sources.forEach((source) => {
          srcItems.push(<AudioPlayerSource isPlaying={AIsPlaying} source={source} />);
        });
      }
      this.setState({
        srcItems:srcItems,
        errorMessage:null
      });
      this.props.hasError(null);
    }
    this.checkAudio(AIsPlaying, stationPlaying);
  }

  // promptForRemoteDevice = () => {
  //   let self = this;
  //   let audioElement = document.getElementById('audioPlay');
  //   if (audioElement.remote) {
  //     audioElement.remote.prompt()
  //     .then(x => {
  //       self.props.setConnectedToRemote(true);
  //     })
  //     .catch(error => {
  //        console.log('Argh! ' + error);
  //        self.props.setRemoteDeviceSupport(false);
  //     });
  //   } else if (audioElement.webkitShowPlaybackTargetPicker) {
  //     audioElement.webkitShowPlaybackTargetPicker();
  //   }
  // }
  
  componentDidMount() {	
    this.props.onRef(this);	
    var self = this;
    if (typeof window !== 'undefined') {
      window.addEventListener('offline', function() { self.handleAudioError(); });
    }
    if (typeof document !== 'undefined') {
      let audioElement = document.getElementById('audioPlay');
      
      /*if (audioElement.remote) {
        this.props.setRemoteDeviceSupport(true);
        this.updateRemoteState(audioElement);
        audioElement.remote.addEventListener('connect', function(event) {
          // Connected means that the transition from local to remote playback
          // has finished and all media commands now take effect on the remote
          // playback state.
          console.log('Connected to the remote device.');
          self.props.setConnectedToRemote(true);
          self.updateRemoteState(audioElement);
        });
        audioElement.remote.addEventListener('connecting', function(event) {
          // Connecting means that the user agent is attempting to initiate
          // remote playback with the selected remote playback device. The
          // local playback of the media element continues in this state and
          // media commands still take effect on the local playback state.
          console.log('Connecting to the remote device...');
          self.updateRemoteState(audioElement);
        });
        audioElement.remote.addEventListener('disconnect', function(event) {
          // Disconnected means that the remote playback has not been
          // initiated, has failed to initiate or has been stopped. All media
          // commands will take effect on the local playback state.
          console.log('Disconnected from the remote device.');
          self.props.setConnectedToRemote(false);
          self.updateRemoteState(audioElement);
        });
      } else if (audioElement.webkitShowPlaybackTargetPicker) {
        this.updateRemoteStateWebKit(audioElement);
	      audioElement.addEventListener('webkitcurrentplaybacktargetiswirelesschanged', function(e) {
          self.updateRemoteStateWebKit(audioElement);
        });
      }*/
    }
  }

  // updateRemoteState = (AMediaElement) => {
  //   var self = this;
  //   //debugger;
  //   if (AMediaElement.remote.state == 'disconnected') {
  //     // Let's watch remote device availability when there's no connected
  //     // remote device.
  //     console.log('Starting watching remote device availability...');
  //     AMediaElement.remote.watchAvailability(self.handleAvailabilityChange)
  //     .then(id => {
  //       console.log('> Started watching remote device availability: ' + id);
  //       self.setState({ callbackId: id });
  //     })
  //     .catch(error => {
  //       debugger;
  //       console.log('> Argh! ' + error);
  //       self.handleAvailabilityChange(true); /* availability */
  //     });
  //   } else if (this.state.callbackId != -1) {
  //     // If remote device is connecting or connected, we should stop
  //     // watching remote device availability to save power.
  //     console.log('Stopping watching remote device availability...');
  //     AMediaElement.remote.cancelWatchAvailability(this.state.callbackId)
  //     .then(_ => {
  //       console.log('Stopped watching remote device availability');
  //       self.setState({ callbackId: -1 });
  //     })
  //     .catch(error => {
  //       debugger;
  //       console.log('> Argh! ' + error);
  //     });
  //   }
  // };

  // updateRemoteStateWebKit = (AMediaElement) => {
  //   console.log('webkitCurrentPlaybackTargetIsWireless = ' + AMediaElement.webkitCurrentPlaybackTargetIsWireless);
  //   if (!AMediaElement.webkitCurrentPlaybackTargetIsWireless) {
  //     // Let's watch remote device availability when there's no connected
  //     // remote device.
  //     console.log('Starting watching remote device availability...');
  //     AMediaElement.addEventListener('webkitplaybacktargetavailabilitychanged', onWebKitPlaybackTargetAvailabilityChanged);
  //   } else {
  //     // If remote device is connecting or connected, we should stop
  //     // watching remote device availability to save power.
  //     console.log('Stopping watching remote device availability...');
  //     AMediaElement.removeEventListener('webkitplaybacktargetavailabilitychanged', onWebKitPlaybackTargetAvailabilityChanged);
  //   }
  // }

  // onWebKitPlaybackTargetAvailabilityChanged = (AEvent) => {
  //   console.log('Remote device ' + AEvent.availability);
  //   //this.props.setRemoteDeviceSupport(AEvent.availability=='available');
  // };

  // handleAvailabilityChange = (AAvailability) => {
  //   console.log('Remote device ' + (AAvailability ? 'available' : 'not available'));
  //   //this.props.setRemoteDeviceSupport(AAvailability);
  // }
  
  checkAudio = (AIsPlaying, AStationPlaying) => {
    let stationPlaying = !AStationPlaying ? this.props.station : AStationPlaying;
    if (this.state.isPlaying==AIsPlaying && this.state.station==stationPlaying && (!this.state.errorMessage || (this.state.errorMessage && this.errorMessage.code!=1000))) {
      return;
    }
    this.setState({
      isPlaying: AIsPlaying,
      station: stationPlaying,
    });
    var audioPL = document.getElementById('audioPlay');
    
    if (typeof audioPL !== 'undefined' && audioPL != null) {
      let isOffline = ('onLine' in navigator && !navigator.onLine);
      if (isOffline) {
        this.setState({
          errorMessage: {
          code: 1000,
          message: 'Offline',
          source: ''
          }
        });
        this.props.hasError(this.state.errorMessage);
        return; // Makes no sense to reconnect now...
      }
      if (!AIsPlaying || this.state.station!=this.props.station || this.state.errorMessage!=null) {
        if (!audioPL.paused) {
          audioPL.pause();
        }        
        audioPL.removeAttribute('src');
        audioPL.load();
        this.setState({
          errorMessage: null
        });
        if(!AIsPlaying) return;
      }
      audioPL.removeAttribute('src');
      audioPL.load();
      var self = this;
      var playPromise = audioPL.play();
  if (playPromise !== undefined) {
    playPromise.then(_ => {
      // Automatic playback started!
      // Show playing UI.
      self.setState({
        isPlaying: true,
        promiseIsPlaying: true,
      });
    }).catch(error => {
      // Auto-play was prevented
      // Show paused UI.
      self.setState({
        isPlaying: false,
        promiseIsPlaying:false,
      });
    });
  }
      this.startMediaSession();
    }
  }

  startMediaSession = () =>  {
    if ('mediaSession' in navigator) {
      let logoSource = {};
      let mLogo = this.props.medialogo;
      if(typeof mLogo === 'undefined' || (typeof mLogo !== 'undefined' && mLogo.indexOf('data')==0)) { 
        logoSource = { src: 'https://1tuner.com/assets/icons/android-chrome-512x512.png', type: 'image/png' };
       } else {
        let imgType = 'image/png';
        if(mLogo.indexOf('.svg')>0) {
          imgType = 'image/svg+xml';
        } else if(mLogo.indexOf('.jpg')>0) {
          imgType = 'image/jpg';
        }
        logoSource = { src: mLogo,  type: imgType };
       }
      navigator.mediaSession.metadata = new MediaMetadata({
        title: this.props.mediatitle,
        artist: this.props.mediaartist,
        album: this.props.station,
        artwork: [
          logoSource
        ]
      });
      let self = this;
      navigator.mediaSession.setActionHandler('play', _ => self.mediaSessionPlay());
      navigator.mediaSession.setActionHandler('pause', _ => self.mediaSessionPause());
    }
  }

  mediaSessionPlay = () => {
    this.props.handleMediaSessionEvent('play');
    navigator.mediaSession.playbackState = "playing";
  }
  mediaSessionPause = () => {
    this.props.handleMediaSessionEvent('pause');
    navigator.mediaSession.playbackState = "paused";
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
          var self = this;
          setTimeout(3000, function() { self.checkAudio(true); });
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
        isPlaying: false,
        errorMessage: Error
      });
      this.props.hasError(Error);
    }
  }

  handleLoadedData = () => {
    this.props.dataLoaded();
  }

	render() {
    return (
      <audio id="audioPlay" onLoadedData={this.handleLoadedData.bind(this)} onerror={this.handleAudioError.bind(this)}>{this.state.srcItems}</audio>
		);
	}
}