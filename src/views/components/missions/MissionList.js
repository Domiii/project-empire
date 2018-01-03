import map from 'lodash/map';

import { 
  hrefMission
} from 'src/views/href';

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import dataBind from 'src/dbdi/react/dataBind';

import {
  Button, Alert, Panel,
  ListGroup, ListGroupItem
} from 'react-bootstrap';

import MissionPreview from 'src/views/components/missions/MissionPreview';
import MissionHeader from 'src/views/components/missions/MissionHeader';

import { LoadOverlay } from 'src/views/components/overlays';

import { FAIcon } from 'src/views/components/util';
import Loading from 'src/views/components/util/loading';

const MissionToolbar = dataBind({})(function MissionList(
  { },
  { },
  { allMissions, allMissions_isLoaded },
  { }
) {
  return (<div>

  </div>);
});

const MissionList = dataBind()(function MissionList(
  { },
  { },
  { },
  { allMissions, allMissions_isLoaded },
  { }
) {
  if (!allMissions_isLoaded) {
    return <Loading size={2} block />;
  }

  return (<div>
    <MissionToolbar />
    <ListGroup>
      {map(allMissions, (mission, missionId) => {
        const header = <MissionHeader missionId={missionId} />;
        const body = <MissionPreview missionId={missionId} />;
        return (<ListGroupItem header={header} bsStyle="info">
          {body}
        </ListGroupItem>);
      })}
    </ListGroup>
  </div>);
});

export default MissionList;