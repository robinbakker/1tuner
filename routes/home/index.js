import { h, Component } from 'preact';
import style from './style';
import StationList from '../../components/stationlist';
import StationItem from '../../components/stationitem';
import PodcastList from '../../components/podcastlist';
import PlaylistList from '../../components/playlistlist';
import Loader from '../../components/loader';
import { Link } from 'preact-router/match';

export default class Home extends Component {
	componentDidMount() {
		document.title = '1tuner | listen to radio online';
	}
	changeStation = (AStation) => {
		this.props.changeStation(AStation, true);
	}
	changePlaylist = (APlaylist) => {
		this.props.changePlaylist(APlaylist, true);
	}

	render({ stationList, podcastList, playlists, featured }, {}) {
		return (
			<main class={'content ' + (style.home)}>
				<div class={style['home-header']}>
					<img class={style['home-header-logo']} src="/assets/logo-text-white.svg" alt="1tuner" />
				</div>
				<article class={'content__section content__section--stations'}>
					<header class={'section-header'}>
						<h3 class={'section-title'}>Radio stations</h3>
						<Link href="/radio-stations" native class="btn btn--secondary">More</Link>
					</header>
					<div class={'section-main'}>
						<StationList stationList={stationList} changeStation={this.changeStation.bind(this)} limitCount={5} horizontal={true} small={true} />
					</div>
				</article>
				{podcastList ?
				<article class={'content__section content__section--podcasts'}>
					<header class={'section-header'}>
						<h3 class={'section-title'}>Podcasts</h3>
						<Link href="/podcasts" native class="btn btn--secondary">More</Link>
					</header>
					<div class={'section-main'}>
						<PodcastList podcastList={podcastList} limitCount={5} horizontal={true} small={true} />
					</div>
				</article>
				: null
				}
				{playlists ?
				<article class={'content__section content__section--playlists'}>
					<header class={'section-header'}>
						<h3 class={'section-title'}>Playlists</h3>
						<Link href="/playlists" native class="btn btn--secondary">More</Link>
					</header>
					<div class={'section-main'}>
						<PlaylistList playlists={playlists} changePlaylist={this.changePlaylist.bind(this)} horizontal={true} small={true} />
					</div>
				</article>
				: null
				}
				{featured && featured.stationItem ?
					<article class={'content__section content__section--featured'}>
						<header class={'section-header'}>
							<h3 class={'section-title'}>Featured</h3>
							<Link href={'/radio-station/' + featured.stationItem.id} native class="btn btn--secondary btn--float-right">More</Link>
						</header>
						<div class={'section-featured'}>
							<StationItem stationItem={featured.stationItem} small={true} changeStation={this.changeStation.bind(this)} />
							{featured.description ?
							<div class={style['featured-info']}>
								<h4 class={style['featured-title']}>{featured.stationItem.name}</h4>
								<p class={style['featured-description']}>{featured.description}</p>
							</div>
							: null}
						</div>
					</article>
					:
					<article class={'content__section content__section--featured'}>
						<h3 class={'section-title'}>Featured</h3>
						<div class={'section-featured'}>
							<Loader />
						</div>
					</article>
				 }
				 <article>
						<header class={'section-header'}>
							<h3 class={'section-title'}>About 1tuner.com</h3>
							<Link href="/about" class={'btn btn--secondary'} native>More</Link>
						</header>
						<div class={'section-about'}>
							<p>This is a free web app. Here you can listen to online <Link href="/radio-stations" native>radio stations</Link>, <Link href="/podcasts" native>podcasts</Link> and create <Link href="/playlists" native>playlists</Link>.<br/>
							Just add this site to your homescreen and you're good to go!</p>
							<p>This app stores information in your browser to save your preferences and Google Analytics is used for basic analytics. <Link href="/about" native>Read more</Link></p>
						</div>
				 </article>
			</main>
		);
	}
}
