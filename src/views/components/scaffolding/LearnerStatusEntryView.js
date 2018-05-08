import map from 'lodash/map';
import isEmpty from 'lodash/isEmpty';
import size from 'lodash/size';

//import { hrefLearnerStatusEntry } from 'src/views/href';

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
import LoadIndicator from 'src/views/components/util/LoadIndicator';


//<LearnerStatusEntryView uid={uid} scheduleId={scheduleId} cycleId={cycleId} />

/**
 * Overview of a single learner for one cycle
 */
const LearnerStatusEntryView = dataBind({
  // createLearnerEntryClick(evt,
  //   { uid, scheduleId, cycleId },
  //   { createLearnerEntry },
  //   { }
  // ) {
  //   return createLearnerEntry({ uid, scheduleId, cycleId });
  // }
})(function LearnerStatusEntryView(
  { uid, scheduleId, cycleId },
  { get_goalById },
  { }
) {
  const q = {scheduleId, cycleId, uid};
  if (!get_goalById.isLoaded(q)) {
    return <LoadIndicator />;
  }
  const entry = get_goalById(q);

  const userEl = (<h4 className="inline">
    <UserBadge uid={uid} size="small" />&nbsp;
  </h4>);

  let contentEl;
  if (entry) {
    // user already has an entry for the cycle
    const { updatedAt } = entry;
    contentEl = (<Alert bsStyle="success" className="no-margin">
      {userEl}
      { entry.goalDescription }
      <span className="color-gray">
        &nbsp;
        (<Moment fromNow>{updatedAt}</Moment>, <Moment format="ddd, MMMM Do YYYY, h:mm:ss a">{updatedAt}</Moment>)
      </span>
      {/* <LinkContainer to={hrefLearnerStatusEntry('edit', uid, scheduleId, cycleId)}>
        <Button bsStyle="warning">
          Edit
        </Button>
      </LinkContainer> */}
    </Alert>);
  }
  else {
    // user has no entry yet
    contentEl = (<Alert bsStyle="warning" className="no-margin">
      {userEl}
      <span className="color-gray">(無目標)</span>
      {/* <LinkContainer to={hrefLearnerStatusEntry('edit', uid, scheduleId, cycleId)}>
        <Button bsStyle="success" onClick={createLearnerEntryClick}>
          Start!
      </Button>
      </LinkContainer> */}
    </Alert>);
  }

  return (
    <div className="learner-status-entry">
      {contentEl}
    </div>
  );
});

export default LearnerStatusEntryView;