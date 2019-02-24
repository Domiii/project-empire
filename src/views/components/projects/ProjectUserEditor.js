
import { getOptionalArgument, NOT_LOADED } from 'dbdi/util';

import { EmptyObject, EmptyArray } from 'src/util';

import map from 'lodash/map';
import isEmpty from 'lodash/isEmpty';
import pickBy from 'lodash/pickBy';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import autoBind from 'react-autobind';

import {dataBind} from 'dbdi/react';

import Moment from 'react-moment';
import {
  Alert, Button, Badge,
  Panel
} from 'react-bootstrap';
import Flexbox from 'flexbox-react';

import Form from 'react-jsonschema-form';
import Select from 'react-select';

import LoadIndicator from 'src/views/components/util/LoadIndicator';
import ConfirmModal from 'src/views/components/util/ConfirmModal';
import UserList from 'src/views/components/users/UserList';
import UserBadge from 'src/views/components/users/UserBadge';

import {
  FAIcon
} from 'src/views/components/util';


// ###################################################################
// UserListEditor
// ###################################################################

// // eslint-disable-next-line react/prop-types
// function DeleteUserButton({ open }) {
//   return (<Button onClick={open} bsSize="small"
//     className="color-red no-padding">
//     <FAIcon name="trash" />
//   </Button>);
// }
// <ConfirmModal
// header="Delete user from project?"
// ButtonCreator={DeleteUserButton}
// onConfirm={deleteUser}
// >
// <UserBadge uid={uid} size="tiny" />
// </ConfirmModal>

const ExistingUserEl = dataBind({
  deleteUser(evt, { uid, thisProjectId }, { deleteUserFromProject }) {
    return deleteUserFromProject({ uid, projectId: thisProjectId });
  }
})(
  ({ uid }, { deleteUser }) => {
    return (<Badge>
      <span className="user-tag">
        <UserBadge uid={uid} size="tiny" /> &nbsp;
        <Button onClick={deleteUser} bsSize="small"
          className="color-red no-padding">
          <FAIcon name="trash" />
        </Button>
      </span>
    </Badge>);
  });

// // eslint-disable-next-line react/prop-types
// function AddUserButton({ open }) {
//   return (<Button onClick={open}
//     className="color-green no-padding"
//     bsSize="small">
//     <FAIcon name="plus" />
//   </Button>);
// }
// <ConfirmModal
//   header="Delete user from project?"
//   ButtonCreator={AddUserButton}
//   onConfirm={addUser}
// >
//   <UserBadge uid={uid} size="tiny" />
// </ConfirmModal>

const AddUserEl = dataBind({
  addUser(evt, { uid, thisProjectId }, { addUserToProject }) {
    return addUserToProject({ uid, projectId: thisProjectId });
  }
})(
  ({ uid }, { addUser }) => {
    return (<Badge>
      <span className="user-tag">
        <UserBadge uid={uid} size="tiny" /> &nbsp;

        <Button onClick={addUser}
          className="color-green no-padding"
          bsSize="small">
          <FAIcon name="plus" />
        </Button>
      </span>
    </Badge>);
  }
);


const ProjectUserList = dataBind({})(function ProjectUserList(
  { userFn, emptyText },
  { }
) {
  const addableUids = userFn();
  if (addableUids !== NOT_LOADED) {
    if (isEmpty(addableUids)) {
      return (
        <Alert bsStyle="warning" className="no-padding">
          {emptyText}
        </Alert>
      );
    }
    else {
      return (
        <UserList uids={addableUids}
          renderUser={AddUserEl} />
      );
    }
  }
  else {
    return <LoadIndicator block />;
  }
});


const noMarginStyle = {
  margin: '0 !important'
};

@dataBind({
  getAllUidsWithProjectButNotInCurrent(
    { projectId },
    { uidsWithProjectButNotIn }
  ) {
    return uidsWithProjectButNotIn({ projectId });
  }
})
export default class ProjectUserEditor extends Component {
  constructor(...args) {
    super(...args);

    this.state = {
      addAllUsers: false
    };
  }

  toggleAddAllUsers = () => {
    this.setState({
      addAllUsers: !this.state.addAllUsers
    });
  };

  render(
    { projectId },
    { uidsOfProject, uidsWithoutProject, getAllUidsWithProjectButNotInCurrent },
    { }
  ) {
    const {
      addAllUsers
    } = this.state;

    let existingUsersEl;
    if (uidsOfProject.isLoaded({ projectId })) {
      const existingUids = Object.keys(uidsOfProject({ projectId }));
      if (isEmpty(existingUids)) {
        existingUsersEl = (<Alert bsStyle="warning" className="no-padding">no users in team</Alert>);
      }
      else {
        existingUsersEl = (
          <UserList uids={existingUids}
            renderUser={ExistingUserEl} />
        );
      }
    }
    else {
      existingUsersEl = <LoadIndicator block />;
    }

    return (<Flexbox flexDirection="row" justifyContent="flex-start" alignItems="stretch"
      className="full-width">
      <Flexbox flex="20" alignItems="stretch" className="full-width">
        <Panel className="full-width full-height no-margin" style={noMarginStyle}>
          <Panel.Heading>
            Remove user from project
          </Panel.Heading>
          <Panel.Body>
            {existingUsersEl}
          </Panel.Body>
        </Panel>
      </Flexbox>
      <Flexbox flex="1" />
      <Flexbox flex="20" className="full-width" flexDirection="column" alignItems="stretch">
        <Panel header="">
          <Panel.Heading>
            Users w/o project
          </Panel.Heading>
          <Panel.Body>
            <ProjectUserList emptyText="no users without project"
              userFn={uidsWithoutProject} />
          </Panel.Body>
        </Panel>
        <Panel className="no-margin">
          <Panel.Heading>
            <Button onClick={this.toggleAddAllUsers} active={addAllUsers}>
              <FAIcon name="users" /> Show users with projects
            </Button>
          </Panel.Heading>
          <Panel.Body>
            {addAllUsers && (<div>
              <ProjectUserList emptyText="no users with project"
                userFn={getAllUidsWithProjectButNotInCurrent} />
            </div>)}
          </Panel.Body>
        </Panel>
      </Flexbox>
    </Flexbox>);
  }
}
