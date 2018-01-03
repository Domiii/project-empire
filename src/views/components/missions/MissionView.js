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

import Markdown from 'src/views/components/markdown';

import MissionHeader from 'src/views/components/missions/MissionHeader';

import LoadIndicator from 'src/views/components/util/loading';
import { FAIcon } from 'src/views/components/util';

export const MissionView = dataBind({})(function MissionView(
  { missionId },
  { missionById }
) {
  const isMissionLoaded = missionById.isLoaded({ missionId });
  let goalEl;
  if (!isMissionLoaded) {
    return <LoadIndicator block message="loading mission..." />;
  }

  const mission = missionById({ missionId });
  const {
    goals,
    details,
    subCategory,
    link,
    difficulty
  } = mission;

  if (goals) {
    goalEl = (
      <h4 className="no-margin no-padding">{goals}</h4>
    );
  }
  else {
    goalEl = (<Alert bsStyle="warning">mission doesn{'\''}t have any goals</Alert>);
  }
  return (<div>
    {goalEl}
    <h4>
      {subCategory}
    </h4>
    <Well>
      <Markdown source={details} />
    </Well>
    TODO: prettier linkage + START! button
    <a href={link} target="_blank">Link</a>
  </div>);
});

export default MissionView;