import { h, Component } from 'preact';
import style from './style';
import Header from '../../components/header';
import { Link } from 'preact-router/match';

export default class About extends Component {
	componentDidMount() {
		document.title = 'About - 1tuner | one web app to listen to audio streams';
	}

	render() {
		return (
			<div class={'page-container'}>
				<Header title="About" />			
				<main class={'content ' + (style.about)}>
					<h1 class={'main-title'}>About 1tuner.com 
					<small class={'main-subtitle'}>One web app to listen to audio streams 🎵</small></h1>
					<p>Here you can listen to online <Link href="/radio-stations" native>radio stations</Link>. And plan your own ideal <Link href="/planner" native>radio listening day</Link> (planner), so the player switches between radio streams automatically.</p>
					<p>This is a free web app - just add this site to your homescreen and you're good to go!</p>
					
					<h2 class={style['content-title']}>Cookies, tracking, privacy...</h2>
					<p>Sorry, I'm not that much interested in you! However, to keep things functional:</p>
					<ul>
						<li>I'm using Google Analytics to track the amount of visitors (anonimized IPs and no user tracking). </li>
						<li>I'm storing some information in your browser for your preferences and store your plannings.</li>
						<li>I'm loading external graphics (radio station logos), and load the actual audio stream (from the websites of the radio stations).</li>
					</ul>
					
					<h2 class={style['content-title']}>Who?</h2>
					<p>This is a little side project from <a href="https://twitter.com/robinbakker" target="_blank" rel="noopener">Robin Bakker</a>. Read more: <a href="https://medium.com/@robinbakker/creating-a-web-app-as-side-project-2b8f96a44893" rel="noopener" target="_blank">Creating a web app as side project</a>. You can find 1tuner at <a href="https://github.com/robinbakker/1tuner" rel="noopener" target="_blank">GitHub</a> as well.<br />Do you miss a feature? Spotted a bug? Oh no! Please let me know: <a href="https://twitter.com/1tuner" rel="noopener me" target="_blank">@1tuner</a>.</p>
					<p>Or <a href="https://paypal.me/RobinBakker" target="_blank" rel="noopener">buy me a ☕ + 🍪</a>!</p>

					<p class={style.smallish}>v {this.props.version}</p>

					<div class={style.experimental}>
						<h2 class={style['content-title']}>🧪 Experimental</h2>
						<p>Psst! I'm working on podcast functionality. Want to try it out? OK then... 🤞 and go to <Link href="/podcasts">Podcasts</Link></p>
					</div>
				</main>
			</div>
		);
	}
}