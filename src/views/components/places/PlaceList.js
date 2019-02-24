import { EmptyObject } from 'src/util';

import map from 'lodash/map';
import groupBy from 'lodash/groupBy';
import pickBy from 'lodash/pickBy';
import flatten from 'lodash/flatten';
import isEmpty from 'lodash/isEmpty';
import size from 'lodash/size';

import React from 'react';
import { dataBind } from 'dbdi/react';

import {
  Panel, Well, Alert
} from 'react-bootstrap';


import UserList from 'src/views/components/users/UserList';

import LoadIndicator from 'src/views/components/util/LoadIndicator';

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
        <Panel key={placeId} bsStyle="info">
          <Panel.Heading>
            {`${lookupLocalized({ obj: place, prop: 'name' })} (${size(uidsOfPlace)})`}
          </Panel.Heading>
          <Panel.Body>
            {desc && <Well>
              {desc}
            </Well>}
            {!isEmpty(uidsOfPlace) && <UserList uids={uidsOfPlace} /> || (
              <Alert bsStyle="warning">this place is empty</Alert>
            )}
          </Panel.Body>
        </Panel>
      );
    })}
    {!isEmpty(unassignedUids) &&
      (<Panel bsStyle="danger">
        <Panel.Heading>
          Lost Users ({size(unassignedUids)})
        </Panel.Heading>
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

export default PlaceList;