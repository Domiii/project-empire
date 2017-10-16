

import { EmptyObject, EmptyArray } from 'src/util';

import map from 'lodash/map';
import isEmpty from 'lodash/isEmpty';
import pickBy from 'lodash/pickBy';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import autoBind from 'react-autobind';

import dataBind from 'src/dbdi/react/dataBind';

import Moment from 'react-moment';
import {
  Alert, Button, Badge
} from 'react-bootstrap';

import Form from 'react-jsonschema-form';
import Select from 'react-select';
import { Flex, Item } from 'react-flex';

import LoadIndicator from 'src/views/components/util/loading';
import ConfirmModal from 'src/views/components/util/ConfirmModal';
import UserList, { UserBadge } from 'src/views/components/users/UserList';
import UserIcon from 'src/views/components/users/UserIcon';

import {
  FAIcon
} from 'src/views/components/util';



// ##########################################################################
// MissionSelect component to select missions
// ##########################################################################

export const MissionSelect = dataBind({
  missionOptions({ }, { }, { allMissions }) {
    return allMissions && map(allMissions, (mission, missionId) => ({
      value: missionId,
      label: `${mission.code} - ${mission.title}`
    }));
  },
  onChangeOption(option, { onChange }, { }, { allMissions }) {
    let missionId = option && option.value;
    if (!allMissions[missionId]) {
      missionId = null;
    }
    onChange(missionId);
  }
})(({ value }, { onChangeOption, missionOptions }, { allMissions_isLoaded }) => {
  if (!allMissions_isLoaded) {
    return <LoadIndicator block message="loading missions..." />;
  }

  const options = missionOptions();
  return (<Select
    value={value}
    placeholder="select mission"
    options={options}
    onChange={onChangeOption}
  />);
});

// ##########################################################################
// Data Schema of our Form
// (as defined by `react-jsonschema-form` library)
// ##########################################################################

const FormSchema = {
  'title': '',
  'description': '',
  'type': 'object',
  'required': [
    'missionId'
  ],
  'properties': {
    'missionId': {
      'type': 'string',
      'title': 'Mission'
    },
    'reviewerUid': {
      'type': 'string',
      'title': 'Reviewer (GM)'
    },
    'guardianUid': {
      'type': 'string',
      'title': 'Guardian'
    },
    'createdAt': {
      'type': 'number',
      'title': 'Started'
    },
    'guardianNotes': {

    }
  }
};

// ##########################################################################
// UI Schema for displaying our form
// (as defined by `react-jsonschema-form` library)
// ##########################################################################

const widgets = {
  momentTime({ value }) {
    return (!value && <span /> || <span>
      <Moment fromNow>{value}</Moment> (
        <Moment format="MMMM Do YYYY, hh:mm:ss">{value}</Moment>)
    </span>);
  },
  user({ value }) {
    return (value &&
      <UserBadge uid={value} /> ||
      <span className="color-lightgray">無</span>);
  },
  mission: MissionSelect
};

const FormUISchema = {

  missionId: {
    'ui:autofocus': true,
    'ui:widget': 'mission'
  },
  createdAt: {
    'ui:readonly': true,
    'ui:widget': 'momentTime'
  },
  guardianUid: {
    'ui:readonly': true,
    'ui:widget': 'user'
  },
  reviewerUid: {
    'ui:readonly': true,
    'ui:widget': 'user'
  },
  guardianNotes: {
    'ui:widget': 'textarea',
    'ui:placeholder': '冒險者有沒有提出疑問或是對 Guardian 不友善？',
    'ui:options': {
      rows: 3
    }
  }
};

// ##########################################################################
// ProjectEditor
// ##########################################################################

// eslint-disable-next-line react/prop-types
function DeleteUserButton({ open }) {
  return (<Button onClick={open} bsSize="small"
    className="color-red no-padding">
    <FAIcon name="trash" />
  </Button>);
}

