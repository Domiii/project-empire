import { hasDisplayRole } from 'src/core/users/Roles';

import autoBind from 'react-autobind';
import React, { PureComponent, PropTypes } from 'react';
import { 
  ButtonAdventure, Button
} from 'react-bootstrap';

import { FAIcon } from 'src/views/components/util';

import ConfirmModal, {
  DefaultButtonCreator
} from 'src/views/components/util/ConfirmModal';

export default class AdventureEditTools extends PureComponent {
  static contextTypes = {
    currentUserRef: PropTypes.object
  };

  static propTypes = {
    adventureId: PropTypes.string.isRequired,
    entryInfo: PropTypes.string,

    changeOrder: PropTypes.func,

    editing: PropTypes.bool,
    toggleEdit: PropTypes.func.isRequired,

    //deleteHeader: PropTypes.string,
    deleteEntry: PropTypes.func.isRequired,

    isPublic: PropTypes.bool,
    setPublic: PropTypes.func,
  };

  constructor(...args) {
    super(...args);

    autoBind(this);
  }

  get IsAdmin() {
    const { currentUserRef } = this.context;
    return currentUserRef && currentUserRef.isAdminDisplayMode() || false;
  }

  changeOrderUp() {
    const { adventureId, changeOrder } = this.props;

    changeOrder(adventureId, -1);
  }

  changeOrderDown() {
    const { adventureId, changeOrder } = this.props;

    changeOrder(adventureId, 1);
  }

  get ChangeOrderButtons() {
    const { changeOrder } = this.props;
    if (!changeOrder) return null;

    return (<ButtonAdventure>
      <Button onClick={this.changeOrderUp}
        className="" bsSize="small" >
        <FAIcon name="caret-square-o-left" />
      </Button>
      <Button onClick={this.changeOrderDown}
        className="" bsSize="small" >
        <FAIcon name="caret-square-o-right" />
      </Button>
    </ButtonAdventure>);
  }

  get EditButton() {
    const { editing, toggleEdit } = this.props;
    return (
      <Button onClick={toggleEdit} 
        className="" bsSize="small" active={editing}>
          <FAIcon name="edit" />
      </Button>
    );
  }

  get DeleteButton() {
    const { 
      adventureId,
      entryInfo, 
      deleteEntry
    } = this.props;

    const modalProps = {
      header: 'Delete Adventure?',
      body: entryInfo,
      ButtonCreator: DefaultButtonCreator,
      onConfirm: deleteEntry,
      confirmArgs: adventureId
    };

    return (
      <ConfirmModal {...modalProps}  />
    );
  }

  get TogglePublicButton() {
    const { setPublic, isPublic } = this.props;
    const icon = isPublic ? 'unlock' : 'lock';
    const className = isPublic ? 'color-green' : 'color-red';
    return (
      <Button onClick={ setPublic(!isPublic) }
        className={className} bsSize="small" active={false}>
          <FAIcon name={icon} />
      </Button>
    );
  }

  render() {
    const styles = {
      whiteSpace: 'nowrap',
      overflow: 'hidden'
    };
    
    return (<span style={styles}>
      { !!this.props.changeOrder && this.ChangeOrderButtons }
      { !!this.props.setPublic && this.TogglePublicButton }
      { this.EditButton }
      { this.IsAdmin && this.DeleteButton }
    </span>);
  }
}

