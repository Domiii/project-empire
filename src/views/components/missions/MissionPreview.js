import React, { Component } from 'react';
import PropTypes from 'prop-types';
import autoBind from 'react-autobind';

import { dataBind } from 'dbdi/react';

import Moment from 'react-moment';
import {
  Alert, Button,
  Well, Panel
} from 'react-bootstrap';
import Flexbox from 'flexbox-react';

import LoadIndicator from 'src/views/components/util/LoadIndicator';
import FAIcon from 'src/views/components/util/FAIcon';



const MissionPreview = dataBind({})(function MissionPreview(
  { missionId },
  { get_mission }
) {
  const isMissionLoaded = get_mission.isLoaded({ missionId });
  let missionEl;
  if (isMissionLoaded) {
    const mission = get_mission({ missionId });
    if (mission) {
      missionEl = (
        <h4 className="no-margin no-padding">{mission.goals_zh}</h4>
      );
    }
    else {
      missionEl = (<Alert bsStyle="danger">mission doesn{'\''}t exist (anymore)</Alert>);
    }
  }
  else {
    missionEl = <LoadIndicator block message="loading mission..." />;
  }
  return missionEl;
});

export default MissionPreview;