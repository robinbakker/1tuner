import { h, Component } from 'preact';
import Loader from '../loader';
import style from './style';
import { Link } from 'preact-router/match';

export default class PlanningList extends Component {
  constructor(props) {
    super(props);
    this.state = {
			items: [],
			radioStations:[]
		};
  }
  
	setPlanning = (e) => {
		if(typeof e.currentTarget.attributes['data-planning'] !== 'undefined' && this.state.items) {
			let planningItem;
			for (let i=0; i<this.state.items.length;i++) {
				if(this.state.items[i].href==e.currentTarget.attributes['data-planning'].value) {
					planningItem = this.state.items[i];
					break;
				}
			}
			this.props.changePlanning(planningItem);
		}
		e.preventDefault();
	}

	getStation = (AStation) => {
    if(!this.state.radioStations || !this.state.radioStations.length) {
      return null;
    }
    let Result = null;
    for(let i=0;i<this.state.radioStations.length;i++) {
      if(this.state.radioStations[i].id==AStation) {
        Result = this.state.radioStations[i];
        break;
      }
    }
		return Result;
	}
	
	renderStations = (APlanningSchedule) => {
		let result = [];
		let stationArray = [];
		let self = this;
		APlanningSchedule.forEach(function(AItem) {
			if(stationArray.indexOf(AItem.station)==-1) {
				stationArray.push(AItem.station);
				let st = self.getStation(AItem.station);
				if(st) {
					if(st.logosource) {
					result.push(<li class={style['station-list__item']}><img class={style['station-logo']} alt={st.name} title={st.name} src={st.logosource} /></li>);
					} else {
					result.push(<li class={style['station-list__item']}><span>{st.name}</span></li>);
					}
				}
			}
		});
		return result;
	}

	loadData = async () => {
		let planningList = this.props.planningList;
		let stationList = this.props.horizontal ? null : this.props.stationList;
		
		if (planningList || stationList) {
			this.setState({
				items: planningList,
				radioStations: stationList
			});
			return true;
		}
		return false;
	}

	shouldComponentUpdate() {
		if ((!this.state.items || !this.state.items.length) && this.props.planningList && this.props.planningList.length) {
			return this.loadData();
		} else {
			return false;
		}
	}

	render() {		
    if (!this.state.items || !this.state.items.length) {
			if (this.props.planningList && this.props.planningList.length) {
				this.loadData();
			}
      return(
        <Loader />
      );
    } else {
			return (
				<ul class={'preset-list' + (this.props.horizontal ? ' preset-list--horizontal' : '')}>
          {this.state.items.map(planningItem => (
   					<li class={'preset-list__item'}>
							{this.props.horizontal ? 
								<button data-planning={planningItem.href} onClick={this.setPlanning.bind(this)} title={planningItem.name} class={'preset-list__button'  + (this.props.small ? ' preset-list__button--small' : '') + ' icon--planner'} style={'background-color:'+planningItem.color}>
									<span class="button__text button__text--inverted">{planningItem.name}</span>
								</button>
							:
							<div class={'preset-list__item-content  preset-list__item-content--planning'}>
								<button data-planning={planningItem.href} onClick={this.setPlanning.bind(this)} title={planningItem.name} class={'preset-list__button'  + (this.props.small ? ' preset-list__button--small' : '') + ' icon--planner'} style={'background-color:'+planningItem.color}>
									<span class="button__text button__text--inverted">{planningItem.name}</span>
								</button>
								<ul class={style['station-list']}>
								{this.renderStations(planningItem.schedule)}
								</ul>
								<Link href={planningItem.href} native class={'btn btn--info icon--info'} style={'background-color:'+planningItem.color}>Info</Link>
							</div>
							}
            </li>
          ))}
        </ul>
      );
    }
	}
}