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
			<header class={style.header}>
				<button class={style['header-btn'] + ' ' + style['header-btn--back']} onClick={this.goBack.bind(this)}>Back</button>
				<h1 class={style['header-title']}></h1>
				{ showShare ?
				<button class={style['header-btn'] + ' ' + style['header-btn--share']} onClick={this.shareUrl.bind(this)}>Share</button>
				:
				<div class={style['header-btn']}></div>
				}
			</header>
		);
	}
}