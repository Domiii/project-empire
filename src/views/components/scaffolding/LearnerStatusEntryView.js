import map from 'lodash/map';
import isEmpty from 'lodash/isEmpty';
import size from 'lodash/size';

import React from 'react';
import PropTypes from 'prop-types';

import dataBind from 'src/dbdi/react/dataBind';

import Moment from 'react-moment';
import {
  Alert, Button,
  Well, Panel
} from 'react-bootstrap';
import Flexbox from 'flexbox-react';

import UserList from 'src/views/components/users/UserList';
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
  { uid, learnerEntryId },
  { userPublic, createLearnerEntryClick },
  { }
) {
  const userEl = <UserBadge uid={uid} />;

  let contentEl;
  if (learnerEntryId) {
    // user already has an entry for the cycle
    contentEl = (<div>
      <span className="color-gray">TODO: ProgressBar</span>
      <Button bsStyle="warning">
        Edit
      </Button>
    </div>);
  }
  else {
    // user has no entry yet
    contentEl = (<div>
      <span className="color-gray">no entry yet</span>
      <Button bsStyle="success" onClick={createLearnerEntryClick}>
        Start!
      </Button>
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