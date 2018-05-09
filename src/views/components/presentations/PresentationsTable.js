import React, { Component, Fragment } from 'react';


import map from 'lodash/map';
import size from 'lodash/size';
import mapValues from 'lodash/mapValues';

import dataBind, { NOT_LOADED } from '../../../dbdi/react/dataBind';

import {
  Button, Alert, Panel, Table
} from 'react-bootstrap';
import Moment from 'react-moment';
import styled from 'styled-components';

import ImageLoader from 'src/views/components/util/react-imageloader';
import LoadIndicator from 'src/views/components/util/LoadIndicator';
import { EmptyObject } from '../../../util';

const StyledTable = styled(Table)`
font-size: 1.5em;
`;

@dataBind()
class PresentationRow extends Component {
  render({ presentation }) {
    const {
      index,
      title,
      userNames,
      status: health,
      presentationStatus
    } = presentation;
    return (
      <tr>
        <td>{index}</td>
        <td>{title}</td>
        <td>{map(userNames, u => '@' + u).join(',  ')}</td>
        <td>{health}</td>
        <td>{presentationStatus}</td>
      </tr>
    );
  }
}

@dataBind({
  // getTableRowData(
  //   { sessionId },
  //   { orderedPresentationsOfSession }
  // ) {
  // }
})
export default class PresentationsTable extends Component {
  render(
    { sessionId },
    { orderedPresentations }
  ) {
    const presentations = orderedPresentations({ sessionId });
    if (presentations === NOT_LOADED) {
      return <LoadIndicator block />;
    }

    return (<StyledTable striped bordered condensed hover>
      <thead>
        <tr>
          <th className="min">#</th>
          <th>Title</th>
          <th>Contributors</th>
          <th className="min">專案狀態</th>
          <th className="min">簡報狀態</th>
        </tr>
      </thead>
      <tbody>
        {
          map(presentations, p => (
            <PresentationRow key={p.id} presentation={p} />
          ))
        }
      </tbody>
    </StyledTable>);
  }
}