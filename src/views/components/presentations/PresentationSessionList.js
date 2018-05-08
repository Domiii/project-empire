import map from 'lodash/map';
import size from 'lodash/size';

import { NOT_LOADED } from 'src/dbdi';

import React, { Component } from 'react';
import dataBind from 'src/dbdi/react/dataBind';

import {
  Button, Alert, Panel, Well
} from 'react-bootstrap';
import Flexbox from 'flexbox-react';

import PresentationTable from './PresentationTable';
import { LoadOverlay } from '../overlays';

const itemsPerPage = 20;

const PresentationSessionRow = dataBind()(function PresentationSessionRow(
  { presentationSessionId }
) {
  return (<Flexbox>
    <Flexbox>
      {presentationSessionId}
    </Flexbox>
  </Flexbox>);
});

const PresentationSessionLiveStatusElement = dataBind()(function PresentationSessionLiveStatusElement(
  { },
  { },
  { livePresentationSessionId }
) {
  if (livePresentationSessionId) {
    // we are currently live in action
    return (<Well className="background-none">
      <Button bsStyle="danger" block>
        Start new session!
      </Button>
    </Well>);
  }
  else {
    // nothing going on, yet!
    return (<Well>
      <Button bsStyle="danger" block>
        Start new session!
      </Button>
    </Well>);
  }
});


@dataBind()
export default class PresentationSessionList extends Component {
  state = { page: 1 };

  nextPage = () => {
    this.setPage(this.state.page + 1);
  }

  render({ }, { sortedPresentationSessionsIdsOfPage }) {
    const { page } = this.state;
    const ids = sortedPresentationSessionsIdsOfPage({ page });
    const itemsTitle = 'Sessions';
    const renderRow = id => <PresentationSessionRow presentationSessionId={id} />;

    if (ids === NOT_LOADED) {
      return <LoadOverlay />;
    }

    const nItems = size(ids);
    const count0 = nItems ? (page - 1) * itemsPerPage + 1 : 0;
    const count1 = Math.min(nItems, page * itemsPerPage);

    return (<div>
      <Panel>
        <Panel.Heading>
          {itemsTitle} ({count0}-{count1} of {nItems})
        </Panel.Heading>
        <Panel.Body className="no-margin">
          <PresentationSessionLiveStatusElement />
          {
            map(ids, renderRow)
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
