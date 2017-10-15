import ProjectsRef, { UserProjectRef } from 'src/core/projects/ProjectsRef';
import UserInfoRef from 'src/core/users/UserInfoRef';
import MissionsRef from 'src/core/missions/MissionsRef';

import map from 'lodash/map';
import mapValues from 'lodash/mapValues';

import { EmptyObject, EmptyArray } from 'src/util';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import autoBind from 'react-autobind';

import dataBind from 'src/dbdi/react/dataBind';

import {
  Alert, Button, Jumbotron, Well, Panel, Badge
} from 'react-bootstrap';

import {
  LinkContainer
} from 'react-router-bootstrap';
import { LoadOverlay } from 'src/views/components/overlays';
import { FAIcon } from 'src/views/components/util';

import ProjectPreview from 'src/views/components/projects/ProjectPreview';
import ProjectControlView from 'src/views/components/projects/ProjectControlView';
//import { ProjectMeetingPanel } from 'src/views/components/projects/MeetingView';
import { UserBadge } from 'src/views/components/users/UserList';



@dataBind({

})
export default class MissionControlPage extends Component {
  static propTypes = {

  };

  constructor(...args) {
    super(...args);

    autoBind(this);
  }

  render({ }, { }, { }) {
    return (
      <div>
        <Panel header="目前的任務">
          <ProjectControlView />
        </Panel>
        <Panel header="以前做過的任務">
          TODO: project archive
        </Panel>
      </div>
    );
  }
}