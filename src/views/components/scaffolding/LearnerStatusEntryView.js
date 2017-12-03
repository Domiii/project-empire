import map from 'lodash/map';
import isEmpty from 'lodash/isEmpty';
import size from 'lodash/size';

import { hrefLearnerStatusEntry } from 'src/views/href';

import React from 'react';
import PropTypes from 'prop-types';

import dataBind from 'src/dbdi/react/dataBind';

import Moment from 'react-moment';
import {
  Alert, Button,
  Well, Panel
} from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import Flexbox from 'flexbox-react';

import UserBadge from 'src/views/components/users/UserBadge';
import LoadIndicator from 'src/views/components/util/loading';


//<LearnerStatusEntryView uid={uid} scheduleId={scheduleId} cycleId={cycleId} />

/**
 * Overview of a single learner for one cycle
 */
const LearnerStatusEntryView = dataBind({
  createLearnerEntryClick(evt,
    { uid, scheduleId, cycleId },
    { createLearnerEntry },
    { }
  ) {
    return createLearnerEntry({ uid, scheduleId, cycleId });
  }
})(function LearnerStatusEntryView(
  { uid, learnerEntryId, scheduleId, cycleId },
  { userPublic, createLearnerEntryClick },
  { }
) {
  const userEl = <UserBadge uid={uid} size="small" />;

  let contentEl;
  if (learnerEntryId) {
    // user already has an entry for the cycle
    contentEl = (<div>
      <span className="color-gray">TODO: ProgressBar</span>
      <LinkContainer to={hrefLearnerStatusEntry('edit', uid, scheduleId, cycleId)}>
        <Button bsStyle="warning">
          Edit
        </Button>
      </LinkContainer>
    </div>);
  }
  else {
    // user has no entry yet
    contentEl = (<div>
      <span className="color-gray">no entry yet</span>
      <LinkContainer to={hrefLearnerStatusEntry('edit', uid, scheduleId, cycleId)}>
        <Button bsStyle="success" onClick={createLearnerEntryClick}>
          Start!
      </Button>
      </LinkContainer>
    </div>);
  }

  return (
    <div className="learner-status-entry">
      <h4>{userEl}</h4>
      {contentEl}
    </div>
  );
});

export default LearnerStatusEntryView;