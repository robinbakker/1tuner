import './style/index.css';

import { h, Component } from 'preact';
import { Router } from 'preact-router';
import Nav from './components/nav';
import Footer from './components/footer';
import Home from './routes/home';
import Stations from './routes/stations';
import Podcasts from './routes/podcasts';
import Podcast from './routes/podcast';
import Station from './routes/station';
import Playlists from './routes/playlists';
import Playlist from './routes/playlist';
import PlaylistEdit from './routes/playlist-edit';
import Settings from './routes/settings';
import About from './routes/about';
import Redirect from './components/redirect';
import Error from './routes/error';
import { version as AppVersion } from './package.json';
import { get, set, del, clear } from 'idb-keyval';
import * as Languages from './assets/data/languages.json';
import * as Featured from './assets/data/featured.json';

let oldHistoryPushState = history.pushState;
history.pushState = function () {
  oldHistoryPushState.apply(this, arguments);
  scrollTo(0, 0);
};

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      listeningMode: 0,
      featured: null,
      station: null,
      stationList: null,
      lastStationList: null,
      presetStationList: null,
      podcast: null,
      podcastList: null,
      stationPodcastList: null,
      playlist: null,
      playlists: null,
      languageList: null,
      settings: null,
      showFilterPanel: false,
      enableFilterPanel: false,
      stationsLoading: false,
      languagesLoading: false,
      lastPodcastSearchQuery: null,
      lastPodcastSearchResult: null,
      version: AppVersion,
      userVersion: null,
    };
  }

  componentDidMount() {
    this.loadData();
    if (window) {
      window.addEventListener('scroll', function () {
        document.body.classList.toggle('has-header', window.scrollY > 40);
      });
    }
  }

  loadData = async () => {
    const settings = await get('settings');
    if (settings && settings.theme) {
      document.body.setAttribute('data-theme', settings.theme);
    }
    if (settings && settings.experimental && settings.experimental.chromecast) {
      this.initChromeCast();
    }
    const userVersion = await get('version');
    let stationList =
      AppVersion !== userVersion
        ? await this.loadStationList()
        : this.state.stationList || (await get('station-list')) || (await this.loadStationList());
    stationList = this.removeOldStationsFromList(stationList);
    let stationPodcastList =
      AppVersion !== userVersion ? await this.loadStationPodcastList() : (await get('station-podcast-list')) || (await this.loadStationPodcastList());
    this.updatePodcastImageProperties(stationPodcastList);
    const listeningMode = (await get('lm')) || 0;

    const station = await get('station');
    const playlist = await get('playlist');
    const featuredPodcastList = this.loadDefaultPodcasts(stationPodcastList);
    let podcastList = (await get('podcast-list')) || featuredPodcastList;
    this.updatePodcastImageProperties(podcastList);

    let lastStationList = (await get('last-station-list')) || this.getLastStationList(stationList);
    lastStationList = this.removeOldStationsFromList(lastStationList);
    this.updateStationImageProperties(stationList, lastStationList);
    const featured = this.loadFeatured(stationList);

    const languageList =
      AppVersion !== userVersion ? this.loadLanguageList() : this.state.languageList || (await get('language-list')) || this.loadLanguageList();

    const playlists = this.state.playlists || (await get('playlists')) || this.loadPlaylists();

    this.setState(
      {
        listeningMode: listeningMode,
        userVersion: userVersion,
        settings: settings,
        station: station,
        playlist: playlist,
        playlists: playlists,
        languageList: languageList,
        podcastList: podcastList,
        stationPodcastList: stationPodcastList,
        stationList: stationList,
        lastStationList: lastStationList,
        featuredPodcastList: featuredPodcastList,
        presetStationList: JSON.parse(JSON.stringify(lastStationList)), // For now, we are filling the preset list with the previous last played station list
        featured: featured,
      },
      () => {
        this.saveLocal(true);
      }
    );
  };

  render(
    {},
    {
      listeningMode,
      settings,
      languageList,
      station,
      stationList,
      lastStationList,
      stationPodcastList,
      playlist,
      playlists,
      podcast,
      podcastList,
      featured,
      featuredPodcastList,
      lastPodcastSearchQuery,
      lastPodcastSearchResult,
      version,
    }
  ) {
    return (
      <div id="app">
        <Nav />
        <Router>
          <Home
            path="/"
            stationList={lastStationList}
            playlists={playlists}
            podcastList={podcastList}
            featured={featured}
            changeStation={this.changeStation.bind(this)}
            changePlaylist={this.changePlaylist.bind(this)}
          />
          <Stations
            path="/radio-stations"
            stationList={stationList}
            languageList={languageList}
            changeStation={this.changeStation.bind(this)}
            toggleFilterPanel={this.toggleFilterPanel.bind(this)}
            setLanguageList={this.setLanguageList.bind(this)}
          />
          <Station
            path="/radio-station/:id?"
            stationList={stationList}
            podcastList={stationPodcastList}
            changeStation={this.changeStation.bind(this)}
            reloadStationList={this.reloadStationList.bind(this)}
          />
          <Playlists path="/playlists" playlists={playlists} stationList={stationList} changePlaylist={this.changePlaylist.bind(this)} />
          <Playlist
            path="/playlist/:name/:params?"
            playlists={playlists}
            stationList={stationList}
            addPlaylist={this.addPlaylist.bind(this)}
            deletePlaylist={this.deletePlaylist.bind(this)}
            changePlaylist={this.changePlaylist.bind(this)}
          />
          <PlaylistEdit
            path="/playlist-edit/:name?/:params?"
            playlists={playlists}
            languageList={languageList}
            stationList={stationList}
            addPlaylist={this.addPlaylist.bind(this)}
            resetPlaylists={this.resetPlaylists.bind(this)}
          />
          <Podcasts
            path="/podcasts/:params?"
            latestPodcastSearchResult={this.latestPodcastSearchResult.bind(this)}
            settings={settings}
            searchQuery={lastPodcastSearchQuery}
            lastSearchResult={lastPodcastSearchResult}
            podcastList={podcastList}
            featuredPodcastList={featuredPodcastList}
          />
          <Podcast
            path="/podcast/:name/:feedcode?/:params?"
            savePodcastHistory={this.savePodcastHistory.bind(this)}
            podcastList={podcastList}
            stationPodcastList={stationPodcastList}
            lastPodcastSearchResult={lastPodcastSearchResult}
            playEpisode={this.playPodcastEpisode.bind(this)}
          />
          <Settings
            path="/settings/:params?"
            settings={settings}
            stationList={lastStationList}
            playlists={playlists}
            podcastList={podcastList}
            saveSettings={this.saveSettings.bind(this)}
            resetLocalPreferences={this.resetLocalPreferences.bind(this)}
          />
          <About path="/about" version={version} />
          <Redirect path="/planner" to="/playlists" />
          <Redirect path="/planning/:name/:params?" to="/playlist" />
          <Redirect path="/planning-edit/:name/:params?" to="/playlist-edit" />
          <Redirect path="/radio-station/npokx" to="/radio-station/npocampus" />
          <Redirect path="/radio-station/radio4all" to="/radio-station/yoursaferadio" />
          <Redirect path="/radio-station/vintageveronica" to="/radio-station/veronica-goud-van-oud" />
          <Error type="404" default />
        </Router>
        <Footer
          onRef={(ref) => (this.child = ref)}
          settings={settings}
          listeningMode={listeningMode}
          stationList={stationList}
          setListeningMode={this.setListeningMode.bind(this)}
          tuneToStation={this.tuneToStation.bind(this)}
          podcast={podcast}
          playlist={playlist}
          station={station}
          setPodcastEpisodeTimeElapsed={this.setPodcastEpisodeTimeElapsed.bind(this)}
          closeFooter={this.closeFooter.bind(this)}
        />
      </div>
    );
  }

  saveLocal = (AInit) => {
    if (typeof indexedDB !== 'undefined') {
      set('lm', this.state.listeningMode);
      set('settings', this.state.settings);
      set('station', this.state.station);
      set('playlist', this.state.playlist);
      set('playlists', this.state.playlists);
      set('podcast-list', this.state.podcastList);
      set('station-podcast-list', this.state.stationPodcastList);
      set('language-list', this.state.languageList);
      if (this.state.lastStationList) {
        set('last-station-list', this.state.lastStationList);
      }
      if (AInit) {
        set('version', this.state.version);
        set('station-list', this.state.stationList);
      }
    }
  };

  addToLastStationList = (AStation) => {
    let lsIndex = -1;
    let stationItem = null;
    let lsArray = this.state.lastStationList;
    if (lsArray) {
      for (var i = 0; i < lsArray.length; i++) {
        if (lsArray[i].id == AStation) {
          stationItem = lsArray[i];
          lsIndex = i;
          break;
        }
      }
      if (lsIndex >= 0) {
        lsArray.splice(lsIndex, 1);
        lsArray.unshift(stationItem);
        this.setState({ lastStationList: lsArray }, () => {
          this.saveLocal();
        });
        return;
      }
      if (this.state.stationList) {
        for (var i = 0; i < this.state.stationList.length; i++) {
          if (this.state.stationList[i].id == AStation) {
            stationItem = this.state.stationList[i];
            break;
          }
        }
        if (stationItem) {
          lsArray.splice(lsIndex, 1);
          lsArray.unshift(stationItem);
          this.setState({ lastStationList: lsArray }, () => {
            this.saveLocal();
          });
        }
      }
    }
  };

  setListeningMode = (AListeningMode) => {
    this.setState({ listeningMode: AListeningMode });
  };

  tuneToStation = (APrev) => {
    let presetList = this.state.presetStationList;
    let lastPlayedList = this.state.lastStationList;
    if (!presetList || presetList.length < 2 || !lastPlayedList || lastPlayedList.length < 2) {
      // something is wrong with the data, ignore tuning
      return;
    }
    if (!this.state.station) {
      this.changeStation(lastPlayedList[0].id, true);
    }
    let isFound = false;
    for (let i = 0; i < presetList.length; i++) {
      if (presetList[i].id === this.state.station) {
        let newIndex = APrev ? i - 1 : i + 1;
        if (newIndex >= presetList.length) {
          newIndex = 0;
        } else if (newIndex < 0) {
          newIndex = presetList.length - 1;
        }
        this.changeStation(presetList[newIndex].id, true);
        isFound = true;
        break;
      }
    }
    if (!isFound) {
      let stationItem = null;
      for (var i = 0; i < this.state.stationList.length; i++) {
        if (this.state.stationList[i].id == this.state.station) {
          stationItem = this.state.stationList[i];
          break;
        }
      }
      if (stationItem) {
        let insertIndex = 0;
        for (let i = 0; i < presetList.length; i++) {
          // find the last played station in the presetlist, use this index for the insert
          if (presetList[i].id === lastPlayedList[1].id) {
            insertIndex = i + 1;
            if (insertIndex >= presetList.length) {
              insertIndex = 0;
            }
            break;
          }
        }
        presetList.splice(insertIndex, 0, stationItem);
        let newIndex = APrev ? insertIndex - 1 : insertIndex + 1;
        if (newIndex >= presetList.length) {
          newIndex = 0;
        } else if (newIndex < 0) {
          newIndex = presetList.length - 1;
        }
        this.setState(
          {
            presetStationList: presetList,
          },
          () => {
            this.changeStation(presetList[newIndex].id, true);
          }
        );
      }
    }
  };

  changeStation = (AStation, AForcePlay) => {
    if (typeof AStation !== 'undefined' && AStation !== this.state.station) {
      this.addToLastStationList(AStation);
      this.setState(
        {
          listeningMode: 1,
          station: AStation,
          playlist: null,
        },
        () => {
          this.saveLocal();
        }
      );
    }
    if (AForcePlay && this.child) {
      this.child.forcePlay(AForcePlay);
    }
  };

  playPodcastEpisode = (APodcast, AForcePlay) => {
    if (APodcast) {
      this.setState(
        {
          listeningMode: 3,
          podcast: APodcast,
        },
        () => {
          this.saveLocal();
          if (AForcePlay && this.child) {
            this.child.forcePlay(AForcePlay);
          }
        }
      );
    }
  };

  setPodcastEpisodeTimeElapsed = (AFeedUrl, AMediaUrl, ASeconds) => {
    if (!AFeedUrl || !AMediaUrl || !ASeconds) {
      return;
    }
    let podcastList = this.state.podcastList;
    for (let i = 0; i < podcastList.length; i++) {
      let podcast = podcastList[i];
      if (!podcast || podcast.feedUrl != AFeedUrl || !podcast.episodes || !podcast.episodes.length) {
        continue;
      }
      for (let j = 0; j < podcast.episodes.length; j++) {
        if (podcast.episodes[j].url == AMediaUrl) {
          podcast.episodes[j].secondsElapsed = ASeconds;
          this.savePodcastHistory(podcast);
          return;
        }
      }
    }
  };

  changePlaylist = (APlaylist, AForcePlay) => {
    if ((APlaylist && !this.state.playlist) || (this.state.playlist && APlaylist.href !== this.state.playlist.href)) {
      this.setState(
        {
          listeningMode: 2,
          station: null,
          playlist: APlaylist,
        },
        () => {
          this.saveLocal();
        }
      );
    }
    if (AForcePlay && this.child) {
      this.child.forcePlay(AForcePlay);
    }
  };

  toggleFilterPanel = () => {
    var show = !this.state.showFilterPanel;
    this.setState({ showFilterPanel: show });
  };

  indexOfPlaylist = (APlaylistHref) => {
    if (this.state.playlists) {
      for (let i = 0; i < this.state.playlists.length; i++) {
        if (this.state.playlists[i].href === APlaylistHref) {
          return i;
        }
      }
    }
    return -1;
  };

  deletePlaylist = (APlaylistUrl) => {
    APlaylistUrl = APlaylistUrl.substr(APlaylistUrl.indexOf('/playlist'));
    let sList = this.state.playlists || [];
    let puIndex = this.indexOfPlaylist(APlaylistUrl);
    if (puIndex >= 0) {
      sList.splice(puIndex, 1);
      this.setState(
        {
          playlists: sList,
        },
        () => {
          this.saveLocal();
        }
      );
    }
  };

  addPlaylist = (APlaylist) => {
    if (APlaylist && APlaylist.href) {
      if (this.indexOfPlaylist(APlaylist.href) < 0) {
        let sList = this.state.playlists || [];
        sList.push(APlaylist);
        this.setState(
          {
            playlists: sList,
          },
          () => {
            this.saveLocal();
          }
        );
      }
    }
  };

  resetPlaylists = () => {
    if (this.state.playlists) {
      this.setState({
        playlists: null,
      });
    }
  };

  latestPodcastSearchResult = (ASearchQuery, ASearchResult) => {
    this.setState({
      lastPodcastSearchQuery: ASearchQuery,
      lastPodcastSearchResult: ASearchResult,
    });
  };

  saveSettings = (ASettings) => {
    if (!ASettings) {
      return;
    }
    this.setState(
      {
        settings: ASettings,
      },
      () => {
        this.saveLocal();
      }
    );
  };

  resetLocalPreferences = () => {
    if (typeof indexedDB !== 'undefined') {
      clear().then(() => {
        window.location.href = '/';
      });
    }
  };

  savePodcastHistory = (APodcast) => {
    if (!APodcast || !APodcast.feedUrl) {
      return;
    }
    let podcastArray = this.state.podcastList || [];
    let pcIndexArray = [];
    for (let i = 0; i < podcastArray.length; i++) {
      if (podcastArray[i].feedUrl == APodcast.feedUrl) {
        pcIndexArray.push(i);
      }
    }
    if (pcIndexArray.length) {
      pcIndexArray.forEach(function (pcIndex) {
        podcastArray.splice(pcIndex, 1);
      });
    }
    podcastArray.unshift(APodcast);
    if (podcastArray.length > 50) {
      podcastArray.slice(0, 50);
    }
    this.setState(
      {
        podcastList: podcastArray,
      },
      () => {
        set('podcast-list', podcastArray);
      }
    );
  };

  closeFooter = () => {
    this.setState(
      {
        listeningMode: 0,
        station: null,
        playlist: null,
      },
      () => {
        this.saveLocal();
        if (this.child) {
          this.child.forcePlay(true);
        }
      }
    );
  };

  loadLanguageList = () => {
    let selectedLanguages = [];
    if (typeof navigator !== 'undefined') {
      if (navigator.languages) {
        navigator.languages.forEach((e) => selectedLanguages.push(e.toLowerCase()));
      } else if (navigator.language) {
        selectedLanguages.push(navigator.language.toLowerCase());
      }
    }
    let langItems = Languages;
    if (langItems && langItems.default) {
      langItems = langItems.default;
    }
    let langs = [];
    for (let item in langItems) {
      let country = langItems[item].country_en;
      if (!country) country = langItems[item].country;
      langs.push({
        id: item,
        abbr: langItems[item].abbr,
        displayorder: langItems[item].displayorder,
        name: langItems[item].name,
        country: country,
        flag: langItems[item].flag,
        active: selectedLanguages.indexOf(item.toLowerCase()) != -1,
        preferred: selectedLanguages.length && selectedLanguages[0] == item,
      });
    }
    langs.sort(function (a, b) {
      var startA = a.displayorder;
      var startB = b.displayorder;
      if (startA < startB) {
        return -1;
      }
      if (startA > startB) {
        return 1;
      }
      return 0;
    });
    return langs;
  };

  reloadStationList = async (AStationID) => {
    let newStationList = await this.loadStationList(true);
    if (newStationList.some((item) => item.id == AStationID)) {
      this.setState(
        {
          stationList: newStationList,
        },
        () => {
          this.saveLocal(true);
        }
      );
    } else {
      // show error page and quit
      window.location.href = window.location.origin + '/invalid-station-id/' + AStationID;
    }
  };

  loadStationList = async (forceReload) => {
    let stationList = this.state.stationList;
    if (!stationList || stationList.length == 0 || forceReload) {
      let versionParam = '' + (forceReload ? new Date().getTime() : AppVersion);
      await fetch(window.location.origin + '/assets/data/stations.json?v=' + versionParam, {
        method: 'get',
      })
        .then((resp) => resp.json())
        .then(function (items) {
          let newState = [];
          for (let item in items) {
            newState.push({
              id: item,
              name: items[item].name,
              displayorder: items[item].displayorder,
              logosource: items[item].logosource,
              streams: items[item].streams,
              website: items[item].website,
              language: items[item].language,
              social: items[item].social,
              genres: items[item].genres,
              related: items[item].related,
              podcasts: items[item].podcasts,
            });
          }
          newState.sort(function (a, b) {
            var startA = a.displayorder;
            var startB = b.displayorder;
            if (startA < startB) {
              return -1;
            }
            if (startA > startB) {
              return 1;
            }
            return 0;
          });
          stationList = newState;
        })
        .catch(function (err) {
          // Error :(
          console.log(err);
        });
    }
    return stationList;
  };
  loadStationPodcastList = async () => {
    let stationPodcastList = this.state.stationPodcastList;
    if (!stationPodcastList || stationPodcastList.length == 0) {
      await fetch(window.location.origin + '/assets/data/podcasts.json?v=' + AppVersion, {
        method: 'get',
      })
        .then((resp) => resp.json())
        .then(function (data) {
          let newState = [];
          for (let item in data.podcasts) {
            newState.push(data.podcasts[item]);
          }
          stationPodcastList = newState;
        })
        .catch(function (err) {
          // Error :(
          console.log(err);
        });
    }
    return stationPodcastList;
  };
  loadFeatured = (AStationList) => {
    let newFeatured = this.state.featured;
    if (!newFeatured) {
      let items = Featured.featured;
      if (items && items.length) {
        let newState = {
          stationItem: this.getStation(items[0].station, AStationList),
          description: items[0].description,
        };
        newFeatured = newState;
      }
    }
    return newFeatured;
  };
  loadDefaultPodcasts = (APodcastDataList) => {
    if (!APodcastDataList) {
      return [];
    }
    let featuredPodcastList = [];
    const featuredFeeds = [
      'https://feeds.simplecast.com/54nAGcIl',
      'https://rss.art19.com/vandaag',
      'https://anchor.fm/s/21c734c4/podcast/rss',
      'https://podcast.npo.nl/feed/de-dag.xml',
    ];
    for (let i = 0; i < featuredFeeds.length; i++) {
      const lookupItem = APodcastDataList.find((p) => p.feedUrl === featuredFeeds[i]);
      if (lookupItem) {
        featuredPodcastList.push(lookupItem);
      }
    }
    return JSON.parse(JSON.stringify(featuredPodcastList));
  };
  loadPlaylists = () => {
    return [
      {
        href: '/playlist/Radio%202.5/?h0=3fm&h6=radio2&h9=3fm&h14=radio2&h18=3fm&h22=radio2',
        name: 'Radio 2.5',
        color: 'rgba(110, 156, 140, 0.75)',
        schedule: [
          {
            startHour: 0,
            endHour: 6,
            station: '3fm',
          },
          {
            startHour: 6,
            endHour: 9,
            station: 'radio2',
          },
          {
            startHour: 9,
            endHour: 14,
            station: '3fm',
          },
          {
            startHour: 14,
            endHour: 18,
            station: 'radio2',
          },
          {
            startHour: 18,
            endHour: 22,
            station: '3fm',
          },
          {
            startHour: 22,
            endHour: 24,
            station: 'radio2',
          },
        ],
      },
    ];
  };

  getStation = (AStation, AStationList) => {
    let stationList = this.state.stationList || AStationList;
    if (!stationList || !stationList.length) {
      return null;
    }
    let Result = null;
    for (let i = 0; i < stationList.length; i++) {
      if (stationList[i].id == AStation) {
        Result = stationList[i];
        break;
      }
    }
    return Result;
  };

  setLanguageList = (ALanguageList) => {
    if (ALanguageList) {
      this.setState(
        {
          languageList: ALanguageList,
        },
        () => {
          this.saveLocal();
        }
      );
    }
  };

  getLastStationList = (AStationList) => {
    let stationList = AStationList || this.state.stationList;
    if (!stationList) {
      return;
    }
    let lastStations = [];
    for (var i = 0; i < 10; i++) {
      if (stationList.length <= i) break;
      lastStations.push(stationList[i]);
    }
    return lastStations;
  };
  setPlaylists = (APlaylists) => {
    if (APlaylists) {
      this.setState(
        {
          playlists: APlaylists,
        },
        () => {
          this.saveLocal();
        }
      );
    }
  };

  updatePodcastImageProperties = (APodcastList) => {
    if (!APodcastList) return;
    for (let i = 0; i < APodcastList.length; i++) {
      if (!APodcastList[i].logo) {
        APodcastList[i].logo = APodcastList[i].artworkUrl;
      }
      if (!APodcastList[i].logo600 && APodcastList[i].artworkUrl600) {
        APodcastList[i].logo600 = APodcastList[i].artworkUrl600;
      }
    }
  };

  updateStationImageProperties = (ABaseStationList, AStationListSelection) => {
    if (!ABaseStationList || !AStationListSelection) return;
    for (let i = 0; i < AStationListSelection.length; i++) {
      const lookupItem = ABaseStationList.find((s) => s.id === AStationListSelection[i].id);
      if (lookupItem) {
        AStationListSelection[i].logosource = lookupItem.logosource;
      }
    }
  };

  removeOldStationsFromList = (AStationList) => {
    let newList = AStationList;
    const removeStationIDList = ['kink-nl', 'kink-indie', 'the-edge', 'swijnenstal', 'k-rock-nl'];
    if (
      AStationList.some((item) => {
        return removeStationIDList.indexOf(item.id) !== -1;
      })
    ) {
      // Temp fix to remove old stations
      newList = [...AStationList].filter((s) => removeStationIDList.indexOf(s.id) === -1);
    }
    return newList;
  };

  initChromeCast = () => {
    if (window && !window.__onGCastApiAvailable) {
      //console.log('initChromeCast');
      let s = document.createElement('script');
      s.setAttribute('src', 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1');
      document.head.appendChild(s);
      window['__onGCastApiAvailable'] = (isAvailable) => {
        if (isAvailable) {
          this.initializeCastApi();
        }
      };
    }
  };

  initializeCastApi = () => {
    if (typeof cast === 'undefined') return;
    //console.log('initializeCastApi');
    cast.framework.CastContext.getInstance().setOptions({
      receiverApplicationId: '2CFD5B94',
      autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
      androidReceiverCompatible: true,
    });
  };
}
