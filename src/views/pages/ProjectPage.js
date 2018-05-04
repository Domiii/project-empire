import React, { Component } from 'react';
import PropTypes from 'prop-types';
import dataBind from 'src/dbdi/react/dataBind';

import { 
  Alert, Button, Jumbotron, Well, Panel
} from 'react-bootstrap';

import autoBind from 'react-autobind';
import {
  LinkContainer
} from 'react-router-bootstrap';

import ProjectTable from 'src/views/components/projects/ProjectTable';


export default class ProjectPage extends Component {
  static propTypes = {
    projectIds: PropTypes.object
  };

  constructor(...args) {
    super(...args);

    autoBind(this);
  }

  render() {
    //{ this.IsGuardian && this.makeGuardianEl() }
    return (
      <div>
        <ProjectTable />
      </div>
    );
  }
}