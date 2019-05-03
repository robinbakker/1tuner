import { h, Component } from 'preact';
import style from './style';

export default class DropDown extends Component {
  constructor(props) {
    super(props);
    this.state = {
      id:null,
      value: null,
      optionList: []
    }
  }

  handleChange = e => {
    this.setState({ value: e.target.value });
    this.props.valueChanged(e.target.value);
  }

  componentDidMount() {
    if (!this.state.id && this.props.id) {
      this.setState({ id: this.props.id });
    }
  }
  
	render() {
    if (typeof this.props.initialValue !== 'undefined' && (this.state.value==null || this.state.value!=this.props.initialValue)) {
      this.setState({ value: this.props.initialValue });
    }
    if ((!this.state.optionList || !this.state.optionList.length) && this.props.optionList && this.props.optionList.length) {
      this.setState({ optionList: this.props.optionList })
    }
    return (
      <label class={style['dd-container'] + ' label-container'}>
        <span class={style['dd-label-text']+' label-text'}>{this.props.label}</span>
        <select id={this.state.id} class={style['dd-select'] + ' dropdown'} value={this.state.value} onChange={this.handleChange}>
          {this.state.optionList.map(optionItem => (
            <option value={optionItem.value} selected={optionItem.value==this.state.value}>{optionItem.text}</option>
          ))}
        </select>
      </label>
		);
	}
}