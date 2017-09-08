import map from 'lodash/map';
import isEmpty from 'lodash/isEmpty';

import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import autoBind from 'react-autobind';
import Moment from 'react-moment';
import {
  Alert, Button, Badge, ListGroup, ListGroupItem,
  Grid, Row, Col
} from 'react-bootstrap';

import { Flex, Item } from 'react-flex';

import ConfirmModal from 'src/views/components/util/ConfirmModal';
import UserList from 'src/views/components/users/UserList';

import { 
  Field, reduxForm, FormSection
} from 'redux-form';

import { 
  FormInputField, FormInputFieldArray, FAIcon
} from 'src/views/components/util';


class _GroupInfoFormContent extends Component {
  static contextTypes = {
    currentUserRef: PropTypes.object
  };

  static propTypes = {
    groupId: PropTypes.string.isRequired
  };

  render() {
    const { currentUserRef } = this.context;
    const {
      groupId,

      handleSubmit,
      pristine,
      reset, 
      submitting 
    } = this.props;
    
    const isAdmin = currentUserRef && 
      currentUserRef.isAdmin();

    return (<form className="form-horizontal" onSubmit={handleSubmit}>
      <Field name="groupId" value={groupId} component="input" type="hidden" />
      <FormSection name="group">
        <FormInputField name="title_en" label="Title (English)"
          type="text" component="input"
          labelProps={{xs: 2, className: 'no-padding'}}
          inputColProps={{xs: 10, className: 'no-padding'}}
        />
        <FormInputField name="title_zh" label="Title (中文)"
          type="text" component="input"
          labelProps={{xs: 2, className: 'no-padding'}}
          inputColProps={{xs: 10, className: 'no-padding'}}
        />
        <FormInputField name="description_en" label="Description (English)"
          component="textarea"
          inputProps={{rows: '3'}}
          labelProps={{xs: 2, className: 'no-padding'}}
          inputColProps={{xs: 10, className: 'no-padding'}}
        />
        <FormInputField name="description_zh" label="Description (中文)"
          component="textarea"
          inputProps={{rows: '3'}}
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

const _GroupInfoForm = reduxForm({ enableReinitialize: true })(_GroupInfoFormContent);

export const GroupInfoForm = connect(
  (state, { group, groupId }) => {
    return ({
      form: 'group_' + groupId,
      initialValues: {
        group,
        groupId
      },
    });
  }
)(_GroupInfoForm);

function DeleteUserButton({open}) {
  return (<Button onClick={open} bsSize="small"
      className="color-red no-padding">
    <FAIcon name="trash" />
  </Button>);
}
function makeExistingUserEl(deleteUserFromGroup) {
  return ({user, uid}) => (<Badge>
    <span className="user-tag">
      <img src={user.photoURL} className="user-image-tiny" /> &nbsp;
      {user.displayName} &nbsp;
      <ConfirmModal
        header="Delete user from group?"
        body={(<span>{user.displayName}</span>)}
        ButtonCreator={DeleteUserButton}
        onConfirm={deleteUserFromGroup}
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
function makeAddUserEl(addUserToGroup) {
  return ({user, uid}) => (<Badge>
    <span className="user-tag">
      <img src={user.photoURL} className="user-image-tiny" /> &nbsp;
      {user.displayName} &nbsp;

      <ConfirmModal
        header="Add user to group?"
        body={(<span>{user.displayName}</span>)}
        ButtonCreator={AddUserButton}
        onConfirm={addUserToGroup}
        confirmArgs={uid}
      />
    </span>
  </Badge>);
}

export function GroupUserEditor({
  existingUsers,
  addableUsers,

  deleteUserFromGroup,
  addUserToGroup
}) {
  return (<Flex row={true} alignItems="start">
    <Item>
      <UserList users={existingUsers} 
          renderUser={makeExistingUserEl(deleteUserFromGroup)} />
    </Item>
    <Item>
      <UserList users={addableUsers} 
          renderUser={makeAddUserEl(addUserToGroup)} />
    </Item>
  </Flex>);
}



export default class GroupEditor extends Component {
  static propTypes = {
    groupId: PropTypes.string.isRequired,
    group: PropTypes.object.isRequired,
    existingUsers: PropTypes.object.isRequired,
    addableUsers: PropTypes.object.isRequired,

    setGroup: PropTypes.func.isRequired,
    addUserToGroup: PropTypes.func.isRequired,
    deleteUserFromGroup: PropTypes.func.isRequired
  };

  constructor() {
    super();

    autoBind(this);
  }


  addUserToGroup(uid) {
    const {
      groupId,
      addUserToGroup
    } = this.props;

    return addUserToGroup({
      user: uid,
      group: groupId
    });
  }

  deleteUserFromGroup(uid) {
    const {
      groupId,
      deleteUserFromGroup
    } = this.props;

    return deleteUserFromGroup({
      user: uid,
      group: groupId
    });
  }

  render() {
    const {
      groupId,
      group,
      existingUsers,
      addableUsers,

      setGroup
    } = this.props;


    return (
      <div>
        <GroupInfoForm 
          onSubmit={ setGroup }
          {...{ group, groupId }}
        />

        <GroupUserEditor {...{
          existingUsers,
          addableUsers,

          addUserToGroup: this.addUserToGroup,
          deleteUserFromGroup: this.deleteUserFromGroup
        }} />
      </div>
    );
  }
}