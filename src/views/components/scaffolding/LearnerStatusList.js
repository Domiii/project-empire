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


const LearnerStatusList = dataBind({})(
  function LearnerStatusList(
    { },
    { learnerEntriesOfCycleByAllUsers },
    { currentSchedule, currentSchedule_isLoaded, currentScheduleCycleId }
  ) {
    if (!currentSchedule_isLoaded | 
      !learnerEntriesOfCycleByAllUsers.isLoaded({ cycleId: currentScheduleCycleId })) {
      return <LoadIndicator />;
    }
    else {
      const learnerEntries = learnerEntriesOfCycleByAllUsers({ cycleId: currentScheduleCycleId });
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
            <LearnerStatusView learnerEntryId={entryId} />
          ))}
        </div>);
      }

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