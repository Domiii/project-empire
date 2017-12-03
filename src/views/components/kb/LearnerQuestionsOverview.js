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

import UserBadge from 'src/views/components/users/UserBadge';
import LoadIndicator from 'src/views/components/util/loading';


const LearnerQuestionsOverview = dataBind({})(function LearnerEntryList(
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
        invalid page :( <LinkContainer to={hrefLearnerStatusList()}>
          <Button bsStyle="primary">
            Back!
          </Button>
        </LinkContainer>
      </Alert>);
    }

    // TODO
    return (<div>
      <h3>
        <UserBadge uid={uid} /> learner record
      </h3>
      form
    </div>);
  }
});

export default LearnerQuestionsOverview;