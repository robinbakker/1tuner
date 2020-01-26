import { h, Component } from 'preact';
import { Link } from 'preact-router/match';
import style from './style';

export default class Nav extends Component {
	render() {
		return (
			<nav class={style.nav}>
				<ul class={style['nav-list']}>
					<li class={style['nav-list__item']}>
						<Link title="Home" activeClassName={style.active} href="/" class={style['nav-link'] + ' ' + style['nav-link--home']}>
							<svg xmlns="http://www.w3.org/2000/svg" style="isolation:isolate" viewBox="0 0 42 42"><defs><clipPath id="cpHome"><path d="M0 0h42v42H0z"/></clipPath></defs><g clip-path="url(#a)"><path fill="none" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.707 18.546l.039 19.452c0 .562.456 1.018 1.018 1.018h8.92a1.017 1.017 0 001.018-1.018v-9.865c0-1.685 2.633-3.686 4.317-3.686 1.685 0 4.317 2.001 4.317 3.686v9.865a1.017 1.017 0 001.018 1.018h8.92c.563 0 1.019-.456 1.019-1.018V18.546L21.019 2.984 5.707 18.546z" vector-effect="non-scaling-stroke"/></g></svg>
							<span class={style['nav-list__caption']}>Home</span>
						</Link>
					</li>
					<li class={style['nav-list__item']}>
						<Link title="Stations" activeClassName={style.active} href="/radio-stations" class={style['nav-link'] + ' ' + style['nav-link--stations']}>
							<svg xmlns="http://www.w3.org/2000/svg" style="isolation:isolate" viewBox="0 0 42 42"><defs><clipPath id="cpRadio"><path d="M0 0h42v42H0z"/></clipPath></defs><g clip-path="url(#a)"><path fill="none" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.611 39.318h21.063c.456 0 .826-.37.826-.826V15.369a.825.825 0 00-.826-.825H17.611M31.547 2.682L3.326 14.544a.825.825 0 00-.826.825v23.123c0 .456.37.826.826.826h14.285" vector-effect="non-scaling-stroke"/><circle cx="27.593" cy="26.931" r="6.745" fill="none" stroke="#000" stroke-linecap="square" stroke-miterlimit="3" stroke-width="2" vector-effect="non-scaling-stroke"/></g></svg>
							<span class={style['nav-list__caption']}>Stations</span>
						</Link>
					</li>
					<li class={style['nav-list__item']}>
						<Link title="Podcasts" activeClassName={style.active} href="/podcasts" class={style['nav-link'] + ' ' + style['nav-link--podcasts']}>
							<svg xmlns="http://www.w3.org/2000/svg" style="isolation:isolate" viewBox="0 0 42 42"><defs><clipPath id="aPodcast"><path d="M0 0h42v42H0z"/></clipPath></defs><g stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" clip-path="url(#a)"><path fill="none" d="M14.246 10.272v10.28a6.254 6.254 0 1012.508 0v-10.28c0-3.454-2.8-6.254-6.254-6.254a6.238 6.238 0 00-5.624 3.527c-.168.349-.63 2.162-.63 2.727z" vector-effect="non-scaling-stroke"/><path fill="none" d="M31 17.209v3.081c0 5.957-4.701 10.786-10.5 10.786S10 26.247 10 20.29v-3.081" vector-effect="non-scaling-stroke"/><path stroke-miterlimit="3" d="M20.5 31.99v7.328M14.246 39.318h12.508" vector-effect="non-scaling-stroke"/></g></svg>
							<span class={style['nav-list__caption']}>Podcasts</span>
						</Link>
					</li>
					<li class={style['nav-list__item']}>
						<Link title="Playlists" activeClassName={style.active} href="/playlists" class={style['nav-link'] + ' ' + style['nav-link--playlists']}>
							<svg xmlns="http://www.w3.org/2000/svg" style="isolation:isolate" viewBox="0 0 42 42"><defs><clipPath id="cpPlaylist"><path d="M0 0h42v42H0z"/></clipPath></defs><g stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="3" stroke-width="2" clip-path="url(#a)"><path d="M8.572 33.021h28.356M8.572 23.021h28.356M17.928 13.021h19" vector-effect="non-scaling-stroke"/><path fill="none" d="M5.072 17.062V8.979l7 4.042z" vector-effect="non-scaling-stroke"/></g></svg>
							<span class={style['nav-list__caption']}>Playlists</span>
						</Link>
					</li>
					<li class={style['nav-list__item']}>
						<Link title="Settings" activeClassName={style.active} href="/settings" class={style['nav-link'] + ' ' + style['nav-link--settings']}>
							<svg xmlns="http://www.w3.org/2000/svg" style="isolation:isolate" viewBox="0 0 42 42"><defs><clipPath id="aSettings"><path d="M0 0h42v42H0z"/></clipPath></defs><g fill="none" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" clip-path="url(#a)"><circle cx="21" cy="21" r="7.449" vector-effect="non-scaling-stroke"/><path d="M32.436 25.636a2.55 2.55 0 00.51 2.813l.093.093a3.093 3.093 0 11-4.374 4.373l-.092-.092a2.55 2.55 0 00-2.813-.51 2.549 2.549 0 00-1.545 2.333v.263a3.091 3.091 0 01-6.182 0v-.139a2.553 2.553 0 00-1.669-2.334 2.55 2.55 0 00-2.813.51l-.093.093a3.093 3.093 0 11-4.373-4.374l.092-.092a2.55 2.55 0 00.51-2.813 2.549 2.549 0 00-2.333-1.545h-.263a3.091 3.091 0 010-6.182h.139a2.553 2.553 0 002.334-1.669 2.55 2.55 0 00-.51-2.813l-.093-.093a3.093 3.093 0 114.374-4.373l.092.092a2.55 2.55 0 002.813.51h.124a2.549 2.549 0 001.545-2.333v-.263a3.091 3.091 0 016.182 0v.139a2.551 2.551 0 001.545 2.334 2.55 2.55 0 002.813-.51l.093-.093a3.093 3.093 0 114.373 4.374l-.092.092a2.55 2.55 0 00-.51 2.813v.124a2.549 2.549 0 002.333 1.545h.263a3.091 3.091 0 010 6.182h-.139a2.551 2.551 0 00-2.334 1.545z" vector-effect="non-scaling-stroke"/></g></svg>
							<span class={style['nav-list__caption']}>Settings</span>
						</Link>
					</li>
					{/* <li class={style['nav-list__item']}>
						<Link title="About" activeClassName={style.active} href="/about" class={style['nav-link'] + ' ' + style['nav-link--info']}>
							<svg xmlns="http://www.w3.org/2000/svg" style="isolation:isolate" viewBox="0 0 42 42"><defs><clipPath id="cpInfo"><path d="M0 0h42v42H0z"/></clipPath></defs><g clip-path="url(#a)"><path fill-rule="evenodd" d="M18.95 11.184q0-.876.596-1.5.596-.623 1.469-.623.843 0 1.439.623.596.624.596 1.5 0 .843-.596 1.483-.596.64-1.439.64-.873 0-1.469-.64-.596-.64-.596-1.483zm.204 20.321V18.227q0-.606.523-.977t1.338-.371q.814 0 1.352.371.538.371.538.977v13.278q0 .506-.567.944-.567.438-1.323.438-.786 0-1.324-.421-.537-.422-.537-.961z"/><circle cx="21" cy="21" r="17" fill="none" stroke="#000" stroke-linejoin="round" stroke-miterlimit="3" stroke-width="2" vector-effect="non-scaling-stroke"/></g></svg>
							<span class={style['nav-list__caption']}>About</span>
						</Link>
					</li> */}
				</ul>
			</nav>
		);
	}
}
