import map from 'lodash/map';
import isEmpty from 'lodash/isEmpty';

import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import autoBind from 'react-autobind';
import Moment from 'react-moment';
import {
  Alert, Button, Badge,
  Grid, Row, Col
} from 'react-bootstrap';

import { Flex, Item } from 'react-flex';

import ConfirmModal from 'src/views/components/util/ConfirmModal';
import UserList from 'src/views/components/users/UserList';
import UserIcon from 'src/views/components/users/UserIcon';

import { 
  Field, reduxForm, FormSection
} from 'redux-form';

import { 
  FormInputField,
  FAIcon
} from 'src/views/components/util';


class _ProjectInfoFormContent extends Component {
  static contextTypes = {
    currentUserRef: PropTypes.object
  };

  static propTypes = {
    projectId: PropTypes.string.isRequired
  };

  render() {
    const { currentUserRef } = this.context;
    const {
      projectId,

      handleSubmit,
      pristine,
      reset, 
      submitting 
    } = this.props;

    return (<form className="form-horizontal" 
        onSubmit={handleSubmit}>
      <Field name="projectId" value={projectId} component="input" type="hidden" />
      <FormSection name="project">
        <FormInputField name="guardianNotes" label="Guardian Notes"
          component="textarea"
          inputProps={{
            rows: '3', 
            placeholder:"冒險者有沒有提出疑問或是對 Guardian 不友善？"
          }}
          labelProps={{xs: 2, className: 'no-padding'}}
          inputColProps={{xs: 10, className: 'no-padding'}}
        />

        <div>
          <Button type="submit" disabled={pristine || submitting}>
            {<span><FAIcon name="upload" className="color-green" /> save</span>}
          </Button>
          <Button disabled={pristine || submitting} onClick={reset}>reset</Button>
        </div>
      </FormSection>
    </form>);
  }
}

const _ProjectInfoForm = reduxForm({ enableReinitialize: true })(_ProjectInfoFormContent);

export const ProjectInfoForm = connect(
  (state, { project, projectId }) => {
    return ({
      form: 'project_' + projectId,
      initialValues: {
        project,
        projectId
      },
    });
  }
)(_ProjectInfoForm);

function DeleteUserButton({open}) {
  return (<Button onClick={open} bsSize="small"
      className="color-red no-padding">
    <FAIcon name="trash" />
  </Button>);
}
function makeExistingUserEl(deleteUserFromProject) {
  return ({user, uid}) => (<Badge>
    <span className="user-tag">
      <UserIcon user={user} size="tiny" /> &nbsp;
      {user.displayName} &nbsp;
      <ConfirmModal
        header="Delete user from project?"
        body={(<span>{user.displayName}</span>)}
        ButtonCreator={DeleteUserButton}
        onConfirm={deleteUserFromProject}
        confirmArgs={uid}
      />
    </span>
  </Badge>);
}


function AddUserButton({open}) {
  return (<Button onClick={open}
    className="color-green no-padding"
    bsSize="small">
    <FAIcon name="plus" />
  </Button>);
}
function makeAddUserEl(addUserToProject) {
  return ({user, uid}) => (<Badge>
    <span className="user-tag">
      <UserIcon user={user} size="tiny" /> &nbsp;
      {user.displayName} &nbsp;

      <ConfirmModal
        header="Add user to project?"
        body={(<span>{user.displayName}</span>)}
        ButtonCreator={AddUserButton}
        onConfirm={addUserToProject}
        confirmArgs={uid}
      />
    </span>
  </Badge>);
}

export function ProjectUserEditor({
  existingUsers,
  addableUsers,

  deleteUserFromProject,
  addUserToProject
}) {
  return (<Flex row={true} alignItems="start">
    <Item>
      <UserList users={existingUsers} 
          renderUser={makeExistingUserEl(deleteUserFromProject)} />
    </Item>
    <Item>
      <UserList users={addableUsers} 
          renderUser={makeAddUserEl(addUserToProject)} />
    </Item>
  </Flex>);
}



export default class ProjectEditor extends Component {
  static propTypes = {
    projectId: PropTypes.string.isRequired,
    project: PropTypes.object.isRequired,
    existingUsers: PropTypes.object.isRequired,
    addableUsers: PropTypes.object.isRequired,

    setProject: PropTypes.func.isRequired,
    addUserToProject: PropTypes.func.isRequired,
    deleteUserFromProject: PropTypes.func.isRequired
  };

  constructor() {
    super();

    autoBind(this);
  }


  addUserToProject(uid) {
    const {
      projectId,
      addUserToProject
    } = this.props;

    return addUserToProject({
      user: uid,
      project: projectId
    });
  }

  deleteUserFromProject(uid) {
    const {
      projectId,
      deleteUserFromProject
    } = this.props;

    return deleteUserFromProject({
      user: uid,
      project: projectId
    });
  }

  render() {
    const {
      projectId,
      project,
      existingUsers,
      addableUsers,

      setProject
    } = this.props;


    return (
      <div>
        <ProjectInfoForm 
          onSubmit={ setProject }
          {...{ project, projectId }}
        />

        <ProjectUserEditor {...{
          existingUsers,
          addableUsers,

          addUserToProject: this.addUserToProject,
          deleteUserFromProject: this.deleteUserFromProject
        }} />
      </div>
    );
  }
}