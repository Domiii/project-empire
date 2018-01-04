import {
  hrefMission
} from 'src/views/href';

import size from 'lodash/size';
import map from 'lodash/map';

import React from 'react';
import PropTypes from 'prop-types';

import dataBind from 'src/dbdi/react/dataBind';

import {
  Alert, Button, Panel,
  ListGroup, ListGroupItem
} from 'react-bootstrap';

import { withRouter } from 'react-router-dom';

import Flexbox from 'flexbox-react';

import LoadIndicator from 'src/views/components/util/loading';
import FAIcon from 'src/views/components/util/FAIcon';


import MissionHeader from './MissionHeader';
import MissionPreview from './MissionPreview';

const MissionListItem = withRouter(dataBind({
  goToMission(evt, { history, missionId }) {
    history.push(hrefMission(missionId, false));
  }
})(function MissionListItem(
  { missionId },
  { goToMission },
  { }
) {
  const header = <MissionHeader onClick={goToMission} missionId={missionId} editing={false} />;
  const body = <MissionPreview missionId={missionId} />;
  return (<Panel header={header}>
    <div onClick={goToMission}>
      {body}
    </div>
  </Panel>);
}));


const MissionList = dataBind({
})(function MissionList(
  { },
  { },
  { missionList, missionList_isLoaded }
) {
  if (!missionList_isLoaded) {
    return <LoadIndicator />;
  }

  let missions = map(missionList, (mission, missionId) => ({ mission, missionId }));
  // TODO: sort missions

  let contentEl;
  if (!missions.length) {
    contentEl = (<Alert bsStyle="warning">
      no questions yet
    </Alert>);
  }
  else {
    contentEl = (<ListGroup>
      {map(missions, ({ _, missionId }) => (
        <MissionListItem key={missionId} missionId={missionId} />
      ))}
    </ListGroup>);
  }
  return contentEl;
});

export default MissionList;