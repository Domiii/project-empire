import ProjectsRef, { UserProjectRef } from 'src/core/projects/ProjectsRef';
import UserInfoRef from 'src/core/users/UserInfoRef';
import MissionsRef from 'src/core/missions/MissionsRef';

import { hasDisplayRole } from 'src/core/users/Roles';

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

import ProjectList from 'src/views/components/projects/ProjectList';


export default class ProjectPage extends Component {
  propTypes = {
    projectIds: PropTypes.object
  };

  constructor(...args) {
    super(...args);

    autoBind(this);
  }

  render({}, {}, {}) {
    //{ this.IsGuardian && this.makeGuardianEl() }
    return (
      <div>
        <ProjectList />
      </div>
    );
  }
}