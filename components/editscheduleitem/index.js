import { h, Component } from 'preact';
import style from './style';
import DropDown from '../dropdown';
import HourDropDown from '../hourdropdown';

export default class EditScheduleItem extends Component {
  constructor(props) {
    super(props);    
    this.state = {
      station:'',
      stationName:'',
      startHour: -1,
      endHour: -1,
      stationList: []
    };
  }

  startHourChanged = h => {
    let oldStart = this.state.startHour;
    this.setState({startHour:h});
    if (typeof this.props.rowChange === 'function') this.props.rowChange(this.state.startHour, this.state.endHour, this.state.station, oldStart, this.state.endHour);
  }
  endHourChanged = h => {
    let oldEnd = this.state.endHour;
    this.setState({endHour:h});
    if (typeof this.props.rowChange === 'function') this.props.rowChange(this.state.startHour, this.state.endHour, this.state.station, this.state.startHour, oldEnd);
  }
  stationChanged = s => {
    this.setState({station:s});
    if (typeof this.props.rowChange === 'function') this.props.rowChange(this.state.startHour, this.state.endHour, this.state.station, this.state.startHour, this.state.endHour);
  }
  buttonClick = e => {
    this.props.buttonClick(e, this.state.startHour, this.state.endHour, this.state.station);
    e.preventDefault();
  }
  
	render() {
    if (typeof this.props.startHour !== 'undefined' && (this.state.startHour==-1 || this.state.startHour!=this.props.startHour)) {
      this.setState({startHour:this.props.startHour});
    }
    if (typeof this.props.endHour !== 'undefined'  && (this.state.endHour==-1 || this.state.endHour!=this.props.endHour)) {
      this.setState({endHour:this.props.endHour});
    }
    if (typeof this.props.station !== 'undefined'  && (this.state.station=='' || this.state.station!=this.props.station)) {
      this.setState({station:this.props.station});
    }
    if((!this.state.stationList || !this.state.stationList.length) && this.props.stationOptionList && this.props.stationOptionList.length) {
      this.setState({stationList:this.props.stationOptionList});
    }
    return (
      <fieldset class={style['esi-container']}>
        <HourDropDown label="Start hour" hour={this.props.startHour} valueChanged={this.startHourChanged.bind(this)} />
        <HourDropDown label="End hour" hour={this.props.endHour} valueChanged={this.endHourChanged.bind(this)} />
        <DropDown label="Station" initialValue={this.props.station} optionList={this.state.stationList} valueChanged={this.stationChanged.bind(this)} />
        {this.props.buttonText ? <button class={'btn' + (this.props.buttonClass ? ' ' +this.props.buttonClass : '')} onClick={this.buttonClick.bind(this)}>{this.props.buttonText}</button> : null}
      </fieldset>
		);
	}
}