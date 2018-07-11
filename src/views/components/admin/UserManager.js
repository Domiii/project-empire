import isEmpty from 'lodash/isEmpty';
import map from 'lodash/map';
import mapValues from 'lodash/mapValues';
import pickBy from 'lodash/pickBy';
import size from 'lodash/size';

import { EmptyObject, EmptyArray } from 'src/util';

import Roles, { hasRole } from 'src/core/users/Roles';

import React, { Component, Fragment as F } from 'react';
import PropTypes from 'prop-types';
import dataBind, { NOT_LOADED } from '../../../dbdi/react/dataBind';

import autoBind from 'react-autobind';

import {
  Panel, Button, ListGroup, ListGroupItem, Alert, Badge
} from 'react-bootstrap';
import Moment from 'react-moment';

import BootstrapTable from 'react-bootstrap-table-next';
import cellEditFactory from 'react-bootstrap-table2-editor';
//import paginationFactory from 'react-bootstrap-table2-paginator';

import ConfirmModal from 'src/views/components/util/ConfirmModal';
import FAIcon from 'src/views/components/util/FAIcon';
import LoadIndicator from 'src/views/components/util/LoadIndicator';

//import UserList from 'src/views/components/users/UserList';
import UserIcon from 'src/views/components/users/UserIcon';

import FancyPanelToggleTitle from 'src/views/components/util/FancyPanelToggleTitle';




const __defaultProps = {
  keyField: 'id',
  condensed: true,
  columns: [
    {
      dataField: 'id',
      text: ' ',
      hidden: true
    },
    {
      dataField: 'photoURL',
      text: '',
      classes: 'min',
      headerClasses: 'min',
      sort: false
    },
    {
      dataField: 'fullName',
      text: 'Full Name',
      sort: true
    },
    {
      dataField: 'displayName',
      text: 'User',
      // classes: 'min',
      // headerClasses: 'min',
      sort: true
    },
    {
      dataField: 'email',
      text: 'email',
      // classes: 'min',
      // headerClasses: 'min',
      sort: true,
      editable: false
    },
    {
      dataField: 'lastLogin',
      text: 'Last Login',
      classes: 'min',
      headerClasses: 'min',
      sort: true,
      editable: false
    },
    {
      dataField: 'role',
      text: 'R',
      classes: 'min',
      headerClasses: 'min',
      sort: true,
      editable: false
    }
    // {
    //   dataField: 'contributors',
    //   text: 'Contributors'
    // }
  ],
  defaultSorted: [
    {
      dataField: 'role',
      order: 'desc'
    },
    {
      dataField: 'lastLogin',
      order: 'desc'
    }
  ]
  // remote: {
  //   pagination: true,
  //   sort: true
  // },
  // overlay: overlayFactory({
  //   spinner: true,
  //   background: 'rgba(192,192,192,0.3)'
  // }),
};

function convertToTableData(objects, customTableData) {
  return map(objects, (o, id) => ({
    // a table row object must have an id
    id,

    // the actual data
    ...o,

    // custom data must be looked up and merged 
    ...mapValues(customTableData, fn => fn(id, o))
  }));
}

@dataBind({

})
export class UserTable extends Component {
  state = {
  };

  constructor(props) {
    super(props);

    this.dataBindMethods(
      'componentDidMount',
      'afterSaveCell'
    );

    this.tableProps = Object.assign({}, __defaultProps);

    // assign renderers
    this.tableProps.columns.forEach(col => col.formatter = this['render_' + col.dataField]);

    // editor settings + hooks
    // see: https://react-bootstrap-table.github.io/react-bootstrap-table2/docs/cell-edit-props.html#celleditbeforesavecell-function
    this.tableProps.cellEdit = cellEditFactory({
      mode: 'click',
      beforeSaveCell: this.beforeSaveCell,
      afterSaveCell: this.afterSaveCell
    });
  }

  componentDidMount(
    { },
    { userEmail }
  ) {
    this.customTableData = {
      email: (uid) => userEmail({ uid })
    };
  }

  render_photoURL = (cell, row, rowIndex, formatExtraData) => {
    // const {
    //   title,
    //   iconUrl
    // } = row;
    const { id } = row;

    return (<span>
      <UserIcon uid={id} size="2em" />
    </span>);
  }

