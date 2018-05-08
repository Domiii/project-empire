import {
  hrefMission
} from 'src/views/href';

import size from 'lodash/size';
import map from 'lodash/map';

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import dataBind from 'src/dbdi/react/dataBind';

import Moment from 'react-moment';
import {
  Alert, Button,
  Panel,
  ListGroup, ListGroupItem
} from 'react-bootstrap';
import { withRouter } from 'react-router-dom';

import UserBadge from 'src/views/components/users/UserBadge';
import LoadIndicator from 'src/views/components/util/LoadIndicator';
import FAIcon from 'src/views/components/util/FAIcon';

import MissionList from './MissionList';

const AddButton = withRouter(dataBind({
  addMissionClick(evt, { history }, { push_mission }) {
    const record = {
      title_zh: '<新的任務>',
      goals_zh: ''
    };

    const newRef = push_mission(record);
    const missionId = newRef.key;

    history.push(hrefMission(missionId, true));
  }
})(function AddButton(
  { },
  { addMissionClick }
) {
  return (<Button bsStyle="success" onClick={addMissionClick}>
    <FAIcon name="plus" /> Add Mission!
  </Button>);
}));

@dataBind({
})
export default class MissionOverview extends Component {
  constructor(...args) {
    super(...args);
  }

  render(
    { },
    { },
    { missionList, isCurrentUserAdmin }
  ) {
    return (<div>
      <h3>
        Missions ({size(missionList)})
      </h3>

      <MissionList />

      {isCurrentUserAdmin && <center className="full-width">
        <AddButton />
      </center>}
    </div>);
  }
}