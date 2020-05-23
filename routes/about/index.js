import { h, Component } from 'preact';
import style from './style';
import Header from '../../components/header';
import { Link } from 'preact-router/match';

export default class About extends Component {
  constructor(props) {
    super(props);
		this.state = {
			docTitle: 'About 1tuner',
			docDescription: 'One web app to listen to audio streams 🎵'
		};
  }

	render({},{docTitle, docDescription}) {
		return (
			<div class={'page-container'}>
				<Header title="About" />
				<main class={'content ' + (style.about)}>
					<h1 class={'main-title'}>{docTitle}
          <small class={'main-subtitle'}>{docDescription}</small></h1>
					<p>Here you can listen to online <Link href="/radio-stations" native>radio stations</Link> and <Link href="/podcasts" native>podcasts</Link>. And create your own ideal <Link href="/playlists" native>radio listening day</Link>, so the player switches between radio streams automatically.</p>
					<p>This is a free web app - just add this site to your homescreen and you're good to go!</p>
					<h2 class={style['content-title']}>Cookies, tracking, privacy...</h2>
					<p>I guess I'm not that much interested in you! However, to keep things functional:</p>
					<ul>
						<li>I'm using Google Analytics to track the amount of visitors (anonimized IPs and no user tracking).</li>
						<li>Some basic information is stored in your browser for your preferences and to store your playlists.</li>
						<li>The audio and logos are loaded from the radio stations / podcast sources directly or via <a href="https://cloudinary.com" target="_blank" rel="noopener">cloudinary.com</a>. Radio stations or podcast providers may use some sort of tracking on the media requests.</li>
						<li>The Apple iTunes Search API is used for the <Link href="/podcasts" native>podcast</Link> search functionality.</li>
						<li>If needed, the podcast RSS feed will be requested via a pass-through website, currently at <a href="https://dented-radiosaurus.glitch.me" target="_blank" rel="noopener">Glitch</a>.</li>
					</ul>
					<h2 class={style['content-title']}>Who?</h2>
					<p>This is a little side project from <a href="https://twitter.com/robinbakker" target="_blank" rel="noopener">Robin Bakker</a>. Read more: <a href="https://medium.com/@robinbakker/creating-a-web-app-as-side-project-2b8f96a44893" rel="noopener" target="_blank">Creating a web app as side project</a>. You can find 1tuner at <a href="https://github.com/robinbakker/1tuner" rel="noopener" target="_blank">GitHub</a> as well.<br />Do you miss a feature? Spotted a bug? Oh no! Please let me know: <a href="https://twitter.com/1tuner" rel="noopener me" target="_blank">@1tuner</a>.</p>
					<p>Or <a href="https://paypal.me/RobinBakker" target="_blank" rel="noopener">buy me a ☕ + 🍪</a>!</p>

					<p class={style.smallish}>v {this.props.version}</p>
				</main>
			</div>
		);
	}
}
