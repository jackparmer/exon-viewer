/* global Plotly:true */

import React, { Component } from 'react';
import createPlotlyComponent from 'react-plotly.js/factory';

// import {Plot} from 'react-plotly.js'

import {generateTracks, ExonViewerFactory} from './ExonViewerFactory';

import './App.css';

/* (Note that Plotly is already defined from loading plotly.js through a <script> tag) */
const Plot = createPlotlyComponent(Plotly);

const MAX_HEIGHT = 1000;

class App extends Component {

  constructor(props) {
    super(props);

    this.handleCheckbox = this.handleCheckbox.bind(this);
    this.handleRefresh = this.handleRefresh.bind(this);
    this.handleDropdown = this.handleDropdown.bind(this);

    const NUM_TRACKS = 10;

    this.state = {
      genomicCoordinates: false,
      tracks: generateTracks(NUM_TRACKS),
      numTracks: NUM_TRACKS
    };
  }

  handleCheckbox(e) {
    this.setState({genomicCoordinates: e.target.checked});
  }

  handleRefresh() {
    const newTracks = generateTracks(this.state.numTracks);
    this.setState({tracks: newTracks});
  }

  handleDropdown(e) {
    const numTracks = e.target.value;
    this.setState({
        numTracks: numTracks,
        tracks: generateTracks(numTracks)
    });
  }

  render() {

    let tracks = this.state.tracks;

    tracks.genomicCoordinates = this.state.genomicCoordinates;
    let plotlyFigure = ExonViewerFactory(tracks);

    plotlyFigure.layout.height = MAX_HEIGHT/(12 - this.state.numTracks);

    return (
      <div className="App">
        <label>Genomic coordinates (hide introns)</label>
        <input
          name='genomicCoords'
          type='checkbox'
          checked={this.state.genomicCoordinates}
          onChange={this.handleCheckbox}
        />
        <label style={{marginLeft:'20px', marginRight:'10px'}}># Tracks</label>
        <select
          value={this.state.numTracks}
          onChange={this.handleDropdown}
        >
          {Array.from(Array(20).keys()).map(i => {
            i += 1;
            return <option key={i} value={i}>{i}</option>
          })}
        </select>
        <button
          onClick={this.handleRefresh}
          style={{marginLeft:'20px'}}
        >
          Refresh Random Data
        </button>
        <Plot
          data={plotlyFigure.data}
          layout={plotlyFigure.layout}
          style={{marginTop: 50}}
          config={{displayModeBar: false}}
        />
      </div>
    );
  }
}

export default App;
