import { h, Component } from 'preact';
import style from './style';
import { Link } from 'preact-router/match';
import PlaylistList from '../../components/playlistlist';
import Loader from '../../components/loader';
import Header from '../../components/header';
import { setDocumentMetaTags } from '../../utils/misc';

export default class Playlists extends Component {
  constructor(props) {
    super(props);
    this.state = {
      docTitle: 'Playlists',
      docDescription: 'Plan your own radio listening day at 1tuner.com'
    };
  }

  componentDidMount() {
    setDocumentMetaTags(this.state.docTitle, this.state.docDescription);
  }

  changePlaylist = (APlaylist) => {
    this.props.changePlaylist(APlaylist, true);
  }

	render({playlists, stationList, currentUser}, {docTitle, docDescription}) {
    //debugger;
		if (!playlists || !stationList) {
			return(
				<div class={'page-container'}>
					<Header title={docTitle} sharetext={docDescription} />
					<main class={'content content--is-loading ' + (style.playlists)}>
						<h1 class={'main-title'}>{docTitle}
						<small class={'main-subtitle'}>⚡ Take control.</small></h1>
						<Loader />
					</main>
				</div>
			);
		} else {
			return (
				<div class={'page-container'}>
					<Header title={docTitle} sharetext={docDescription} />
					<main class={'content ' + (style.playlists)}>
						<h1 class={'main-title'}>{docTitle}</h1>
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
