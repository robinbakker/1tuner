import { h, Component } from 'preact';
import style from './style';
import Header from '../../components/header';
import { Link } from 'preact-router/match';

export default class Error extends Component {
	componentDidMount() {
		document.title = 'Page not found - 1tuner | one web app to listen to audio streams';
	}

	render() {
		return (
			<div class={'page-container'}>
				<Header title="Page not found" showShare={false} />
				<main class={'content ' + (style.error)}>
					<h1 class={'main-title'}>Page not found... 
					<small class={'main-subtitle'}>Nothing to see here 🙄</small></h1>
					<p>Do you want to listen to a <Link href="/radio-stations" native>radio station</Link>? Or maybe plan your own <Link href="/playlists" native>radio listening day</Link>?</p>
				</main>
			</div>
		);
	}
}