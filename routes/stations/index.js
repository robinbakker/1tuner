import { h, Component } from 'preact';
import style from './style';
import StationList from '../../components/stationlist';
import Header from '../../components/header';
import FilterPanel from '../../components/filterpanel';
import { setDocumentMetaTags } from '../../utils/misc';

export default class Stations extends Component {
  constructor(props) {
    super(props);
    this.state = {
      docTitle: 'Radio stations',
      docDescription: 'Listen to online radio at 1tuner.com',
      searchQuery: null,
      showFilterPanel: false,
    };
  }

  componentDidMount() {
    setDocumentMetaTags(this.state.docTitle, this.state.docDescription);
  }

  changeStation = (AStation) => {
    this.props.changeStation(AStation);
  };

  toggleFilterPanel = () => {
    this.setState({ showFilterPanel: !this.state.showFilterPanel });
  };
  setSearchQuery = (e) => {
    this.setState({ searchQuery: e.target.value });
  };
  resetSearchQuery = () => {
    this.setState({ searchQuery: '' });
  };

  setSearchInputBlur = () => {
    if (typeof document != 'undefined') {
      setTimeout(function () {
        document.body.classList.remove('search-focus');
      }, 500);
    }
  };
  setSearchInputFocus = () => {
    if (typeof document != 'undefined') {
      document.body.classList.add('search-focus');
    }
  };
  onKeyDown = (e) => {
    if (e.keyCode === 13) {
      e.preventDefault();
    }
    return false;
  };

  setLanguageList = (AResult) => {
    this.props.setLanguageList(AResult);
  };

  render({ stationList, languageList }, { docTitle, docDescription, searchQuery, showFilterPanel }) {
    return (
      <div class={'page-container'}>
        <Header title={docTitle} sharetext={docDescription} />
        <FilterPanel
          setLanguageList={this.setLanguageList.bind(this)}
          languageList={languageList}
          showFilterPanel={showFilterPanel}
          toggleFilterPanel={this.toggleFilterPanel.bind(this)}
        />
        <main class={'content ' + style.stations + ' ' + (showFilterPanel ? style['stations--show-panel'] : '')}>
          <h1 class={'main-title'}>
            {docTitle}
            <small class={'main-subtitle'}>Listen to the radio 📻</small>
          </h1>
          <form class={'form-search'}>
            <input
              type="text"
              placeholder="Find..."
              maxlength="100"
              required
              pattern="[a-zA-Z0-9\s]+"
              class={'textfield textfield--search'}
              onFocus={this.setSearchInputFocus.bind(this)}
              onBlur={this.setSearchInputBlur.bind(this)}
              onKeyDown={this.onKeyDown}
              onInput={this.setSearchQuery.bind(this)}
            />
            <button class={'btn-search-reset'} onClick={this.resetSearchQuery.bind(this)} type="reset">
              Reset
            </button>
          </form>
          <button class={'btn ' + style['btn--toggle-filter']} onClick={this.toggleFilterPanel.bind(this)}>
            Filter
          </button>
          <StationList
            languageList={languageList}
            useLinksOnly={false}
            stationList={stationList}
            stationSearchQuery={searchQuery}
            changeStation={this.changeStation.bind(this)}
            limitCount={100}
          />
        </main>
      </div>
    );
  }
}