  render_fullName = (cell, row, rowIndex, formatExtraData) => {
    return (<span>
      {cell}
    </span>);
  }

  render_email = (cell, row, rowIndex, formatExtraData) => {
    // const {
    //   title,
    //   iconUrl
    // } = row;
    if (cell === NOT_LOADED) {
      return <LoadIndicator />;
    }
    return (<span>
      {cell}
    </span>);
  }

  // render_displayName = (cell, row, rowIndex, formatExtraData) => {

  // }

  render_lastLogin = (cell, row, rowIndex, formatExtraData) => {
    if (!cell) {
      cell = row.createdAt;
      if (!cell) {
        return <span className="color-gray">(unknown)</span>;
      }
    }
    return (<span>
      <Moment fromNow>{cell}</Moment> (
      <Moment format="MMMM Do YYYY">{cell}</Moment>
      )
    </span>);
  }

  render_role = (cell, row, rowIndex, formatExtraData) => {
    return (<span>
      {cell || 0}
    </span>);
  }

  // beforeSaveCell = (oldValue, newValue, user, column) => {
  //   console.warn('beforeSaveCell', oldValue, newValue, user, column);
  // }

  afterSaveCell = async (oldValue, newValue, user, column,
    { },
    { update_user }
  ) => {
    const uid = user.id;
    const prop = column.dataField;
    //console.warn('afterSaveCell', oldValue, newValue, user, column);

    const upd = { [prop]: newValue };
    await update_user({ uid }, upd);

    // prompt a re-render
    this.setState({});
  }

  // render_role(cell, row, rowIndex, formatExtraData) {

  // }

  toggleExpand = () => {
    const { expanded } = this.state;
    this.setState({ expanded: !expanded });
  }

  render(
    { title, predicate, collapsible },
    { usersOfCohort }
  ) {
    // TODO: cohorts
    const cohortId = 1;

    let list = usersOfCohort({ cohortId });
    list = predicate && pickBy(list, predicate) || list;

    if (list === NOT_LOADED) {
      return <LoadIndicator block message="loading users..." />;
    }
    const data = convertToTableData(list, this.customTableData);

    let header = <span>{title} ({size(list)})</span>;

    let tableBody = (<div className="default-width">
      <BootstrapTable
        data={data}
        {...this.tableProps} />
    </div>);

    if (collapsible) {
      header = (<FancyPanelToggleTitle>
        {header}
      </FancyPanelToggleTitle>);

      tableBody = (<div>{this.state.expanded && tableBody
        || <div className="margin10" />
      }</div>);
    }

    return (<Panel expanded={this.state.expanded} onToggle={this.toggleExpand}>
      <Panel.Heading>
        {header}
      </Panel.Heading>
      <Panel.Body collapsible={collapsible}>
        {tableBody}
      </Panel.Body>
    </Panel>);
  }
}


@dataBind({
  clickRegisterAllUnregisteredUsers(evt,
    { },
    { registerAllUnregisteredUsers }
  ) {
    return registerAllUnregisteredUsers();
  }
})
export default class UserManager extends Component {
  state = {
    expanded: false
  };

  constructor(p) {
    super(p);

    this._newUsersPredicate = u => !u.role || u.role <= Roles.Unregistered;
    this._oldUsersPredicate = u => u.role > Roles.Unregistered;
  }

  onSelect = (fileId) => {
    this.setState({ selectedId: fileId });
  }

  render(
    { },
    { clickRegisterAllUnregisteredUsers },
    { isCurrentUserAdmin, usersPublic_isLoaded, unregisteredUids }
  ) {
    if (!usersPublic_isLoaded) {
      return <LoadIndicator />;
    }
    if (!isCurrentUserAdmin) {
      return (
        <Alert bsStyle="warning">GM only</Alert>
      );
    }

    const nUnregistered = size(unregisteredUids);

    return (<F>
      <Button bsStyle="danger" disabled={!nUnregistered} 
        onClick={clickRegisterAllUnregisteredUsers}>
        Register All ({nUnregistered})
      </Button>
      <UserTable title="New Users" predicate={this._newUsersPredicate} collapsible={false} />
      <UserTable title="Users" predicate={this._oldUsersPredicate} collapsible={true} />
    </F>);
  }
}