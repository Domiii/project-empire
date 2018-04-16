
import { getOptionalArgument } from 'src/dbdi/dataAccessUtil';

import { EmptyObject, EmptyArray } from 'src/util';

import map from 'lodash/map';
import isEmpty from 'lodash/isEmpty';
import pickBy from 'lodash/pickBy';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import autoBind from 'react-autobind';

import dataBind, { NOT_LOADED } from 'src/dbdi/react/dataBind';

import Moment from 'react-moment';
import {
  Alert, Button, Badge,
  Panel
} from 'react-bootstrap';
import Flexbox from 'flexbox-react';

import Form from 'react-jsonschema-form';
import Select from 'react-select';

import LoadIndicator from 'src/views/components/util/loading';
import ConfirmModal from 'src/views/components/util/ConfirmModal';
import UserList from 'src/views/components/users/UserList';
import UserBadge from 'src/views/components/users/UserBadge';

import {
  FAIcon
} from 'src/views/components/util';


// ##########################################################################
// Data Schema of our Form
// (as defined by `react-jsonschema-form` library)
// ##########################################################################

const FormSchema = {
  'title': '',
  'description': '',
  'type': 'object',
  'required': [
    //'missionId'
  ],
  'properties': {
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
  //mission: MissionSelect
};

const FormUISchema = {
  // missionId: {
  //   'ui:autofocus': true,
  //   'ui:widget': 'mission'
  // },
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

@dataBind({
  getAllUidsWithProjectButNotInCurrent(
    { projectId },
    { uidsWithProjectButNotIn }
  ) {
    return uidsWithProjectButNotIn({ projectId });
  }
})
export class ProjectUserEditor extends Component {
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
        <Panel className="full-width full-height">
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


@dataBind({
  /**
   * DI-decorated action: create or update item
   */
  onSubmit({ formData }, vars,
    { set_projectById, push_projectById }, { }) {
    // get required and optional arguments
    const { projectId } = vars;
    const onSave = getOptionalArgument(vars, 'onSave');

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
            <p><label>edit users</label></p>
            {projectId && <ProjectUserEditor
              setContext={{ thisProjectId: projectId }}
              projectId={projectId} />}

            <button type="submit" className="btn btn-info">
              <FAIcon name="save" /> {alreadyExists ? 'Update' : 'Add new'}
            </button>
          </div>
        </Form>
      </div>
    );
  }
}