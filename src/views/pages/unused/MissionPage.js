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
import LoadIndicator from 'src/views/components/util/LoadIndicator';

import MissionOverview from 'src/views/components/missions/MissionOverview';
import MissionView from 'src/views/components/missions/MissionView';


const MissionPage = withRouter(dataBind()(function MissionPage(
  { match },
  { mission },
  { currentUser_isLoaded }
) {

  const { 
    missionId,
    editing
   } = match.params;

  if (!currentUser_isLoaded) {
    return (<LoadOverlay />);
  }

  if (missionId) {
    if (!mission.isLoaded({ missionId })) {
      return <LoadIndicator size={2} block />;
    }

    if (!mission({ missionId })) {
      // invalid missionId
      return <Redirect to={hrefMissionList()} />;
    }

    return (<MissionView missionId={missionId} 
      canEdit={true}
      editing={editing === 'edit'} />);
  }
  else {
    return (
      <div>
        <MissionOverview />
      </div>
    );
  }
}
));

export default MissionPage;