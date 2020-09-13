import { h, Component } from 'preact';
import style from './style';
import Header from '../../components/header';
import DropDown from '../../components/dropdown';
import { Link } from 'preact-router/match';
import { setDocumentMetaTags } from '../../utils/misc';

export default class Settings extends Component {
	constructor(props) {
		super(props);
		this.state = {
      docTitle: 'Settings',
      docDescription: 'Change some bits and pieces at 1tuner.com',
			themeOptions: [
				{text:'Default',value:'default'},
				{text:'Light',value:'light'},
				{text:'Dark',value:'dark'}
			]
		};
  }

  componentDidMount() {
		setDocumentMetaTags(this.state.docTitle, this.state.docDescription);
	}

	themeOptionChanged = optionValue => {
		this.callSaveSettings(optionValue)
	}

	formatExportLink = () => {
		let stationArr = [];
		if (this.props.stationList) {
			for (let i = 0; i < this.props.stationList.length; i++) {
				stationArr.push(this.props.stationList[i].id);
			}
		}
		let podcastArr = [];
		if (this.props.podcastList) {
			let maxItemCount = Math.min(this.props.podcastList.length, 5);
			for (let i = 0; i < maxItemCount; i++) {
				podcastArr.push(this.props.podcastList[i].feedUrl);
			}
		}
		return window.location.origin + '/settings/?stations=' + stationArr.join(',') + '&podcasts=' + podcastArr.join(',');
	}

  enablePodcastindexSearch = (ev) => {
		this.setPodcastindexSearch(true);
		ev.preventDefault();
	}
	disablePodcastindexSearch = (ev) => {
		this.setPodcastindexSearch(false);
		ev.preventDefault();
  }

	enableChromecastSupport = (ev) => {
		this.setChromecastSupport(true);
		ev.preventDefault();
	}
	disableChromecastSupport = (ev) => {
		this.setChromecastSupport(false);
		ev.preventDefault();
	}

	setPodcastindexSearch = (enable) => {
		this.callSaveSettings(null, null, enable);
  }

  setChromecastSupport = (enable) => {
		this.callSaveSettings(null, enable);
	}

  callSaveSettings = (themeValue, enableChromecastValue, enablePodcastindexSearchValue) => {
    let themeOption = this.state.themeOptions[0];
    if (this.props.settings && this.props.settings.theme) {
			themeOption = this.props.settings.theme;
    }
    if (themeValue) {
      document.body.setAttribute('data-theme', themeValue);
      themeOption = themeValue;
    }
    let enableChromecast = enableChromecastValue || (this.props.settings && this.props.settings.experimental && this.props.settings.experimental.chromecast);
    let enablePodcastindex = enablePodcastindexSearchValue || (this.props.settings && this.props.settings.experimental && this.props.settings.experimental.podcastindex);
		let settings = {
			theme: themeOption,
			experimental: {
        chromecast: enableChromecast,
        podcastindex: enablePodcastindex
			}
		};
		this.props.saveSettings(settings);
  }

	resetLocalPreferences = () => {
		if (window.confirm('Are you sure you want to delete all your local preferences, play history and playlists?')) {
		  this.props.resetLocalPreferences();
		}
	}

	render({settings},{docTitle, docDescription}) {
		return (
			<div class={'page-container'}>
				<Header title={docTitle} sharetext={docDescription} />
				<main class={'content ' + (style.settings)}>
					<h1 class={'main-title'}>{docTitle}
					<small class={'main-subtitle'}>🎚️ What does this button do?</small></h1>
					<h2 class={style['content-title']}>Theme</h2>
					<p class={style.selecttheme}><DropDown initialValue={settings && settings.theme ? settings.theme : 'default'} optionList={this.state.themeOptions} valueChanged={this.themeOptionChanged.bind(this)} /></p>
					<h2 class={style['content-title']}>Reset</h2>
					<p>If you don't want to leave traces on the computer you are using, or want a fresh start, you can use this option.</p>
					<button class={'btn btn--secondary'} onClick={this.resetLocalPreferences.bind(this)}>Reset now</button>
					<h2 class={style['content-title']}>About 1tuner.com</h2>
					<p>Here you can listen to online <Link href="/radio-stations" native>radio stations</Link>, <Link href="/podcasts" native>podcasts</Link> and create <Link href="/playlists" native>playlists</Link>.<br />
					This is a free web app - just add this site to your homescreen and you're good to go!</p>
					<Link href="/about" class={'btn btn--secondary'} native>Read more</Link>
					<div class={style.experimental}>
						<h2 class={style['content-title']}>🧪 Experimental</h2>
						{!settings || !settings.experimental || !settings.experimental.chromecast ?
							<p>Pssst! I'm working on Chromecast support. Want to try? OK, might be buggy, but 🤞 and <button onClick={this.enableChromecastSupport.bind(this)} class={'btn btn--small btn--secondary'}>Enable</button> Chromecast support</p>
							:
							<p>Thanks for checking this new functionality! Please let me know your thoughts <a href="https://twitter.com/1tuner" rel="noopener me" target="_blank">@1tuner</a>. 🙂<br/>Is the Chromecast functionality too buggy? <button onClick={this.disableChromecastSupport.bind(this)} class={'btn btn--small btn--secondary'}>Disable</button> Chromecast support then... 🙁</p>
						}
            {!settings || !settings.experimental || !settings.experimental.podcastindex ?
							<p>And maybe try <a href="https://podcastindex.org" target="_blank" rel="noopener">Podcastindex.org</a> as podcast search engine instead of Apple? <button onClick={this.enablePodcastindexSearch.bind(this)} class={'btn btn--small btn--secondary'}>Enable</button> the Podcastindex.org search engine.</p>
							:
							<p>Thanks for trying podcast search via <a href="https://podcastindex.org" target="_blank" rel="noopener">Podcastindex.org</a>! Please let me know your thoughts <a href="https://twitter.com/1tuner" rel="noopener me" target="_blank">@1tuner</a>. 🙂<br/>
              If you want to use Apple iTunes Search API again, then <button onClick={this.disablePodcastindexSearch.bind(this)} class={'btn btn--small btn--secondary'}>Disable</button> Podcastindex.org support... 🙁</p>
						}
					</div>
				</main>
			</div>
		);
	}
}
