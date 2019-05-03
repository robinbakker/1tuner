import { h, Component } from 'preact';
import style from './style';
import { Link } from 'preact-router/match';
import PlanningList from '../../components/planninglist';
import Loader from '../../components/loader';
import Header from '../../components/header';

export default class Planner extends Component {
	componentDidMount() {
		document.title = 'Radio Planner - 1tuner';
	}

	changePlanning = (APlanning) => {
		this.props.changePlanning(APlanning);
	}

	render() {
		if (!this.props.planningList || !this.props.stationList) {			
			return(
				<div class={'page-container'}>
				<Header title="Radio Planner" sharetext={'Plan your own radio listening at 1tuner.com'} />
				<main class={'content content--is-loading ' + (style.planner)}>
					<h1 class={'main-title'}>Radio Planner
					<small class={'main-subtitle'}>⚡ Take control.</small></h1>
					<Loader />
				</main>
				</div>
			);			
		} else {
			return (
				<div>
				<Header title="Radio Planner" sharetext={'Plan your own radio listening at 1tuner.com'} />
				<main class={'content ' + (style.planner)}>
					<h1 class={'main-title'}>Radio Planner</h1>
					<h3 class={'main-subtitle'}>⚡ Take control.</h3>
					<div class={'btn-container btn-container--right'}>
						<Link href="/planning-edit" native class={'btn btn--create'}>Plan new</Link>
					</div>
					<PlanningList planningList={this.props.planningList} stationList={this.props.stationList} changePlanning={this.changePlanning.bind(this)} currentUser={this.props.currentUser} /> 
				</main>
				</div>
			);
		}
	}
}