import { h, Component } from 'preact';
import style from './style';
import { route } from 'preact-router';
import { Link } from 'preact-router/match';
import Loader from '../../components/loader';
import Header from '../../components/header';
import { getColorString, getUrlQueryParameterByName, setDocumentMetaTags } from '../../utils/misc';
import { getScheduleQueryParamsAsString } from '../../utils/playlist';

export default class Playlists extends Component {
	state = {
		applePieTime: new Date(1980, 0, 4),
		href:'',
		name:'',
		items: [],
		radioStations: [],
		playlists: [],
		canEdit: true,
    docTitle: 'Playlist',
    docDescription: 'Listen to these radio stations'
	};

	getPlaylist = (APlaylistName, APlaylistHref) => {
		let Result = null;
		APlaylistHref = APlaylistHref.substr(APlaylistHref.indexOf('/playlist/'));
		if (APlaylistHref.indexOf('?') >= 0) {
      let sUrlArr = APlaylistHref.split('?');
			let qp = sUrlArr[1];
			if (this.state.playlists) {
				for (var i=0; i<this.state.playlists.length; i++) {
					if (this.state.playlists[i].href.indexOf('?') >= 0) {
						let sUrlArr2 = this.state.playlists[i].href.split('?');
						let qp2 = sUrlArr2[1];
						if(qp==qp2) {
							Result = this.state.playlists[i];
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
				let newHref = '/playlist/' + encodeURI(APlaylistName) + '/?' + getScheduleQueryParamsAsString(schedule);
				Result = {
					href: newHref,
					name: APlaylistName,
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

	deletePlaylist = () => {
		this.props.deletePlaylist(this.state.href);
		route('/playlists', true);
	}

	playPlaylist = () => {
		this.props.changePlaylist({
			href: this.state.href,
			color: this.state.color,
			name: this.state.name,
			schedule: this.state.items
		}, true);
	}

	loadData = () => {
		if (this.props.stationList && this.props.stationList.length && this.props.playlists && this.props.playlists.length) {
			this.setState({
				radioStations: this.props.stationList,
				playlists: this.props.playlists
			}, () => {
				this.setPlaylist();
			});
		}
	}

	setPlaylist = () => {
		if (this.props.name && typeof window !== 'undefined' && window.location) {
			let currentPlaylist = this.getPlaylist(this.props.name, window.location.href);
			if (currentPlaylist) {
				this.props.addPlaylist(currentPlaylist);
        setDocumentMetaTags(currentPlaylist.name + ' | ' + this.state.docTitle, this.state.docDescription);
				let scheduleItems = currentPlaylist.schedule ? Object.values(currentPlaylist.schedule) : [];
				this.setState({
					href: currentPlaylist.href,
					color: currentPlaylist.color,
					name: currentPlaylist.name,
					items: scheduleItems,
				});
			}
		} else {
			route('/playlists', true);
		}
	}

	render({},{name, canEdit, href, items, radioStations, playlists, docDescription}) {
		if (!radioStations || !radioStations.length || !playlists || !playlists.length) {
			this.loadData();
			return(
				<div class={'page-container'}>
				<Header title="Playlist" />
				<main class={'content content--is-loading ' + (style.playlist)}>
					<Loader />
				</main>
				</div>
			);
		} else {
			return (
				<div class={'page-container'}>
				<Header title={name} sharetext={docDescription} />
				<main class={'content ' + (style.playlist)}>
					<h1 class={'main-title'}>{name}</h1>
					<p>&nbsp;</p>
					<div class={'btn-container btn-container--right'}>
						<button onClick={this.playPlaylist} class={'btn btn--play'}>Listen now</button>
					</div>
					{canEdit ?
						<div class={'btn-container btn-container--left'}>
							<Link href={href.replace('/playlist/','/playlist-edit/')} native class={'margin--right btn btn--edit ' + style['btn--playlist']}>Edit</Link>
							<button onClick={this.deletePlaylist} class={'btn btn--cancel'}>Delete</button>
						</div>
						:
						null
					}
					<ul class={style['playlists']}>
						{items.map(scheduleItem => (
							<li class={style['playlists__item'] +' '+style['hours']+' '+ style['hours--' + this.getHours(scheduleItem.startHour, scheduleItem.endHour)] + ' ' + style[this.isActive(scheduleItem.startHour, scheduleItem.endHour)]}>
								<time>{this.getTimeCaption(scheduleItem.startHour)}<button onClick={this.playPlaylist} class={'btn ' + style['btn--on-air']}>On air</button></time>
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
