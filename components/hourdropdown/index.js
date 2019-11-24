import { h, Component } from 'preact';
import DropDown from '../dropdown';

export default class HourDropDown extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hourItems:[],
    }
  }

  componentDidMount() {	
    let hours = [];
		for(let h=0; h<=24; h++) {
			hours.push({value:h, text:h});
		}
		this.setState({ hourItems: hours });
  }

  valueChanged = e => {
    this.props.valueChanged(e);
  }
  
	render() {
    return (
      <DropDown label={this.props.label} initialValue={this.props.hour} optionList={this.state.hourItems} valueChanged={this.valueChanged.bind(this)} />
    );
	}
}