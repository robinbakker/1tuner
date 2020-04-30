import { h, Component } from 'preact';
import style from './style';
import Header from '../../components/header';
import { Link } from 'preact-router/match';
import { setDocumentMetaTags } from '../../utils/misc';

export default class Error extends Component {
  constructor(props) {
    super(props);
    this.state = {
      docTitle: '404 - Page not found',
      docDescription: 'Nothing to see here 🙄'
    };
  }

	componentDidMount() {
		setDocumentMetaTags(this.state.docTitle,this.state.docDescription,'','',true);
	}

	render() {
		return (
			<div class={'page-container'}>
				<Header title="Page not found" showShare={false} />
				<main class={'content ' + (style.error)}>
					<h1 class={'main-title'}>Page not found...
					<small class={'main-subtitle'}>Nothing to see here 🙄</small></h1>
					<p>Do you want to listen to a <Link href="/radio-stations" native>radio station</Link>? Or maybe plan your own <Link href="/playlists" native>radio listening day</Link>?</p>
				</main>
			</div>
		);
	}
}
