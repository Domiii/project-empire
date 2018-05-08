import React, { Component, Fragment } from 'react';


import map from 'lodash/map';
import size from 'lodash/size';
import mapValues from 'lodash/mapValues';

import dataBind, { NOT_LOADED } from '../../../dbdi/react/dataBind';

import {
  Button, Alert, Panel, Table
} from 'react-bootstrap';
import Moment from 'react-moment';

import ImageLoader from 'src/views/components/util/react-imageloader';
import LoadIndicator from 'src/views/components/util/LoadIndicator';
import { EmptyObject } from '../../../util';

// https://github.com/atlassian/react-beautiful-dnd/blob/master/stories/src/table/with-fixed-columns.jsx

export default class PresentationsTable extends Component {
  render() {
    return (<Table striped bordered condensed hover>
      <thead>
        <tr>
          <th>#</th>
          <th>First Name</th>
          <th>Last Name</th>
          <th>Username</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td>Mark</td>
          <td>Otto</td>
          <td>@mdo</td>
        </tr>
        <tr>
          <td>2</td>
          <td>Jacob</td>
          <td>Thornton</td>
          <td>@fat</td>
        </tr>
        <tr>
          <td>3</td>
          <td colSpan="2">Larry the Bird</td>
          <td>@twitter</td>
        </tr>
      </tbody>
    </Table>);
  }
}