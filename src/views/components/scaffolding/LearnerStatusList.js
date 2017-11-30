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
import LoadIndicator from 'src/views/components/util/loading';

import LearnerStatusEntryView from './LearnerStatusEntryView';


const LearnerStatusList = dataBind({})(
  function LearnerStatusList(
    { scheduleId, cycleId },
    { learnerEntriesOfCycleByAllUsers, get_learnerSchedule },
    { }
  ) {
    if (!get_learnerSchedule.isLoaded({ scheduleId }) |
      !learnerEntriesOfCycleByAllUsers.isLoaded({ cycleId })) {
      return <LoadIndicator />;
    }
    else {
      const schedule = get_learnerSchedule({ scheduleId });
      const learnerEntriesByUid = learnerEntriesOfCycleByAllUsers({ cycleId });
      const nEntries = size(learnerEntriesByUid);

      let contentEl;
      if (!nEntries) {
        contentEl = (<Alert bsStyle="warning" style={{ display: 'inline' }} className="no-padding">
          <span>user has no entries yet</span>
        </Alert>);
      }
      else {
        contentEl = (<div>
          {map(learnerEntriesByUid, (entry, uid) => (
            <LearnerStatusEntryView uid={uid} />
          ))}
        </div>);
      }

      // TODO: schedule + cycle info
      const header = (<span>
        <UserIcon user={user} size="small" /> &nbsp;
        {user.displayName} &nbsp;
        ({nEntries})
      </span>);
      return (<Panel header={header}>
        {contentEl}
      </Panel>);
    }
  }
);

export default LearnerStatusList;