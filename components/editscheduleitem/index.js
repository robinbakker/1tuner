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
    this.setState({startHour:h}, () => {
      if (typeof this.props.rowChange === 'function') {
        this.props.rowChange(h, this.state.endHour, this.state.station, oldStart, this.state.endHour);
      }
    });
  }
  endHourChanged = h => {
    let oldEnd = this.state.endHour;
    this.setState({endHour:h}, () => {
      if (typeof this.props.rowChange === 'function') {
        this.props.rowChange(this.state.startHour, h, this.state.station, this.state.startHour, oldEnd);
      }
    });
  }
  stationChanged = s => {
    this.setState({station:s}, () => {
      if (typeof this.props.rowChange === 'function') {
        this.props.rowChange(this.state.startHour, this.state.endHour, s, this.state.startHour, this.state.endHour);
      }
    });
  }
  buttonClick = e => {
    this.props.buttonClick(e, this.state.startHour, this.state.endHour, this.state.station);
    e.preventDefault();
  }
  
  loadData = () => {
    let startHour = this.state.startHour;
    let endHour = this.state.endHour;
    let station = this.state.station;
    let stationList = this.state.stationList || this.props.stationOptionList;
    if (typeof this.props.startHour !== 'undefined' && (this.state.startHour==-1 || this.state.startHour!=this.props.startHour)) {
      startHour = this.props.startHour;
    }
    if (typeof this.props.endHour !== 'undefined'  && (this.state.endHour==-1 || this.state.endHour!=this.props.endHour)) {
      endHour = this.props.endHour;
    }
    if (typeof this.props.station !== 'undefined'  && (this.state.station=='' || this.state.station!=this.props.station)) {
      station = this.props.station;
    }
    if ((!stationList || !stationList.length) && this.props.stationOptionList && this.props.stationOptionList.length) {
      stationList = this.props.stationList;
    }
    this.setState({
      startHour:startHour,
      endHour:endHour,
      station:station,
      stationList:stationList
    });
  }

	render({buttonClass,buttonText,stationOptionList}, {startHour,endHour,station,stationList}) {
    if (!stationList || !stationList.length) {
      if (stationOptionList && stationOptionList.length) {
        this.loadData();
      }
      return <fieldset class={style['esi-container']}></fieldset>;
    } else {
      return (
        <fieldset class={style['esi-container']}>
          <HourDropDown label="Start hour" hour={startHour} valueChanged={this.startHourChanged.bind(this)} />
          <HourDropDown label="End hour" hour={endHour} valueChanged={this.endHourChanged.bind(this)} />
          <DropDown label="Station" initialValue={station} optionList={stationList} valueChanged={this.stationChanged.bind(this)} />
          {buttonText ? <button class={'btn' + (buttonClass ? ' ' + buttonClass : '')} onClick={this.buttonClick.bind(this)}>{buttonText}</button> : null}
        </fieldset>
      );
    }
	}
}