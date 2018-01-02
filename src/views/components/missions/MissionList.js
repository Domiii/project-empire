import map from 'lodash/map';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import autoBind from 'react-autobind';

import {
  MissionHeader,
  MissionBody
} from 'src/views/components/missions/MissionPanel';

import dataBind from 'src/dbdi/react/dataBind';

import {
  Button, Alert, Panel,
  ListGroup, ListGroupItem
} from 'react-bootstrap';

import { LoadOverlay } from 'src/views/components/overlays';

import { FAIcon } from 'src/views/components/util';
import Loading from 'src/views/components/util/loading';

const MissionList = dataBind({})(function MissionList(
  { },
  { },
  { allMissions, allMissions_isLoaded },
  { }
) {
  if (!allMissions_isLoaded) {
    return <Loading size={2} block />;
  }
  return (<ListGroup>
    {map(allMissions, (mission, missionId) => {
      const header = <MissionHeader missionId={missionId} />;
      const body = <MissionBody missionId={missionId} />;
      return (<ListGroupItem header={header} bsStyle="info">
        {body}
      </ListGroupItem>);
    })}
  </ListGroup>);
});

export default MissionList;