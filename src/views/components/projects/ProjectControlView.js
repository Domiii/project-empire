import { EmptyObject, EmptyArray } from 'src/util';

import map from 'lodash/map';
import isEmpty from 'lodash/isEmpty';
import size from 'lodash/size';
import times from 'lodash/times';

import React from 'react';
import PropTypes from 'prop-types';
import Flexbox from 'flexbox-react';

import {
  Panel, Button, Alert, Well
} from 'react-bootstrap';

import dataBind from 'src/dbdi/react/dataBind';

import LoadIndicator from 'src/views/components/util/loading';

import ProjectTree from './ProjectTree';


export const ProjectControlView = dataBind()(
  ({ projectId }, { projectById, get_stageEntries }) => {
    if (!projectById.isLoaded({ projectId }) ||
      !get_stageEntries.isLoaded({ projectId })) {
      return (<LoadIndicator block />);
    }

    const thisProject = projectById({ projectId });
    const newContext = {
      thisProjectId: projectId,
      thisProject
    };

    return <ProjectTree setContext={newContext} />;
  }
);

const ProjectControlList = dataBind()(
  ({ }, { activeProjectIdsOfUser, currentUid }) => {
    const uid = currentUid();
    if (!uid || !activeProjectIdsOfUser.isLoaded({ uid })) {
      return (<LoadIndicator block size={1.5} />);
    }

    const currentProjectIds = activeProjectIdsOfUser({ uid });
    if (isEmpty(currentProjectIds)) {
      return (<Alert bsStyle="warning">
        你目前沒有在進行專案。推薦選擇任務並且找守門人註冊新的～
      </Alert>);
    }
    else {
      return (<div data-name="ProjectControlView" className="full-width">{
        map(currentProjectIds, (_, projectId) =>
          (<ProjectControlView data-name="ProjectControlView" key={projectId} projectId={projectId} />)
        )
      }</div>);
    }
  }
);

export default ProjectControlList;