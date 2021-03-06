import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { dataBind } from 'dbdi/react';

import { 
  Alert, Button, Jumbotron, Well, Panel
} from 'react-bootstrap';

import {
  LinkContainer
} from 'react-router-bootstrap';

import ProjectTable from 'src/views/components/projects/ProjectTable';


export default class ProjectPage extends Component {
  render() {
    //{ this.IsGuardian && this.makeGuardianEl() }
    return (
      <div className="container no-padding">
        <ProjectTable />
      </div>
    );
  }
}