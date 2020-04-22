import { h, Component } from 'preact';
import style from './style';

export default class Header extends Component {
	goBack = () => {
		if (typeof window !== 'undefined' && window.history) {
			window.history.back();
		}
	}
	shareUrl = () => {
		if (typeof navigator !== 'undefined' && navigator.share && typeof window !== 'undefined' && window.location) {
			navigator.share({
					title: this.props.title,
					text: this.props.sharetext,
					url: window.location.href,
			})
			.then(() => console.log('Successful share'))
			.catch((error) => console.log('Error sharing', error));
		}
	}

	render() {
		let showShare = false;
		if (typeof navigator !== 'undefined' && navigator.share) {
			showShare = typeof this.props.showShare == 'undefined' ? true : this.props.showShare;
		}
		return (
			<header class={style.header + ' app-header' + (this.props.inverted ? ' app-header--inverted' : '')}>
				<button class={style['header-btn'] + ' ' + style['header-btn--back']} title="Back" onClick={this.goBack.bind(this)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg></button>
				<h1 class={style['header-title']}>{this.props.title}</h1>
				{ showShare ?
				<button class={style['header-btn'] + ' ' + style['header-btn--share']} title="Share" onClick={this.shareUrl.bind(this)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg></button>
				:
				<div class={style['header-btn']}></div>
				}
			</header>
		);
	}
}
