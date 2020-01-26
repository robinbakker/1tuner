import { h, Component } from 'preact';
import style from './style';
import { Link } from 'preact-router/match';
import PlaylistList from '../../components/playlistlist';
import Loader from '../../components/loader';
import Header from '../../components/header';

export default class Playlists extends Component {
	componentDidMount() {
		document.title = 'Playlists - 1tuner';
	}

	changePlaylist = (APlaylist) => {
		this.props.changePlaylist(APlaylist, true);
	}

	render({playlists, stationList, currentUser}, {}) {
		if (!playlists || !stationList) {			
			return(
				<div class={'page-container'}>
					<Header title="Playlists" sharetext={'Plan your own radio listening at 1tuner.com'} />
					<main class={'content content--is-loading ' + (style.playlists)}>
						<h1 class={'main-title'}>Playlists
						<small class={'main-subtitle'}>⚡ Take control.</small></h1>
						<Loader />
					</main>
				</div>
			);			
		} else {
			return (
				<div class={'page-container'}>
					<Header title="Playlists" sharetext={'Plan your own radio listening at 1tuner.com'} />
					<main class={'content ' + (style.playlists)}>
						<h1 class={'main-title'}>Playlists</h1>
						<h3 class={'main-subtitle'}>⚡ Take control.</h3>
						<div class={'btn-container btn-container--right'}>
							<Link href="/playlist-edit" native class={'btn btn--create'}>New</Link>
						</div>
						<PlaylistList playlists={playlists} stationList={stationList} changePlaylist={this.changePlaylist.bind(this)} currentUser={currentUser} /> 
					</main>
				</div>
			);
		}
	}
}