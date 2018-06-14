import isEmpty from 'lodash/isEmpty';
import map from 'lodash/map';
import mapValues from 'lodash/mapValues';
import size from 'lodash/size';
import sortBy from 'lodash/sortBy';
import groupBy from 'lodash/groupBy';
import zipObject from 'lodash/zipObject';

import { EmptyObject, EmptyArray } from 'src/util';

import Roles, { hasRole } from 'src/core/users/Roles';

import React, { Component } from 'react';
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
  defaultSorted: [{
    dataField: 'fullName',
    order: 'desc'
  }],

  cellEdit: cellEditFactory({ mode: 'click' })
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

    this.tableProps = Object.assign({}, __defaultProps);

    // assign renderers
    this.tableProps.columns.forEach(col => col.formatter = this['render_' + col.dataField]);

    // assign editor hooks
    this.tableProps.beforeSaveCell = this.beforeSaveCell;
    this.tableProps.afterSaveCell = this.afterSaveCell;

    this.dataBindMethods('componentDidMount');
  }

  componentDidMount(
    { },
    { userEmail }
  ) {
    this.customTableData = {
      email: (uid) => userEmail({ uid })
    };
  }

  render_photoURL(cell, row, rowIndex, formatExtraData) {
    // const {
    //   title,
    //   iconUrl
    // } = row;
    const { id } = row;

    return (<span>
      <UserIcon uid={id} size="2em" />
    </span>);
  }

  render_fullName(cell, row, rowIndex, formatExtraData) {
    // const {
    //   title,
    //   iconUrl
    // } = row;
    return (<span>
      {cell}
    </span>);
  }

  render_email(cell, row, rowIndex, formatExtraData) {
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

  // render_displayName(cell, row, rowIndex, formatExtraData) {

  // }

  render_lastLogin(cell, row, rowIndex, formatExtraData) {
    if (!cell) {
      return <span className="color-gray">(unknown)</span>;
    }
    return (<span>
      <Moment fromNow>{cell}</Moment> (
      <Moment format="MMMM Do YYYY">{cell}</Moment>
      )
    </span>);
  }

  render_role(cell, row, rowIndex, formatExtraData) {
    return (<span>
      {cell || 0}
    </span>);
  }

  beforeSaveCell = (oldValue, newValue, row, column) => {
    // TODO: save user data
  }

  afterSaveCell = (oldValue, newValue, row, column) => {
  }

  // render_role(cell, row, rowIndex, formatExtraData) {

  // }

  render(
    { },
    { usersOfCohort }
  ) {
    // TODO: cohorts
    const cohortId = 1;
    const list = usersOfCohort({ cohortId });

    if (list === NOT_LOADED) {
      return <LoadIndicator block message="loading users..." />;
    }
    const data = convertToTableData(list, this.customTableData);

    return (<div className="default-width">
      <BootstrapTable
        data={data}
        {...this.tableProps} />
    </div>);
  }
}


@dataBind({})
export default class UserManager extends Component {
  state = {
    expanded: false
  };

  toggleExpand = () => {
    const { expanded } = this.state;
    this.setState({ expanded: !expanded });
  }

  onSelect = (fileId) => {
    this.setState({ selectedId: fileId });
  }

  render(
    { },
    { },
    { isCurrentUserAdmin, usersPublic_isLoaded }
  ) {
    if (!usersPublic_isLoaded) {
      return <LoadIndicator />;
    }
    if (!isCurrentUserAdmin) {
      return (
        <Alert bsStyle="warning">GM only</Alert>
      );
    }


    const { expanded } = this.state;

    return (<Panel expanded={expanded} onToggle={this.toggleExpand}>
      <Panel.Heading>
        <FancyPanelToggleTitle>
          Users
        </FancyPanelToggleTitle>
      </Panel.Heading>
      <Panel.Body collapsible>
        <div>{expanded &&
          <UserTable />
          || <div className="margin10" />
        }</div>
      </Panel.Body>
    </Panel>);
  }
}