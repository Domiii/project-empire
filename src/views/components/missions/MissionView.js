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

import Markdown from 'src/views/components/markdown';

import MissionHeader from 'src/views/components/missions/MissionHeader';
import MissionEditorForm from 'src/views/components/missions/MissionEditorForm';

import LoadIndicator from 'src/views/components/util/LoadIndicator';
import { FAIcon } from 'src/views/components/util';


export const MissionBody = dataBind({})(function MissionBody(
  { editing, missionId },
  { get_mission, lookupLocalized }
) {
  const isMissionLoaded = get_mission.isLoaded({ missionId });
  let goalEl;
  if (!isMissionLoaded) {
    return <LoadIndicator block message="loading mission..." />;
  }

  const mission = get_mission({ missionId });
  if (!mission) {
    return (<div>
      <h4>
        (mission does not exist (anymore))
      </h4>
    </div>);
  }
  let {
    subCategory,
    link,
    difficulty
  } = mission;

  if (link && !link.includes('//')) {
    link = '//' + link;
  }


  const goals = lookupLocalized({ obj: mission, prop: 'goals' });
  const details = lookupLocalized({ obj: mission, prop: 'details' });

  if (goals) {
    goalEl = (
      <h4 className="no-margin no-padding">{goals}</h4>
    );
  }
  else {
    goalEl = (<Alert bsStyle="warning">mission goals are empty</Alert>);
  }
  return (<div>
    {editing && <MissionEditorForm missionId={missionId} />}
    {goalEl}
    <h4>
      {subCategory}
    </h4>
    <Well>
      <Markdown source={details} />
    </Well>
    <h3>
      <center>
        {link && <a href={link} target="_blank">Link</a>}
      </center>
    </h3>
  </div>);
});


const MissionView = dataBind({})(function MissionView(
  { editing, canEdit, missionId },
  { get_mission }
) {
  const isMissionLoaded = get_mission.isLoaded({ missionId });
  if (!isMissionLoaded) {
    return <LoadIndicator block message="loading mission..." />;
  }

  const mission = get_mission({ missionId });
  if (!mission) {
    return (<div>
      <h4>
        (mission does not exist (anymore))
      </h4>
    </div>);
  }

  return (<div>
    <MissionHeader missionId={missionId} canEdit={canEdit} editing={editing} />
    <MissionBody missionId={missionId} editing={editing} />
  </div>);
});

export default MissionView;

// var obj = _.zipObject(_.map(arr, (m, i) => 'm'+i), arr); copy(JSON.stringify(obj, null, 2));