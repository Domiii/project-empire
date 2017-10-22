//import Roles, { hasDisplayRole, isGuardian } from 'src/core/users/Roles';

import isEmpty from 'lodash/isEmpty';
import map from 'lodash/map';
import sortBy from 'lodash/sortBy';

//import { EmptyObject, EmptyArray } from 'src/util';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import autoBind from 'react-autobind';

import dataBind from 'src/dbdi/react/dataBind';

import {
  Button, ListGroup, Alert
} from 'react-bootstrap';

import { LoadOverlay } from 'src/views/components/overlays';

import { FAIcon } from 'src/views/components/util';

import LoadIndicator from 'src/views/components/util/loading';
import ProjectPreview from './ProjectPreview';
import ProjectEditor from './ProjectEditor';



@dataBind({
})
export default class ProjectList extends Component {
  constructor() {
    super();

    this.state = {
      adding: false,
      page: 0
    };

    this.dataBindMethods(
      this.getProjectIds,
      this.makeEditorHeader
    );

    autoBind(this);
  }

  get IsAdding() {
    return this.state.adding;
  }

  get CurrentPage() {
    return this.state.page;
  }

  get ProjectListArgs() {
    return {
      page: this.CurrentPage
    };
  }

  getProjectIds({ }, { sortedProjectIdsOfPage }, { }) {
    return sortedProjectIdsOfPage(this.ProjectListArgs);
  }

  toggleAdding = () => {
    this.setAdding(!this.state.adding);
  }

  setAdding = (adding) => {
    this.setState({ adding });
  }

  onAddedProject = () => {
    this.setAdding(false);
  }

  setPage = (page) => {
    this.setState({ page });
  }

  makeEditorHeader({ }, { }, { isCurrentUserGuardian }) {
    return !isCurrentUserGuardian ? null : (
      <div>
        <Button active={this.IsAdding}
          bsStyle="success" bsSize="small"
          onClick={this.toggleAdding}>
          <FAIcon name="plus" className="color-green" /> add new project
          </Button>

        {this.IsAdding &&
          <ProjectEditor projectId={null} onSave={this.onAddedProject} />
        }
      </div>
    );
  }

  render({ }, { sortedProjectIdsOfPage }, { }) {
    if (!sortedProjectIdsOfPage.isLoaded(this.ProjectListArgs)) {
      // still loading
      return (<LoadOverlay />);
    }

    const projectIds = this.getProjectIds();

    let projectListEl;
    if (isEmpty(projectIds)) {
      projectListEl = (<Alert bsStyle="warning">there are no projects</Alert>);
    }
    else {
      projectListEl = (<ListGroup> {
        map(projectIds, (projectId) => {

          return (<li key={projectId} className="list-group-item">
            <ProjectPreview {...{
              readonly: false,
              projectId
            }} />
          </li>);
        })
      } </ListGroup>);
    }

    return (<div>
      {this.makeEditorHeader()}
      {projectListEl}
    </div>);
  }
}