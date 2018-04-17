import map from 'lodash/map';

import { hasDisplayRole } from 'src/core/users/Roles';

import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import autoBind from 'react-autobind';

import dataBind from 'src/dbdi/react/dataBind';

import {
  ButtonProject, Button
} from 'react-bootstrap';

import FAIcon from 'src/views/components/util/FAIcon';

import ConfirmModal, {
  DefaultButtonCreator
} from 'src/views/components/util/ConfirmModal';
import { EmptyObject } from '../../../util';

const ProjectDescription = dataBind()(
  ({ projectId }, { projectById, uidsOfProject, userDisplayName }, { }) => {
    const project = projectById({ projectId });

    if (!project) {
      return (<span>???</span>);
    }

    const uids = Object.keys(uidsOfProject({ projectId }) || EmptyObject);

    const {
      title
    } = project;

    const usersString = map(uids, uid => userDisplayName({ uid }) || '?').join(', ');
    const projectDescription = `${title} (${usersString})`;
    return (<span> {projectDescription} </span>);
  }
);

@dataBind({
})
export default class ProjectEditTools extends PureComponent {
  static propTypes = {
    projectId: PropTypes.string.isRequired,

    changeOrder: PropTypes.func,

    editing: PropTypes.bool,
    toggleEdit: PropTypes.func.isRequired
  };

  constructor(...args) {
    super(...args);

    this.dataBindMethods(
      this.deleteButton
    );
  }

  // changeOrderUp() {
  //   const { projectId, changeOrder } = this.props;

  //   changeOrder(projectId, -1);
  // }

  // changeOrderDown() {
  //   const { projectId, changeOrder } = this.props;

  //   changeOrder(projectId, 1);
  // }

  // changeOrderButtons() {
  //   const { changeOrder } = this.props;
  //   if (!changeOrder) return null;

  //   return (<ButtonProject>
  //     <Button onClick={this.changeOrderUp}
  //       className="" bsSize="small" >
  //       <FAIcon name="caret-square-o-left" />
  //     </Button>
  //     <Button onClick={this.changeOrderDown}
  //       className="" bsSize="small" >
  //       <FAIcon name="caret-square-o-right" />
  //     </Button>
  //   </ButtonProject>);
  // }

  editButton = () => {
    const { editing, toggleEdit } = this.props;
    return (
      <Button onClick={toggleEdit}
        className="" bsSize="small" active={editing}>
        <FAIcon name="edit" />
      </Button>
    );
  }

  deleteButton({ }, { deleteProject }, { }) {
    const {
      projectId
    } = this.props;

    const modalProps = {
      header: 'Delete Project?',
      ButtonCreator: DefaultButtonCreator,
      onConfirm: deleteProject,
      confirmArgs: this.props
    };

    return (
      <ConfirmModal {...modalProps}>
        <ProjectDescription projectId={projectId} />
      </ConfirmModal>
    );
  }

  // togglePublicButton({}, {}) {
  //   const icon = isPublic ? 'unlock' : 'lock';
  //   const className = isPublic ? 'color-green' : 'color-red';
  //   return (
  //     <Button onClick={setPublic(!isPublic)}
  //       className={className} bsSize="small" active={false}>
  //       <FAIcon name={icon} />
  //     </Button>
  //   );
  // }

  render(
    { },
    { },
    { isCurrentUserAdmin }
  ) {
    const { editing } = this.props;

    return (<span className="nowrapper-hidden">
      {/* {this.changeOrderButtons()}
      {this.togglePublicButton()} */}
      {isCurrentUserAdmin && editing && this.deleteButton()}
      {this.editButton()}
    </span>);
  }
}

