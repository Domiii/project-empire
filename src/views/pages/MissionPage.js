import { 
  hrefMission,
  hrefMissionList
} from 'src/views/href';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import dataBind from 'src/dbdi/react/dataBind';

import { Redirect, withRouter } from 'react-router-dom';

import {
  Alert, Button, Jumbotron, Well, Panel
} from 'react-bootstrap';

import { LoadOverlay } from 'src/views/components/overlays';
import Loading from 'src/views/components/util/loading';

import MissionList from 'src/views/components/missions/MissionList';


const MissionPage = withRouter(dataBind()(function MissionPage(
  { match },
  { missionById },
  { currentUser_isLoaded }
) {

  const { missionId } = match.params;

  if (!currentUser_isLoaded) {
    return (<LoadOverlay />);
  }

  if (missionId) {
    if (!missionById.isLoaded({ missionId })) {
      return <Loading size={2} block />;
    }

    if (!missionById({ missionId })) {
      // invalid missionId
      return <Redirect to={hrefMissionList()} />;
    }

    return (<MissionView missionId={missionId} />);
  }
  else {
    return (
      <div>
        <Panel bsStyle="primary" header="Missions">
          <MissionList />
        </Panel>
      </div>
    );
  }
}
));