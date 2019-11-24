import { h, Component } from 'preact';
import style from './style';
import { route } from 'preact-router';
import { Link } from 'preact-router/match';
import Loader from '../../components/loader';
import Header from '../../components/header';
import { getColorString, getUrlQueryParameterByName } from '../../utils/misc';
import { getScheduleQueryParamsAsString } from '../../utils/planning';

export default class Planning extends Component {
	state = {
		applePieTime: new Date(1980, 0, 4),
		href:'',
		name:'',
		items: [],
		radioStations: [],
		planningList: [],
		canEdit: true,
		baseDocTitle: 'Radio Planning - 1tuner'
	};

	getPlanning = (APlanningName, APlanningHref) => {
		let Result = null;
		APlanningHref = APlanningHref.substr(APlanningHref.indexOf('/planning/'));
		if (APlanningHref.indexOf('?') >= 0) {
      let sUrlArr = APlanningHref.split('?');
			let qp = sUrlArr[1];
			if (this.state.planningList) {
				for (var i=0; i<this.state.planningList.length; i++) {
					if (this.state.planningList[i].href.indexOf('?') >= 0) {
						let sUrlArr2 = this.state.planningList[i].href.split('?');
						let qp2 = sUrlArr2[1];
						if(qp==qp2) {
							Result = this.state.planningList[i];
							break;
						}
					}
				}
			}
			if (!Result) {
				let schedule = [];
				let prevP;
				let prevH;
				for (var h=0; h<=24; h++) {
					let P = getUrlQueryParameterByName('h'+h, qp);
					if(P) {
						if(prevP) {
							schedule.push({
								"startHour": prevH,
								"endHour": h,
								"station": prevP
							});
						}
						prevH = h;
						prevP = P;
					}
				}
				if (prevP) {
					schedule.push({
						"startHour": prevH,
						"endHour": 24,
						"station": prevP
					});
				}
				let newHref = '/planning/' + encodeURI(APlanningName) + '/?' + getScheduleQueryParamsAsString(schedule);
				Result = {
					href: newHref,
					name: APlanningName,
					color: getColorString(newHref),
					schedule: schedule
				}
			}
		}
		return Result;
	}

	getHours = (AStartHour, AEndHour) => {
		return (AEndHour-AStartHour);
	}

	isActive = (AStartHour, AEndHour) => {
		let currentHour = new Date().getHours();
		return (currentHour>=AStartHour && currentHour<AEndHour) ? 'is-active' : '';
	}

	getTime = (ANumber) => {
		if (ANumber < 10) {
			return '0' + ANumber + ':00';
		} else {
			return ANumber + ':00';
		}
	}

	getTimeCaption(AStartHour) {
		let Result = this.getTime(AStartHour);
		return Result;
	}

	getStation = (AStation) => {
		let result = null;
		this.state.radioStations.forEach(function(AItem) {
			if (AItem.id == AStation) {
				if (AItem.logosource) {
					result = <Link href={'/radio-station/'+AStation} native><img class={style['station-logo']} alt={AItem.name} title={AItem.name} src={AItem.logosource} /></Link>;
				} else {
					result = <Link href={'/radio-station/'+AStation} native>{AItem.name}</Link>;
				}
				return;
			}
		});
		return result;
	}

	deletePlanning = () => {
		this.props.deletePlanning(this.state.href);
		route('/planner', true);
	}

	playPlanning = () => {
		this.props.changePlanning({
			href: this.state.href,
			color: this.state.color,
			name: this.state.name,
			schedule: this.state.items
		}, true);
	}

	loadData = () => {
		if (this.props.stationList && this.props.stationList.length && this.props.planningList && this.props.planningList.length) {
			this.setState({
				radioStations: this.props.stationList,
				planningList: this.props.planningList
			}, () => {
				this.setPlanning();
			});
		}		
	}

	setPlanning = () => {
		if (this.props.name && typeof window !== 'undefined' && window.location) {
			let currentPlanning = this.getPlanning(this.props.name, window.location.href);
			if (currentPlanning) {
				this.props.addPlanning(currentPlanning);
				document.title = currentPlanning.name + ' - ' + this.state.baseDocTitle;
				let scheduleItems = currentPlanning.schedule ? Object.values(currentPlanning.schedule) : [];
				this.setState({
					href: currentPlanning.href,
					color: currentPlanning.color,
					name: currentPlanning.name,
					items: scheduleItems,
				});
			}
		} else {
			route('/planner', true);
		}
	}

	render({},{name, canEdit, href, items, radioStations, planningList}) {
		if (!radioStations || !radioStations.length || !planningList || !planningList.length) {
			this.loadData();
			return(
				<div class={'page-container'}>
				<Header title="Planning" />
				<main class={'content content--is-loading ' + (style.planning)}>
					<Loader />
				</main>
				</div>
			);
		} else {
			return (
				<div class={'page-container'}>
				<Header title={name} sharetext={'Listen to these radio stations'} />
				<main class={'content ' + (style.planning)}>
					<h1 class={'main-title'}>{name}
					</h1>
					<p>&nbsp;</p>
					<div class={'btn-container btn-container--right'}>
						<button onClick={this.playPlanning} class={'btn btn--play'}>Listen now</button>
					</div>
					{canEdit ?
						<div class={'btn-container btn-container--left'}>
							<Link href={href.replace('/planning/','/planning-edit/')} native class={'margin--right btn btn--edit ' + style['btn--planning']}>Edit</Link>
							<button onClick={this.deletePlanning} class={'btn btn--delete'}>Delete</button>
						</div>
						: 
						null 
					}
					<ul class={style['planning-list']}>
						{items.map(scheduleItem => (
							<li class={style['planning-list__item'] +' '+style['hours']+' '+ style['hours--' + this.getHours(scheduleItem.startHour, scheduleItem.endHour)] + ' ' + style[this.isActive(scheduleItem.startHour, scheduleItem.endHour)]}>
								<time>{this.getTimeCaption(scheduleItem.startHour)}<button onClick={this.playPlanning} class={'btn ' + style['btn--on-air']}>On air</button></time>
								{this.getStation(scheduleItem.station)}
							</li>
						))}
					</ul>
				</main>
				</div>
			);
		}
	}
}