import { h, Component } from 'preact';
import { route } from 'preact-router';

export default class Redirect extends Component {
  componentWillMount() {
    let toRoute = this.props.to;
    if (this.props.path.indexOf(':') > 0) {
      let pathStart = this.props.path.substr(0, this.props.path.indexOf(':')-1);
      toRoute = this.props.url.indexOf(pathStart) == -1 ? toRoute : toRoute + this.props.url.substr(pathStart.length);
    }
    route(toRoute, true);
  }

  render() {
    return null;
  }
}