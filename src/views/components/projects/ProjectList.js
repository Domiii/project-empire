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
  hrefProjectList,
  hrefProjectEntry
} from 'src/views/href';

import { Redirect, withRouter } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';

import {
  Button, ListGroup, Alert, Panel
} from 'react-bootstrap';

import { LoadOverlay } from 'src/views/components/overlays';

import FAIcon from 'src/views/components/util/FAIcon';
import LoadIndicator from 'src/views/components/util/loading';
import ImageLoader from 'src/views/components/util/react-imageloader';
import FancyPanelToggleTitle from 'src/views/components/util/FancyPanelToggleTitle';


import ProjectForm from './ProjectForm';


export const ProjectIcon = dataBind({})(function ProjectIcon(
  { projectId },
  { projectById }
) {
  if (!projectById.isLoaded({ projectId })) {
    return (<LoadIndicator />);
  }

  const project = projectById({ projectId });

  const iconUrl = project && project.iconUrl;

  return (
    <ImageLoader
      src={iconUrl}
      className="project-icon"
    />
  );
});

@dataBind({})
export class ProjectHeader extends Component {
  render(
    { projectId, isSelected },
    { projectById, lookupLocalized }
  ) {
    if (!projectById.isLoaded({ projectId })) {
      return (<LoadIndicator />);
    }

    const project = projectById({ projectId });
    if (!project) {
      return (<Alert bsStyle="danger">invalid projectId : {projectId}</Alert>);
    }

    return (<span>
      <h3 className="inline no-margin">
        <ProjectIcon projectId={projectId} />
        {JSON.stringify(project)}
        {lookupLocalized({ obj: project, prop: 'title' })}
      </h3>
    </span>);
  }
}

//@dataBind({})
export class ProjectPanelHeader extends Component {
  toggleView = () => {
  }

  render() {
    const { projectId, isSelected } = this.props;

    //return (<HashLink smooth to={link}>
    return (<FancyPanelToggleTitle onClick={this.toggleView}>
      <ProjectHeader projectId={projectId} isSelected={isSelected} />
    </FancyPanelToggleTitle>);
    //</HashLink>);
  }
}

@withRouter
export class ProjectPanel extends Component {
  onToggle = (isNowSelected) => {
    const { projectId, history } = this.props;
    const link = hrefProjectEntry('view', isNowSelected ? projectId : '');
    history.push(link);
  }

  render() {
    const { projectId, isSelected } = this.props;

    return (<Panel expanded={isSelected} onToggle={this.onToggle}>
      <Panel.Heading>
        <ProjectPanelHeader projectId={projectId} isSelected={isSelected} />
      </Panel.Heading>
      <Panel.Body collapsible>
        ni hao! {isSelected}
      </Panel.Body>
    </Panel>);
  }
}




function getSelectedProjectId() {
  return window.location.hash && window.location.hash.substring(1);
}

const itemsPerPage = 2;

@withRouter
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
    // TODO: Make "projectId selection" + paging work together somehow
    return sortedProjectIdsOfPage(this.ProjectListArgs);
  }

  toggleAdding = () => {
    this.setAdding(!this.state.adding);
  }

  setAdding = (adding) => {
    this.setState({ adding });
  }

  onAddedProject = (idArgs, formArgs, promise) => {
    this.setAdding(false);

    const projectId = promise.key;
    const { history } = this.props;
    const link = hrefProjectEntry('view', projectId);
    history.push(link);
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
          <FAIcon name="plus" className="color-green" />start new project
        </Button>

        {this.IsAdding &&
          <ProjectForm projectId={null} onSubmit={this.onAddedProject} />
        }
      </div>
    );
  }

  render(
    { match },
    { sortedProjectIdsOfPage },
    { }
  ) {
    const { mode } = match.params;
    if (!mode) {
      // we are in view mode by default
      return <Redirect to={hrefProjectList('view')} />;
    }

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
      const proj0 = (page - 1) * itemsPerPage + 1;
      const proj1 = Math.min(nProjects, page * itemsPerPage);

      projectListEl = (<Panel>
        <Panel.Heading>
          Projects ({proj0}-{proj1} of {nProjects})
        </Panel.Heading>
        <Panel.Body>
          {
            map(projectIds, (projectId) => {
              return (
                <ProjectPanel {...{
                  key: projectId,
                  //readonly: false,
                  projectId,
                  isSelected: projectId === getSelectedProjectId()
                }} />
              );
            })
          }
          {(
            <Button disabled={nProjects < page * itemsPerPage}
              onClick={this.nextPage} block>
              more...
            </Button>
          )}
          {stillLoading && (
            <LoadIndicator block />
          )}
        </Panel.Body>
      </Panel>);
    }

    return (<div>
      {this.renderToolbar()}
      {projectListEl}
    </div>);
  }
}