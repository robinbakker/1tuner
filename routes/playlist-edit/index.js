import { h, Component } from 'preact';
import style from './style';
import { route } from 'preact-router';
import { Link } from 'preact-router/match';
import EditScheduleItem from '../../components/editscheduleitem';
import Header from '../../components/header';
import { getColorString, getUrlQueryParameterByName, setDocumentMetaTags } from '../../utils/misc';
import { getScheduleQueryParamsAsString } from '../../utils/playlist';

export default class PlaylistEdit extends Component {
  constructor(props) {
    super(props);
		this.state = {
			docTitle: 'Playlist',
      docDescriptionAdd: 'Add a playlist',
      docDescriptionEdit: 'Edit this playlist',
      href:'',
      name:'',
      errorMessage: '',
      items: [],
      radioStations: [],
      newStartHour:6,
      newEndHour: 9
		};
	}

	// gets called when this route is navigated to
	componentDidMount() {
    if(this.props.name) {
      setDocumentMetaTags(this.props.name + ' - ' + this.state.docTitle, this.state.docDescriptionEdit);
    } else {
      setDocumentMetaTags(this.state.docTitle, this.state.docDescriptionAdd);
    }
		this.loadData();
	}

	loadData = () => {
		if (!this.props.stationList || !this.props.stationList.length) {
			return;
		}
		let self = this;
		let stationList = [];
		this.props.stationList.forEach(el => {
			stationList.push({
				value: el.id,
				text: el.name + (el.language ? ' (' + self.getCountryCode(el.language) + ')' : '')
			});
		});
		stationList.sort(function(a, b) {
			var nameA = a.text.toUpperCase(); // ignore upper and lowercase
			var nameB = b.text.toUpperCase(); // ignore upper and lowercase
			if (nameA < nameB) {
				return -1;
			}
			if (nameA > nameB) {
				return 1;
			}
			// names must be equal
			return 0;
		});
		this.setState({
			radioStations: stationList
		}, this.setPlaylist);

	}

	setPlaylist() {
		if (this.props.name && typeof window !== 'undefined' && window.location) {
			let s = this.getPlaylist(this.props.name, window.location.href);
			this.setState({
				href: s.href,
				name: s.name,
				items: s.schedule
			});
		}
	}

	getCountryCode = (ALang) => {
		if (!ALang || !this.props.languageList || !this.props.languageList.length) {
      return null;
		}
		let Result = null;
		let languageList = this.props.languageList;
		for (let i=0; i<languageList.length; i++) {
      if (languageList[i].id == ALang) {
        Result = languageList[i].abbr ? languageList[i].abbr : null;
        break;
      }
		}
		return Result;
	}

