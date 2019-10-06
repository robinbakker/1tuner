import { h, Component } from 'preact';

export default class AudioPlayerSource extends Component {
  constructor(props) {
    super(props);
  }
  
	render() {
    let urlSrc, urlDataSrc;
    if (this.props.isPlaying || this.props.usePause) {
      urlSrc = this.props.source.url;
      urlDataSrc = '';
    } else {
      urlDataSrc = this.props.source.url;
      urlSrc = '';
    }
    return (
			<source src={urlSrc} data-src={urlDataSrc} type={this.props.source.mimetype} />
		);
	}
}