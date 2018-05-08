import map from 'lodash/map';
import size from 'lodash/size';

import { NOT_LOADED } from 'src/dbdi';

import React, { Component } from 'react';
import dataBind from 'src/dbdi/react/dataBind';

import {
  Button, Alert, Panel
} from 'react-bootstrap';
import Flexbox from 'flexbox-react';

import PresentationTable from './PresentationTable';
import { LoadOverlay } from '../overlays';

const itemsPerPage = 20;

const PresentationSessionRow = dataBind(function PresentationSessionRow(
  { presentationSessionId }
) {
  return (<Flexbox>
    <Flexbox>
      { presentationSessionId }
    </Flexbox>
  </Flexbox>);
});


@dataBind()
export default class PresentationSessionList extends Component {
  state = { page: 0 };

  nextPage = () => {
    this.setPage(this.state.page + 1);
  }

  render({ }, { sortedPresentationSessionsIdsOfPage }) {
    const { page } = this.state;
    const ids = sortedPresentationSessionsIdsOfPage(page);
    const itemsTitle = 'Sessions';

    if (ids === NOT_LOADED) {
      return <LoadOverlay />;
    }

    const nItems = size(ids);
    const count0 = (page - 1) * itemsPerPage + 1;
    const count1 = Math.min(nItems, page * itemsPerPage);

    return (<div>
      <Panel>
        <Panel.Heading>
          {itemsTitle} ({count0}-{count1} of {nItems})
        </Panel.Heading>
        <Panel.Body className="no-margin">
          {
            map(ids, id => <PresentationSessionRow presentationSessionId={id} />)
          }
        </Panel.Body>
      </Panel>

      <Button disabled={nItems < page * itemsPerPage}
        onClick={this.nextPage} block>
        more...
      </Button>
    </div>);
  }
}