const ExistingUserEl = dataBind({
  deleteUser({ uid }, { deleteUserFromProject }) {
    return deleteUserFromProject({ uid });
  }
})(
  ({ uid }, { deleteUser }) => {
    return (<Badge>
      <span className="user-tag">
        <UserBadge uid={uid} size="tiny" /> &nbsp;

        <ConfirmModal
          header="Delete user from project?"
          ButtonCreator={DeleteUserButton}
          onConfirm={deleteUser}
        >
          <UserBadge uid={uid} size="tiny" />
        </ConfirmModal>
      </span>
    </Badge>);
  });

// eslint-disable-next-line react/prop-types
function AddUserButton({ open }) {
  return (<Button onClick={open}
    className="color-green no-padding"
    bsSize="small">
    <FAIcon name="plus" />
  </Button>);
}

const AddUserEl = dataBind({
  addUser({ uid }, { addUserToProject }) {
    return addUserToProject({ uid });
  }
})(
  ({ uid }, { addUser }) => {
    return (<Badge>
      <span className="user-tag">
        <UserBadge uid={uid} size="tiny" /> &nbsp;

        <ConfirmModal
          header="Delete user from project?"
          ButtonCreator={AddUserButton}
          onConfirm={addUser}
        >
          <UserBadge uid={uid} size="tiny" />
        </ConfirmModal>
      </span>
    </Badge>);
  });

export const ProjectUserEditor = dataBind({


})(
  ({ projectId }, { uidsOfProject, uidsWithoutProject }, { }) => {
    let existingUsersEl, addableUsersEl;
    if (uidsOfProject.isLoaded({ projectId })) {
      const existingUids = Object.keys(uidsOfProject({ projectId }));
      existingUsersEl = (
        <UserList uids={existingUids}
          renderUser={ExistingUserEl} />
      );
    }
    else {
      existingUsersEl = <LoadIndicator block />;
    }

    if (uidsWithoutProject.isLoaded()) {
      addableUsersEl = (
        <UserList uids={uidsWithoutProject()}
          renderUser={AddUserEl} />
      );
    }
    else {
      addableUsersEl = <LoadIndicator block />;
    }

    return (<Flex row={true} alignItems="start">
      <Item>
        {existingUsersEl}
      </Item>
      <Item>
        {addableUsersEl}
      </Item>
    </Flex>);
  }
  );


@dataBind({
  /**
   * DI-decorated action: create or update item
   */
  onSubmit({ formData }, { projectId, onSave },
    { set_projectById, push_projectById }, { }) {

    // get rid of undefined fields, created by (weird) form editor
    formData = pickBy(formData, val => val !== undefined);

    let promise;
    if (!projectId) {
      // new project
      promise = push_projectById(formData);
    }
    else {
      // existing project
      promise = set_projectById({ projectId }, formData);
    }

    // when finished call the onSave callback
    return onSave && promise.then(onSave) || promise;
  }
})
export default class ProjectEditor extends Component {
  static propTypes = {
    projectId: PropTypes.string,
    onSave: PropTypes.func
  };

  constructor() {
    super();

    this.dataBindMethods(
      this.createNewProject
    );
  }

  createNewProject({ }, { }, { currentUid }) {
    return this.newProject = {
      guardianUid: currentUid
    };
  }

  render({ projectId }, { projectById, onSubmit }, { }) {
    const alreadyExists = !!projectId;
    const project = alreadyExists && 
      projectById({ projectId }) ||
      this.createNewProject();

    return (
      <div>
        {/* onChange={itemLog('changed')}
          onError={itemLog('errors')} */}
        <Form schema={FormSchema}
          liveValidate={true}
          uiSchema={FormUISchema}
          widgets={widgets}
          formData={project}
          showErrorList={false}
          onSubmit={onSubmit}
        >
          {/* the Form children are rendered at the bottom of the form */}
          <div>
            <button type="submit" className="btn btn-info">
              <FAIcon name="save" /> {alreadyExists ? 'Update' : 'Add new'}
            </button>
          </div>
        </Form>

        {projectId && <ProjectUserEditor projectId={projectId} />}
      </div>
    );
  }
}