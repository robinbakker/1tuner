import { h, Component } from 'preact';
import Loader from '../loader';
import style from './style';
import { Link } from 'preact-router/match';

export default class PlaylistList extends Component {
  constructor(props) {
    super(props);
    this.state = {
			items: [],
			radioStations:[]
		};
  }
  
	setPlaylist = (e) => {
		if(typeof e.currentTarget.attributes['data-playlist'] !== 'undefined' && this.state.items) {
			let playlistItem;
			for (let i=0; i<this.state.items.length;i++) {
				if (this.state.items[i].href == e.currentTarget.attributes['data-playlist'].value) {
					playlistItem = this.state.items[i];
					break;
				}
			}
			this.props.changePlaylist(playlistItem);
		}
		e.preventDefault();
	}

	getStation = (AStation) => {
    if(!this.state.radioStations || !this.state.radioStations.length) {
      return null;
    }
    let Result = null;
    for (let i=0; i < this.state.radioStations.length; i++) {
      if (this.state.radioStations[i].id == AStation) {
        Result = this.state.radioStations[i];
        break;
      }
    }
		return Result;
	}
	
	renderStationLogos = (APlaylistSchedule) => {
		let result = [];
		let stationArray = [];
		let self = this;
		APlaylistSchedule.forEach(function(AItem) {
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

	getStationNames = (APlaylistSchedule) => {
		let result = [];
		let stationArray = [];
		let self = this;
		APlaylistSchedule.forEach(function(AItem) {
			if(stationArray.indexOf(AItem.station)==-1) {
				stationArray.push(AItem.station);
				let st = self.getStation(AItem.station);
				if (st) {					
					result.push(st.name);
				}
			}
		});
		return result.join(', ');
	}

	loadData = async () => {
		let playlists = this.props.playlists;
		let stationList = this.props.horizontal ? null : this.props.stationList;
		
		if (playlists || stationList) {
			this.setState({
				items: playlists,
				radioStations: stationList
			});
			return true;
		}
		return false;
	}

	shouldComponentUpdate() {
		if ((!this.state.items || !this.state.items.length) && this.props.playlists && this.props.playlists.length) {
			return this.loadData();
		} else {
			return false;
		}
	}

	render() {		
    if (!this.state.items || !this.state.items.length) {
			if (this.props.playlists && this.props.playlists.length) {
				this.loadData();
			}
      return(
        <Loader />
      );
    } else {
			return (
				<ul class={'preset-list' + (this.props.horizontal ? ' preset-list--horizontal' : ' preset-list--page')}>
          {this.state.items.map(playlistItem => (
   					<li class={'preset-list__item'}>
							{this.props.horizontal ? 
								<button data-playlist={playlistItem.href} onClick={this.setPlaylist.bind(this)} title={playlistItem.name} class={'preset-list__button'  + (this.props.small ? ' preset-list__button--small' : '') + ' icon--playlist'} style={'background-color:'+playlistItem.color}>
									<span class="button__text button__text--inverted">{playlistItem.name}</span>
								</button>
							:
							<div class={'preset-list__item-content preset-list__item-content--playlist'}>
								<Link href={playlistItem.href} title={playlistItem.name} class={'preset-list__button'  + (this.props.small ? ' preset-list__button--small' : '') + ' icon--playlist'} style={'background-color:'+playlistItem.color}>
								  <span class={'button__text button__text--inverted'}>{playlistItem.name}</span>							
								</Link>
								{this.props.small ? 
									null 
									:
									<div class={'preset-list__link-content'}>
										<Link href={playlistItem.href} class={'preset-list__link'}>{playlistItem.name}</Link>
										<span class={'preset-list__link-description'}>{this.getStationNames(playlistItem.schedule)}</span>
									</div>
								}
								{this.props.small ?
									null
									:
									<button data-playlist={playlistItem.href} onClick={this.setPlaylist.bind(this)} title={playlistItem.name} title={'Play'} class={'btn btn--secondary btn--play'}></button>
								}
							</div>
							}
            </li>
          ))}
        </ul>
      );
    }
	}
}