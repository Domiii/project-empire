import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { dataBind } from 'dbdi/react';


const DefaultStatusMessages = {
  [SaveStatus.NotSaved]: 'not saved',
  [SaveStatus.Saving]: 'saving...',
  [SaveStatus.Saved]: 'Saved.'
};

@dataBind({})
export default class AutoSave extends Component {
  constructor(...args) {
    super(...args);

    this.state = {

    };
  }

  render() {
    return ();
  }
}