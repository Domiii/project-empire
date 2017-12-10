//import Roles, { hasDisplayRole, isGuardian } from 'src/core/users/Roles';

import isEmpty from 'lodash/isEmpty';
import map from 'lodash/map';
import sortBy from 'lodash/sortBy';
import size from 'lodash/size';

//import { EmptyObject, EmptyArray } from 'src/util';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import autoBind from 'react-autobind';

import dataBind from 'src/dbdi/react/dataBind';

import {
  Button, ListGroup, Alert, Panel
} from 'react-bootstrap';

import { LoadOverlay } from 'src/views/components/overlays';

import { FAIcon } from 'src/views/components/util';

import LoadIndicator from 'src/views/components/util/loading';
import ProjectPanel from './ProjectPanel';
import ProjectEditor from './ProjectEditor';


const itemsPerPage = 2;

@dataBind({
})
export default class ProjectList extends Component {
  constructor() {
    super();

    this.state = {
      adding: false,
      page: 1
    };

    this.dataBindMethods(
      this.getProjectIds,
      this.renderToolbar
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
      itemsPerPage,
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

  nextPage = () => {
    this.setPage(this.state.page + 1);
  }

  setPage = (page) => {
    this.setState({ page });
  }

  renderToolbar({ }, { }, { isCurrentUserGuardian }) {
    return !isCurrentUserGuardian ? null : (
      <div>
        <Button active={this.IsAdding}
          bsStyle="success" bsSize="small"
          onClick={this.toggleAdding}>
          <FAIcon name="plus" className="color-green" /> create new project
        </Button>

        {this.IsAdding &&
          <ProjectEditor projectId={null} onSave={this.onAddedProject} />
        }
      </div>
    );
  }

  render({ }, { sortedProjectIdsOfPage }, { }) {
    const projectIds = this.getProjectIds();
    const nProjects = size(projectIds);
    const stillLoading = !sortedProjectIdsOfPage.isLoaded(this.ProjectListArgs);

    let projectListEl;
    if (!nProjects) {
      if (stillLoading) {
        return <LoadOverlay />;
      }
      projectListEl = (<Alert bsStyle="warning">there are no projects</Alert>);
    }
    else {
      const { page } = this.state;
      projectListEl = (<Panel header={`Projects (${nProjects})`}>
        <ListGroup> {
          map(projectIds, (projectId) => {

            return (<li key={projectId} className="list-group-item">
              <ProjectPanel {...{
                readonly: false,
                projectId
              }} />
            </li>);
          })
        } </ListGroup>
        { (
          <Button disabled={nProjects < page * itemsPerPage} block
            onClick={this.nextPage} >
            more...
          </Button>
        ) }
        {stillLoading && (
          <LoadIndicator block />
        )}
      </Panel>);
    }

    return (<div>
      {this.renderToolbar()}
      {projectListEl}
    </div>);
  }
}