import { hrefLearnerStatusList } from 'src/views/href';

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
import { Redirect } from 'react-router-dom';

import UserBadge from 'src/views/components/users/UserBadge';
import LoadIndicator from 'src/views/components/util/LoadIndicator';


const LearnerStatusEntryForm = dataBind({})(function LearnerEntryList(
  { mode, uid, scheduleId, cycleId },
  { userPublic,
    get_learnerEntryStatus }
) {
  const learnerEntryId = { uid, scheduleId, cycleId };
  if (!userPublic.isLoaded({ uid }) |
    !get_learnerEntryStatus.isLoaded({ learnerEntryId })) {
    return <LoadIndicator />;
  }
  else {
    const status = get_learnerEntryStatus({ learnerEntryId });
    const user = userPublic({ uid });
    if (!status || !user) {
      return (<Alert bsStyle="danger">
        {/* <pre>
          {JSON.stringify(learnerEntryId, null, 2)}
          {JSON.stringify(status, null, 2)}
        </pre> */}
        invalid page :( <LinkContainer to={hrefLearnerStatusList()}>
          <Button bsStyle="primary">
            Back!
          </Button>
        </LinkContainer>
      </Alert>);
    }

    const header = (<h3>
      <UserBadge uid={uid} /> learner record
    </h3>);

    return (<div>
      <Panel bsStyle="info" >
        <Panel.Heading>
          {header}
        </Panel.Heading>
        <Panel.Body>
          form
        </Panel.Body>
      </Panel>
    </div>);
  }
});

export default LearnerStatusEntryForm;