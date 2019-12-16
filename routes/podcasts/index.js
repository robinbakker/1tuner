import { h, Component } from 'preact';
import style from './style';
import PodcastList from '../../components/podcastlist';
import Header from '../../components/header';

export default class Podcasts extends Component {
	constructor(props) {
		super(props);
		this.state = {
			searchQuery: null,
			searchTimer: 0,
			lastSearchResult: null,
			podcastList: null,
			errorMessage: null
		};
	}

	componentDidMount() {
		document.title = 'Find Podcasts - 1tuner';	
		this.setState({
			searchQuery: this.props.searchQuery, 
			lastSearchResult: this.props.lastSearchResult,
			podcastList: this.props.podcastList
		});
	}

	toggleFilterPanel = () => {
		this.props.toggleFilterPanel();
	}

	setSearchQuery = (e) => {
		let q = e.target.value;
		let timer = this.state.searchTimer;
		let self = this;
		clearTimeout(timer);
		if (q && q.length>2) {
			timer = setTimeout(function() {self.findPodcasts();}, 500);
		}
		this.setState({searchQuery:q, searchTimer:timer});
		e.preventDefault();
	}

	findPodcasts = () => {
		if (!this.state.searchQuery) {
			return;
		}
		let self = this;
		fetch(`https://itunes.apple.com/search?term=${this.state.searchQuery}&media=podcast`).then((resp) => resp.json())
		.then(function(data) {
			if (!data || !data.results ||  !data.results.length) {
				self.setState({ errorMessage: 'Sorry, nothing found for "' + self.state.searchQuery + '"... 😥 Maybe you can try to change your search query?' })
				return;
			}
			let newState = [];
			for (let item in data.results) {
				newState.push({
					feedUrl: data.results[item].feedUrl,
					name: data.results[item].collectionName,
					artworkUrl: data.results[item].artworkUrl100,
					artworkUrl600: data.results[item].artworkUrl600, 					
					collectionid: data.results[item].collectionid
				});
			}
			self.props.latestPodcastSearchResult(self.state.searchQuery, newState);
			self.setState({lastSearchResult: newState, errorMessage: null})
		}).catch(err => {
			self.setState({lastSearchResult: null, errorMessage:'🎇 BANG! - That\'s an error... Sorry! Please try again or rephrase your search query.'})
			console.log(err);
		});
	}

	resetSearchQuery = () => {
		let timer = this.state.searchTimer;
		clearTimeout(timer);
		this.props.latestPodcastSearchResult('', null);
		this.setState({searchQuery:'', lastSearchResult: null, errorMessage: null, searchTimer:0});
	}

	setSearchInputBlur = () => {
		if (typeof document != 'undefined') {
			setTimeout(function() {
				document.body.classList.remove('search-focus');
			}, 500);
		}
	}
	setSearchInputFocus = () => {
		if (typeof document != 'undefined') {
			document.body.classList.add('search-focus');
		}
	}
	onKeyDown = (e) => {
		if (e.keyCode === 13) {
			e.preventDefault();
		}
		return false;
	}

	render() {
		return (
			<div class={'page-container'}>
			<Header title="Podcasts" sharetext={'Listen to podcasts at 1tuner.com'} />
			<main class={'content ' + (style.podcasts)}>
				<h1 class={'main-title'}>Podcasts
				<small class={'main-subtitle'}>Listen to your favorite podcast 🎙️</small></h1>
				<form class={style['form-search']}>
					<input type="text" placeholder="Find..." value={this.state.searchQuery} maxlength="100" required pattern="[a-zA-Z0-9\s]+" class={'textfield ' + style['textfield--search']} onFocus={this.setSearchInputFocus.bind(this)} onBlur={this.setSearchInputBlur.bind(this)} onKeyDown={this.onKeyDown} onInput={this.setSearchQuery.bind(this)} />
					<button class={style['btn-search-reset']} onClick={this.resetSearchQuery.bind(this)} type="reset">Reset</button>
				</form>
				<div>
				{this.state.searchQuery && this.state.searchQuery.length ?
					<PodcastList podcastList={this.state.lastSearchResult} errorMessage={this.state.errorMessage} limitCount={100} />
					:
					null
				}
				</div>				
				{this.state.podcastList && this.state.podcastList.length ?
					<section class={style.section + ' content__section content__section--podcasts'}>
						<h3 class={'section-title'}>Last visited</h3>
						<div class={'section-main'}>
						<PodcastList podcastList={this.state.podcastList} horizontal={true} small={true} limitCount={10} />
						</div>
					</section>
					:
					null					
				}				
			</main>
			</div>
		);
	}
}