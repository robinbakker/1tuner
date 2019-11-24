import { h, Component } from 'preact';
import style from './style';
import StationList from '../../components/stationlist';
import StationItem from '../../components/stationitem';
import PodcastList from '../../components/podcastlist';
import PlanningList from '../../components/planninglist';
import Loader from '../../components/loader';
import { Link } from 'preact-router/match';

export default class Home extends Component {
	componentDidMount() {
		document.title = '1tuner | listen to radio online';
	}
	changeStation = (AStation) => {
		this.props.changeStation(AStation, true);
	}
	changePlanning = (APlanning) => {
		this.props.changePlanning(APlanning, true);
	}

	render({ stationList, podcastList, planningList, featured }, {}) {
		return (
			<main class={'content ' + (style.home)}>
				<div class={style['home-header']}>
					<img class={style['home-header-logo']} src="/assets/logo-text-white.svg" alt="1tuner" />
				</div>
				<section class={'content__section content__section--stations'}>
					<h3 class={'section-title'}>Radio Stations</h3>
					<div class={'section-main'}>
						<StationList stationList={stationList} changeStation={this.changeStation.bind(this)} limitCount={5} horizontal={true} small={true} />
					</div>
					<footer class={'section-footer'}>
						<Link href="/radio-stations" native class="btn btn--below btn--float-right">More radio stations</Link>
					</footer>
				</section>
				{podcastList ? 
				<section class={'content__section content__section--podcasts'}>
					<h3 class={'section-title'}>Podcasts</h3>
					<div class={'section-main'}>
						<PodcastList podcastList={podcastList} limitCount={5} horizontal={true} small={true} />
					</div>
					<footer class={'section-footer'}>
						<Link href="/podcasts" native class="btn btn--below btn--float-right">Find more podcasts</Link>
					</footer>
				</section>
				: null
				}
				{planningList ?
				<section class={'content__section content__section--planner'}>
					<h3 class={'section-title'}>Radio Planner</h3>
					<div class={'section-main'}>
						<PlanningList planningList={planningList} changePlanning={this.changePlanning.bind(this)} horizontal={true} small={true} />
					</div>
					<footer class={'section-footer'}>
						<Link href="/planner" native class="btn btn--below btn--float-right">More plannings</Link>
					</footer>
				</section>
				: null
				}
				{featured && featured.stationItem ? 
				<section class={'content__section content__section--featured'}>
					<h3 class={'section-title'}>Featured</h3>
					<div class={'section-featured'}>
						<StationItem stationItem={featured.stationItem} changeStation={this.changeStation.bind(this)} />
						{featured.description ? 
						<div class={style['featured-info']}>
						<h4 class={style['featured-title']}>{featured.stationItem.name}</h4>
						<p class={style['featured-description']}>{featured.description}</p>
						</div>
						:null}
					</div>
					<footer class={'section-footer'}>
						<Link href={'/radio-station/' + featured.stationItem.id} native class="btn btn--below btn--float-right">More info</Link>
					</footer>
				</section>
				:
				<section class={'content__section content__section--featured'}>
					<h3 class={'section-title'}>Featured</h3>
					<div class={'section-featured'}>
					<Loader />
					</div>
					</section>
				 }
			</main>
		);
	}
}