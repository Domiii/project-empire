import map from 'lodash/map';
import size from 'lodash/size';

//import { EmptyObject, EmptyArray } from 'src/util';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import autoBind from 'react-autobind';

import { dataBind } from 'dbdi/react';

import {
  hrefProjectList,
  hrefProjectEntry
} from 'src/views/href';

import { Redirect, withRouter } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';
import Flexbox from 'flexbox-react';

import {
  Button, Alert, Panel
} from 'react-bootstrap';

import { LoadOverlay } from 'src/views/components/overlays';

import FAIcon from 'src/views/components/util/FAIcon';
import LoadIndicator from 'src/views/components/util/LoadIndicator';
import ImageLoader from 'src/views/components/util/react-imageloader';
import FancyPanelToggleTitle from 'src/views/components/util/FancyPanelToggleTitle';


import ProjectEditor from './ProjectEditor';
import {
  ProjectBody
} from './ProjectPanel';
import ProjectContributorBar from './ProjectContributorBar';


const itemsPerPage = 20;

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
    let titleEl;
    if (!project) {
      titleEl = (<Alert bsStyle="danger">invalid projectId : {projectId}</Alert>);
    }
    else {
      const {
        iconUrl,
        title
      } = project;
      titleEl = (<h3 className="inline no-margin">
        <ProjectIcon projectId={projectId} src={iconUrl} />
        &nbsp;
        {title}
      </h3>);
    }

    return (<div>
      {titleEl}
    </div>);
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
      <Flexbox className="full-width" justifyContent="space-between" alignItems="center">
        <ProjectHeader projectId={projectId} isSelected={isSelected} />
        <ProjectContributorBar projectId={projectId}>
          &nbsp;
        </ProjectContributorBar>
      </Flexbox>
    </FancyPanelToggleTitle>);
    //</HashLink>);
  }
}


@withRouter
@dataBind()
export class ProjectPanel extends Component {
  onToggle = (isNowSelected) => {
    const { projectId, history } = this.props;
    const link = hrefProjectEntry('view', isNowSelected ? projectId : '');
    history.push(link);
  }

  render() {
    const { projectId, isSelected } = this.props;

    const className = isSelected && 'yellow-highlight-border' || 'no-highlight-border';

    return (<Panel className={className} expanded={isSelected}
      onToggle={this.onToggle}>
      <Panel.Heading>
        <ProjectPanelHeader projectId={projectId} isSelected={isSelected} />
      </Panel.Heading>
      <Panel.Body collapsible>
        {isSelected && <ProjectBody projectId={projectId} />}
      </Panel.Body>
    </Panel>);
  }
}


function getSelectedProjectId() {
  return window.location.hash && window.location.hash.substring(1);
}

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
          <ProjectEditor projectId={null} onSubmit={this.onAddedProject} />
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
        <Panel.Body className="no-margin">
          {
            map(projectIds, (projectId) => {
              return (
                <ProjectPanel {...{
                  key: projectId,
                  //readonly: false,
                  projectId,
                  //setContext: { thisProjectId: projectId },
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