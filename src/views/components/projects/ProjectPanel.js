import {
  ProjectStatus,
  isProjectStatusOver
} from 'src/core/projects/ProjectDef';

import { getOptionalArguments } from 'src/dbdi/dataAccessUtil';

import map from 'lodash/map';
import isEmpty from 'lodash/isEmpty';
import size from 'lodash/size';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import autoBind from 'react-autobind';
import { Redirect, withRouter } from 'react-router-dom';

import dataBind from 'src/dbdi/react/dataBind';

import Moment from 'react-moment';
import {
  Alert, Button, Well, Panel
} from 'react-bootstrap';
import Flexbox from 'flexbox-react';

import {
  hrefProjectEntry
} from 'src/views/href';



import ProjectEditor from './ProjectEditor';
import ProjectEditTools from './ProjectEditTools';
//import ProjectTeamList from './ProjectTeamList';
//import ProjectControlView from './ProjectControlView';

import UserList from 'src/views/components/users/UserList';
import UserBadge from 'src/views/components/users/UserBadge';

import LoadIndicator from 'src/views/components/util/loading';
import { FAIcon } from 'src/views/components/util';


const defaultProjectBodyArgs = {
  children: null,
  readonly: false
};

@withRouter
@dataBind({
})
export class ProjectBody extends Component {
  static propTypes = {
    projectId: PropTypes.string.isRequired
  };

  constructor() {
    super();

    this.dataBindMethods(
      this.editorHeader
    );

    autoBind(this);
  }

  get IsEditing() {
    const {
      params: {
        mode
      }
    } = this.props.match;

    return mode === 'edit';
  }

  // get ShowDetails() {
  //   return this.state.showDetails;
  // }

  // toggleShowDetails = () => {
  //   this.setState({ showDetails: !this.ShowDetails });
  // }

  toggleEdit = () => {
    const editing = !this.IsEditing;
    const mode = editing ? 'edit' : 'view';

    const { projectId, history } = this.props;
    const link = hrefProjectEntry(mode, projectId);
    history.push(link);
  }

  editorHeader(args, { }, { isCurrentUserGuardian }) {
    //const { showDetails } = this.state;
    const {
      projectId
    } = args;

    const {
      readonly
    } = getOptionalArguments(args,
      'children', 'readonly', defaultProjectBodyArgs);

    return (readonly || !isCurrentUserGuardian) ? null : (
      <Flexbox alignItems="center" justifyContent="flex-end">
        {/* <Button onClick={this.toggleShowDetails}
          bsStyle="primary"
          bsSize="small" active={showDetails}>
          <FAIcon name="cubes" />
        </Button> */}

        <div className="margin-half" />

        <ProjectEditTools {...{
          projectId,

          //changeOrder: 

          editing: this.IsEditing,
          toggleEdit: this.toggleEdit
        }} />
      </Flexbox>
    );
  }

  render(
    args,
    { projectById },
    { }
  ) {
    const {
      projectId
    } = this.props;

    const {
      children, readonly
    } = getOptionalArguments(args,
      'children', 'readonly', defaultProjectBodyArgs);

    if (!projectById.isLoaded({ projectId })) {
      return <LoadIndicator block message="loading project..." />;
    }
    const project = projectById({ projectId });

    if (!project) {
      return (<Alert bsStyle="danger">invalid project id {projectId}</Alert>);
    }

    const { description } = project;

    return (<div>
      {this.editorHeader()}
      <p>Started by: {
        !project.guardianUid ?
          <span className="color-gray">no guardian</span> :
          <UserBadge uid={project.guardianUid} />
      }</p>

      <div className="margin-half" />

      <div className="background-lightyellow">
        {description}
      </div>

      {this.IsEditing && (
        <div>
          <div className="margin-half" />
          <ProjectEditor {...{ projectId }} />
        </div>
      )}
      {/* {this.ShowDetails &&
        <ProjectControlView projectId={projectId} />
      } */}

      {children}
    </div>);
  }
}