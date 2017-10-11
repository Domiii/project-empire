import React, { Component } from 'react';
import PropTypes from 'prop-types';

import dataBind from 'src/dbdi/react/dataBind';

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
  static contextTypes = {
    currentUserRef: PropTypes.object.isRequired
  };

  constructor(...args) {
    super(...args);

    autoBind(this);
  }

  get IsNotLoadedYet() {
    const { currentUserRef } = this.context;
    return !currentUserRef || !currentUserRef.isLoaded;
  }

  render() {
    if (this.IsNotLoadedYet) {
      // still loading
      return (<LoadOverlay />);
    }

    //console.log(this.context.currentUserRef, this.context.currentUserRef.isAdminDisplayMode());

    return (
      <div>
        <span>hi!</span>
        <pre>（任務鑑定前自評表）
  TODO: Rule book
  TODO: Q & A
  專案帝國的新聞　（or 上課簡報）</pre>
      </div>
    );
  }
}