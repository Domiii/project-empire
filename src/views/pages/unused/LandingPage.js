import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { dataBind } from 'dbdi/react';

import {
  Alert, Button, Jumbotron, Well
} from 'react-bootstrap';

import autoBind from 'react-autobind';
import {
  LinkContainer
} from 'react-router-bootstrap';
import { LoadOverlay } from 'src/views/components/overlays';


@dataBind()
export default class LandingPage extends Component {
  constructor(...args) {
    super(...args);

    autoBind(this);
  }

  render() {
    //console.log(this.context.currentUserRef, this.context.currentUserRef.isAdminDisplayMode());

    return (
      <div>
        <span>hi!</span>
      </div>
    );
  }
}