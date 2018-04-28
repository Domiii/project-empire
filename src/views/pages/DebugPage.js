import map from 'lodash/map';
import isString from 'lodash/isString';

import { errorLog } from 'src/util/debugUtil';

import React, { Component } from 'react';

import Moment from 'react-moment';
import {
  Alert, Button, Panel
} from 'react-bootstrap';
import Flexbox from 'flexbox-react';

const nItemsPerPage = 20;

function errToString(obj) {
  if (isString(obj)) {
    return obj;
  }
  if (obj) {
    if (obj instanceof Error) {
      return obj.stack || obj;
    }
  }
  return JSON.stringify(obj, null, 2);
}

export default class DebugPage extends Component {
  state = {
    page: 0
  };

  nPages = () => {
    return Math.max(1, errorLog.length / nItemsPerPage);
  }

  nextPage = () => {
    let { page } = this.state;
    const nPages = this.nPages();
    page = Math.min(nPages - 1, page + 1);
    this.setState({ page });
  }

  previousPage = () => {
    let { page } = this.state;
    page = Math.max(0, page - 1);
    this.setState({ page });
  }


  render() {
    const { page } = this.state;
    const from = page * nItemsPerPage;
    const to = (page + 1) * nItemsPerPage - 1;
    return (<Panel bsStyle="danger">
      <Panel.Heading>
        <Panel.Title>
          {errorLog.length} Errors (page {page + 1}/{Math.ceil(this.nPages())}) &nbsp;
          <Button onClick={this.previousPage}>←</Button>
          <Button onClick={this.nextPage}>→</Button>
        </Panel.Title>
      </Panel.Heading>
      <Panel.Body>
        {map(errorLog.slice(from, to + 1), (err, i) => (
          <Flexbox key={i} flexDirection="row" justifyContent="flex-start" alignItems="center"
            className="full-width">
            <Flexbox>
              [<Moment format="HH:mm:ss">{err.time}</Moment>]
            </Flexbox>
            <Flexbox className="full-width">
              &nbsp;
              <Alert bsStyle="danger" className="no-padding no-margin">
                {map(err.args, (obj, j) => (<span key={j}>
                  <pre className="no-padding no-margin no-background inline">
                    {errToString(obj)}
                  </pre>
                  &nbsp;
                </span>))}
              </Alert>
            </Flexbox>
          </Flexbox>
        ))}
      </Panel.Body>
    </Panel>);
  }
}