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

import LoadIndicator from 'src/views/components/util/loading';

const PlaceList = dataBind({})(function PlaceList(
  { },
  { lookupLocalized },
  { placeList, usersPublic, placeList_isLoaded, usersPublic_isLoaded }
) {
  if (!placeList_isLoaded | !usersPublic_isLoaded) {
    return <LoadIndicator />;
  }

  const uids = Object.keys(usersPublic || EmptyObject);
  const uidsByPlaceId = groupBy(uids, (uid) => usersPublic[uid].placeId);
  let unassignedUids = pickBy(uidsByPlaceId, (uids, placeId) => !placeId || !placeList[placeId]);
  unassignedUids = flatten(Object.values(unassignedUids));

  return (<div>
    {map(placeList, (place, placeId) => {
      const desc = lookupLocalized({ obj: place, prop: 'description' });
      const uidsOfPlace = uidsByPlaceId[placeId];
      return (
        <Panel key={placeId} bsStyle="info"
          header={`${lookupLocalized({ obj: place, prop: 'name' })} (${size(uidsOfPlace)})`}>
          {desc && <Well>
            {desc}
          </Well>}
          {!isEmpty(uidsOfPlace) && <UserList uids={uidsOfPlace} /> || (
            <Alert bsStyle="warning">this place is empty</Alert>
          )}
        </Panel>
      );
    })}
    {!isEmpty(unassignedUids) && 
      (<Panel header={`Lost Users (${size(unassignedUids)})`} bsStyle="danger">
        <UserList uids={unassignedUids} />
      </Panel>) ||
      (
        <Alert bsStyle="success">no lost users!</Alert>
      )
    }
  </div>);
});

export default PlaceList;