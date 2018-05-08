import { EmptyObject } from 'src/util';

import map from 'lodash/map';
import groupBy from 'lodash/groupBy';
import pickBy from 'lodash/pickBy';
import flatten from 'lodash/flatten';
import isEmpty from 'lodash/isEmpty';
import size from 'lodash/size';

import React from 'react';
import dataBind from 'src/dbdi/react/dataBind';

import {
  ListGroup, ListGroupItem, Panel, Well, Alert
} from 'react-bootstrap';


import UserList from 'src/views/components/users/UserList';

import LoadIndicator from 'src/views/components/util/LoadIndicator';

const CohortList = dataBind({})(function CohortList(
  { },
  { lookupLocalized },
  { cohortList, usersPublic, cohortList_isLoaded, usersPublic_isLoaded }
) {
  if (!cohortList_isLoaded | !usersPublic_isLoaded) {
    return <LoadIndicator />;
  }

  const uids = Object.keys(usersPublic || EmptyObject);
  const uidsByCohortId = groupBy(uids, (uid) => usersPublic[uid].cohortId);
  let unassignedUids = pickBy(uidsByCohortId, (uids, cohortId) => !cohortId || !cohortList[cohortId]);
  unassignedUids = flatten(Object.values(unassignedUids));

  return (<div>
    {map(cohortList, (cohort, cohortId) => {
      const desc = lookupLocalized({ obj: cohort, prop: 'description' });
      const uidsOfCohort = uidsByCohortId[cohortId];
      return (
        <Panel key={cohortId} bsStyle="info">
          <Panel.Heading>
            {lookupLocalized({ obj: cohort, prop: 'name' })}
            ({size(uidsOfCohort)})
          </Panel.Heading>
          <Panel.Body>
            {desc && <Well>
              {desc}
            </Well>}
            {!isEmpty(uidsOfCohort) && <UserList uids={uidsOfCohort} /> || (
              <Alert bsStyle="warning">this cohort is empty</Alert>
            )}
          </Panel.Body>
        </Panel>
      );
    })}
    {!isEmpty(unassignedUids) &&
      (<Panel bsStyle="danger">
        <Panel.Heading>Lost Users ({size(unassignedUids)})</Panel.Heading>
        <Panel.Body>
          <UserList uids={unassignedUids} />
        </Panel.Body>
      </Panel>) ||
      (
        <Alert bsStyle="success">no lost users!</Alert>
      )
    }
  </div>);
});

export default CohortList;