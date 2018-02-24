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

import UserIcon from 'src/views/components/users/UserIcon';
import LoadIndicator from 'src/views/components/util/loading';
import LearnerEntryView from './LearnerEntryView';


// TODO: call set_currentSchedule somewhere
// TODO: show all learnerEntries of user (in LearnerEntryList)
// TODO: show all learnerEntries of currentCycle (in LearnerStatusList)
//    TODO: show an entry for all users, even if none exists for current cycle
//    TODO: when getting at it, implicitely create new entry if none exists for current cycle
// TODO: (Thu) visualize entry status + ProgressBar
// TODO: (Fri) be able to edit entries (forms)
// TODO: (Sat) form meta design
// TODO: (future) summarize entries?

const LearnerOverview = dataBind({})(function LearnerEntryList(
  { uid },
  { userPublic, learnerEntriesOfUser }
) {
  if (!learnerEntriesOfUser.isLoaded({ uid }) | !userPublic.isLoaded({ uid })) {
    return <LoadIndicator />;
  }
  else {
    const user = userPublic({ uid });
    if (!user) {
      // TODO
      return <Redirect />;
    }
    const learnerEntries = learnerEntriesOfUser({ uid });
    const nEntries = size(learnerEntries);

    let contentEl;
    if (!nEntries) {
      contentEl = (<Alert bsStyle="warning" style={{ display: 'inline' }} className="no-padding">
        <span>user has no entries yet</span>
      </Alert>);
    }
    else {

      contentEl = (<div>
        {map(learnerEntries, (entry, entryId) => (
          <LearnerEntryView key={entryId} learnerEntryId={entryId} />
        ))}
      </div>);
    }

    const header = (<span>
      <UserIcon user={user} size="small" /> &nbsp;
      {user.displayName} &nbsp;
      ({nEntries})
    </span>);
    return (<Panel>
      <Panel.Heading>
        {header}
      </Panel.Heading>
      <Panel.Body>
        {contentEl}
      </Panel.Body>
    </Panel>);
  }
}
);

export default LearnerOverview;