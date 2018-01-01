import React, { Component } from 'react';
import PropTypes from 'prop-types';
import autoBind from 'react-autobind';

import dataBind from 'src/dbdi/react/dataBind';

import Moment from 'react-moment';
import {
  Alert, Button,
  Well, Panel
} from 'react-bootstrap';
import Flexbox from 'flexbox-react';

import LoadIndicator from 'src/views/components/util/loading';
import { FAIcon } from 'src/views/components/util';


export const MissionHeader = dataBind({})(function MissionHeader(
  { missionId },
  { missionById }
) {
  const isMissionLoaded = missionById.isLoaded({ missionId });
  let missionHeader;
  if (isMissionLoaded) {
    const mission = missionById({ missionId });
    if (mission) {
      missionHeader = `${mission.code} - ${mission.title}`;
    }
    else {
      missionHeader = '<unknown mission>';
    }
  }
  else {
    missionHeader = <LoadIndicator />;
  }

  return missionHeader;
});


export const MissionBody = dataBind({})(function MissionBody(
  { missionId },
  { get_missionDescription }
) {
  const isMissionLoaded = get_missionDescription.isLoaded({ missionId });
  let missionEl;
  if (isMissionLoaded) {
    const missionDescription = get_missionDescription({ missionId });
    if (missionDescription) {
      missionEl = (<Well>
        <h4 className="no-margin no-padding">{missionDescription}</h4>
      </Well>);
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