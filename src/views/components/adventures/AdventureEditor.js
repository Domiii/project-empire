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

import { 
  Field, reduxForm, FormSection
} from 'redux-form';

import { 
  FormInputField,
  FAIcon
} from 'src/views/components/util';


class _AdventureInfoFormContent extends Component {
  static contextTypes = {
    currentUserRef: PropTypes.object
  };

  static propTypes = {
    adventureId: PropTypes.string.isRequired
  };

  render() {
    const { currentUserRef } = this.context;
    const {
      adventureId,

      handleSubmit,
      pristine,
      reset, 
      submitting 
    } = this.props;

    return (<form className="form-horizontal" 
        onSubmit={handleSubmit}>
      <Field name="adventureId" value={adventureId} component="input" type="hidden" />
      <FormSection name="adventure">
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

const _AdventureInfoForm = reduxForm({ enableReinitialize: true })(_AdventureInfoFormContent);

export const AdventureInfoForm = connect(
  (state, { adventure, adventureId }) => {
    return ({
      form: 'adventure_' + adventureId,
      initialValues: {
        adventure,
        adventureId
      },
    });
  }
)(_AdventureInfoForm);

function DeleteUserButton({open}) {
  return (<Button onClick={open} bsSize="small"
      className="color-red no-padding">
    <FAIcon name="trash" />
  </Button>);
}
function makeExistingUserEl(deleteUserFromAdventure) {
  return ({user, uid}) => (<Badge>
    <span className="user-tag">
      <img src={user.photoURL} className="user-image-tiny" /> &nbsp;
      {user.displayName} &nbsp;
      <ConfirmModal
        header="Delete user from adventure?"
        body={(<span>{user.displayName}</span>)}
        ButtonCreator={DeleteUserButton}
        onConfirm={deleteUserFromAdventure}
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
function makeAddUserEl(addUserToAdventure) {
  return ({user, uid}) => (<Badge>
    <span className="user-tag">
      <img src={user.photoURL} className="user-image-tiny" /> &nbsp;
      {user.displayName} &nbsp;

      <ConfirmModal
        header="Add user to adventure?"
        body={(<span>{user.displayName}</span>)}
        ButtonCreator={AddUserButton}
        onConfirm={addUserToAdventure}
        confirmArgs={uid}
      />
    </span>
  </Badge>);
}

export function AdventureUserEditor({
  existingUsers,
  addableUsers,

  deleteUserFromAdventure,
  addUserToAdventure
}) {
  return (<Flex row={true} alignItems="start">
    <Item>
      <UserList users={existingUsers} 
          renderUser={makeExistingUserEl(deleteUserFromAdventure)} />
    </Item>
    <Item>
      <UserList users={addableUsers} 
          renderUser={makeAddUserEl(addUserToAdventure)} />
    </Item>
  </Flex>);
}



export default class AdventureEditor extends Component {
  static propTypes = {
    adventureId: PropTypes.string.isRequired,
    adventure: PropTypes.object.isRequired,
    existingUsers: PropTypes.object.isRequired,
    addableUsers: PropTypes.object.isRequired,

    setAdventure: PropTypes.func.isRequired,
    addUserToAdventure: PropTypes.func.isRequired,
    deleteUserFromAdventure: PropTypes.func.isRequired
  };

  constructor() {
    super();

    autoBind(this);
  }


  addUserToAdventure(uid) {
    const {
      adventureId,
      addUserToAdventure
    } = this.props;

    return addUserToAdventure({
      user: uid,
      adventure: adventureId
    });
  }

  deleteUserFromAdventure(uid) {
    const {
      adventureId,
      deleteUserFromAdventure
    } = this.props;

    return deleteUserFromAdventure({
      user: uid,
      adventure: adventureId
    });
  }

  render() {
    const {
      adventureId,
      adventure,
      existingUsers,
      addableUsers,

      setAdventure
    } = this.props;


    return (
      <div>
        <AdventureInfoForm 
          onSubmit={ setAdventure }
          {...{ adventure, adventureId }}
        />

        <AdventureUserEditor {...{
          existingUsers,
          addableUsers,

          addUserToAdventure: this.addUserToAdventure,
          deleteUserFromAdventure: this.deleteUserFromAdventure
        }} />
      </div>
    );
  }
}