	getPlaylist = (APlaylistName, APlaylistHref) => {
		let Result = null;
		APlaylistHref = APlaylistHref.substr(APlaylistHref.indexOf('/playlist-edit/'));
		APlaylistHref = APlaylistHref.replace('/playlist-edit/','/playlist/');
    if (APlaylistHref.indexOf('?') >= 0) {
      let sUrlArr = APlaylistHref.split('?');
			let qp = sUrlArr[1];
			if (this.state.playlist) {
				for (var i=0; i<=this.state.playlist.length; i++) {
					if (this.state.playlist[i].href.indexOf('?') >= 0) {
						let sUrlArr2 = this.state.playlist[i].href.split('?');
						let qp2 = sUrlArr2[1];
						if (qp==qp2) {
							Result = this.state.playlist[i];
							break;
						}
					}
				}
			}
			if (!Result) {
				let schedule = [];
				let prevP;
				let prevH;
				for(let h=0; h<=24; h++) {
					let P = getUrlQueryParameterByName('h'+h, qp);
					if (P) {
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
				Result = {
					href: APlaylistHref,
					name: APlaylistName,
					schedule: schedule
				}
			}
    }
		return Result;
	}

	setName = e => {
		this.setState({ name: e.target.value });
	}

	handleSubmit = e => {
		e.preventDefault();
		if (!this.state.name) {
			this.setState({errorMessage:'Please fill in a name for the playlist.'});
			return;
		}
		if (document && !document.getElementById('inpName').validity.valid) {
			this.setState({errorMessage:'Please fill in a name for the playlist.'});
			return;
		}
		if (!this.state.items || !this.state.items.length) {
			this.setState({errorMessage:'Hmm, your playlist seems to be empty. Please try adding some rows?'});
			return;
		}
		let playlistHref = '/playlist/' + encodeURI(this.state.name) + '/?' + getScheduleQueryParamsAsString(this.state.items);
		var postData = {
			href: playlistHref,
			name: this.state.name,
			color: getColorString(playlistHref),
			schedule: this.state.items
		};
		this.props.addPlaylist(postData);

		route('/playlists', true);
	}

	addScheduleItem = (e, startHour, endHour, station) => {
		if (!station) {
			return;
		}
		let scheduleItems = this.state.items;
		scheduleItems.push({
			station: station,
			startHour: startHour,
			endHour: endHour
		});
		station='';
		scheduleItems.sort(function(a, b) {
			var startA = a.startHour;
			var startB = b.startHour;
			if (startA < startB) {
				return -1;
			}
			if (startA > startB) {
				return 1;
			}
			return 0;
		});
		const programHourOffset = 3;
		let newStart = scheduleItems[scheduleItems.length-1].endHour;
		let newEnd = newStart+programHourOffset;
		if (newEnd > 24) newEnd = 24;
		this.setState({
			items: scheduleItems,
			newStartHour: newStart,
			newEndHour: newEnd,
			errorMessage:''
		});
	}

	addItemChanged = (startHour, endHour, station, oldStart, oldEnd) => {
		this.setState({
			newStartHour: startHour,
			newEndHour: endHour
		});
	}

	scheduleItemChanged = (startHour, endHour, station, oldStart, oldEnd) => {
		let scheduleItems = this.state.items;
		scheduleItems.forEach(el => {
			if(el.startHour==oldStart && el.endHour==oldEnd) {
				el.startHour = startHour;
				el.endHour = endHour;
				el.station = station;
			}
		});
		const programHourOffset = 3;
		let newStart = scheduleItems[scheduleItems.length-1].endHour;
		let newEnd = newStart + programHourOffset;
		if (newEnd > 24) newEnd = 24;
		this.setState({
			items: scheduleItems,
			newStartHour: newStart,
			newEndHour: newEnd
		});
	}

	removeScheduleItem = (e, startHour, endHour, station) => {
		let scheduleItems = this.state.items;
		scheduleItems = scheduleItems.filter(function(el) {
			return el.startHour!==startHour && el.endHour!==endHour;
		});
		this.setState({
			items: scheduleItems
		});
	}

	render({name}, {docTitle, docDescriptionAdd, items, errorMessage, radioStations, newStartHour, newEndHour, href}) {
		if(!radioStations || !radioStations.length) {
			this.loadData();
			return(
				<div class={'page-container'}>
					<Header title={docTitle} />
					<main class={'content ' + (style.playlist)}>
						<h1 class={'main-title'}>{docTitle}
						{name ?
							<small class={'main-subtitle'}>Change some bits and pieces 🔧</small>
							:
              <small class={'main-subtitle'}>{docDescriptionAdd}</small>
						}
						</h1>
						{errorMessage && errorMessage!='' ?
							<p class={style['error-message']}>{errorMessage}</p>
							:
							null
						}
					</main>
				</div>
			);
		} else {
			return (
				<div class={'page-container'}>
					<Header title={docTitle} />
					<main class={'content ' + (style.playlist)}>
						<h1 class={'main-title'}>{docTitle}
						{name ?
							<small class={'main-subtitle'}>Change some bits and pieces 🔧</small>
							:
              <small class={'main-subtitle'}>{docDescriptionAdd}</small>
						}
						</h1>
						{errorMessage && errorMessage!='' ?
							<p class={style['error-message']}>{errorMessage}</p>
							:
							null
						}
						<form class={style.editplaylistform} onSubmit={this.handleSubmit.bind(this)}>
							<ul class={style['item-list']}>
								<li class={style['item-list__item']}>
									<label class="label-container">
										<span class="label-text">Name</span>
										<input type="text" id="inpName" placeholder="Playlist name" maxlength="100" pattern="[\w.,!:\)\(\s]+" class="textfield" value={this.state.name} onInput={this.setName} required />
									</label>
								</li>
								{items.map(scheduleItem => (
									<li class={style['item-list__item']}>
										<EditScheduleItem station={scheduleItem.station} startHour={scheduleItem.startHour} endHour={scheduleItem.endHour} stationOptionList={radioStations} buttonClass="btn--remove" buttonText="Remove" rowChange={this.scheduleItemChanged} buttonClick={this.removeScheduleItem}></EditScheduleItem>
									</li>
								))}
								<li class={style['item-list__item'] + ' ' + style['item-list__item--break']}>
									<EditScheduleItem id="addItem" buttonClass="btn--add" buttonText="Add" buttonClick={this.addScheduleItem} startHour={newStartHour} endHour={newEndHour} rowChange={this.addItemChanged} stationOptionList={radioStations}></EditScheduleItem>
								</li>
							</ul>
							<div class={'btn-container btn-container--content-right'}>
								<Link href={href ? href : '/playlists'} native class={'btn btn--cancel margin--right'}>Cancel</Link>
								<input type="submit" class={'btn btn--save'} value="Save" />
							</div>
						</form>
					</main>
				</div>
			);
		}
	}
}
