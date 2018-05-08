import React, { Component } from 'react';
import PresentationTable from './PresentationTable';



function getSelectedId() {
  return window.location.hash && window.location.hash.substring(1);
}

export default class PresentationSessionView extends Component {
  render() {
    return <PresentationTable />;
  }
}