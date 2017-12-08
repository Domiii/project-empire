import React, { Component } from 'react';
import PropTypes from 'prop-types';
import dataBind from 'src/dbdi/react/dataBind';

import { 
  Alert, Button, Jumbotron, Well, Panel
} from 'react-bootstrap';

import { LoadOverlay } from 'src/views/components/overlays';

import PlaceList from 'src/views/components/places/PlaceList';


@dataBind()
export default class PlacePage extends Component {
  static propTypes = {
    
  };

  constructor(...args) {
    super(...args);
  }

  render(
    { }, 
    { }, 
    { currentUser_isLoaded }
  ) {
    if (!currentUser_isLoaded) {
      return (<LoadOverlay />);
    }

    return (
      <div>
        <Panel bsStyle="primary" header="Places">
          <PlaceList />
        </Panel>
      </div>
    );
  }
}