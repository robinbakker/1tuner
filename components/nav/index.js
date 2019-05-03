import { h, Component } from 'preact';
import { Link } from 'preact-router/match';
import style from './style';

export default class Nav extends Component {
	render() {
		return (
			<nav class={style.nav}>
				<ul class={style['nav-list']}>
					<li class={style['nav-list__item']}><Link title="Home" activeClassName={style.active} href="/" class={style['nav-link'] + ' ' + style['nav-link--home'] + ' icon--home'}><span class={style['nav-list__caption']}>Home</span></Link></li>
					<li class={style['nav-list__item']}><Link title="Stations" activeClassName={style.active} href="/radio-stations" class={style['nav-link'] + ' ' + style['nav-link--station'] + ' icon--station'}><span class={style['nav-list__caption']}>Stations</span></Link></li>
					<li class={style['nav-list__item']}><Link title="Planner" activeClassName={style.active} href="/planner" class={style['nav-link'] + ' ' + style['nav-link--planner'] + ' icon--planner'}><span class={style['nav-list__caption']}>Planner</span></Link></li>
					<li class={style['nav-list__item']}><Link title="About" activeClassName={style.active} href="/about" class={style['nav-link'] + ' ' + style['nav-link--info'] + ' icon--info'}><span class={style['nav-list__caption']}>About</span></Link></li>
				</ul>
			</nav>
		);
	}
}
