import { h, Component } from 'preact';
import style from './style';

export default class DropDown extends Component {
  constructor(props) {
    super(props);
    this.state = {
      id:null,
      value: null,
      optionList: null
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

  loadData = () => {
    let value = this.state.value;
    let optionList = this.state.value;
    if (typeof this.props.initialValue !== 'undefined' && (this.state.value==null || this.state.value!=this.props.initialValue)) {
      value = this.props.initialValue;
    }
    if ((!this.state.optionList || !this.state.optionList.length) && this.props.optionList && this.props.optionList.length) {
      optionList = this.props.optionList;
    }
    this.setState({
      value: value, 
      optionList: optionList 
    });
  }
  
	render({label}, {id, value, optionList}) {
    if (optionList) {
      return (
        <label class={style['dd-container'] + ' label-container'}>
          {label ? <span class={style['dd-label-text'] +' label-text'}>{label}</span> : null }
          <select id={id} class={style['dd-select'] + ' dropdown'} value={value} onChange={this.handleChange}>
            {optionList.map(optionItem => (
              <option value={optionItem.value} selected={optionItem.value==value}>{optionItem.text}</option>
            ))}
          </select>
        </label>
      );
    } else {
      this.loadData();
      return null;
    }
	}
}