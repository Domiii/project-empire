import map from 'lodash/map';
import mapValues from 'lodash/mapValues';

import { EmptyObject, EmptyArray } from 'src/util';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import autoBind from 'react-autobind';

import { dataBind } from 'dbdi/react';

import {
  Alert, Button, Jumbotron, Well, Panel, Badge
} from 'react-bootstrap';

import {
  LinkContainer
} from 'react-router-bootstrap';
import { LoadOverlay } from 'src/views/components/overlays';
import { FAIcon } from 'src/views/components/util';

//import ProjectControlList from 'src/views/components/projects/ProjectControlList';
//import { ProjectMeetingPanel } from 'src/views/components/projects/MeetingView';

//import UserBadge from 'src/views/components/users/UserBadge';



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
        {/* <Panel header="進行中的任務">
          <ProjectControlList />
        </Panel> */}
        <Panel header="以前做過的任務">
          TODO: project archive
        </Panel>
      </div>
    );
  }
}