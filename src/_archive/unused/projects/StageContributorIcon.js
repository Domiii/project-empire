import {
  projectStageTree,
  StageStatus,
  StageContributorStatus,
  isStageStatusOver
} from 'src/core/projects/ProjectDef';

import {
  stageStatusStyles,
  contributorStatusStyles,
  constributorStatusIcons,
  stageStatusBsStyles
} from './projectRenderSettings';

import React from 'react';
import PropTypes from 'prop-types';

// import {
//   Panel, Button, Alert, Well
// } from 'react-bootstrap';

import dataBind from 'src/dbdi/react/dataBind';

import FAIcon from 'src/views/components/util/FAIcon';
import LoadIndicator from 'src/views/components/util/LoadIndicator';

import UserIcon from 'src/views/components/users/UserIcon';

import ProjectContributorIcon from './ProjectContributorIcon';




export function StageContributorStatusIcon({ status, ...props }) {
  const iconCfg = constributorStatusIcons[status];
  const style = contributorStatusStyles[status];
  return (<FAIcon {...iconCfg} style={style} {...props} />);
}
StageContributorStatusIcon.propTypes = {
  status: PropTypes.number.isRequired
};

const StageContributorIcon = dataBind()(
  ({ projectId, stagePath, groupName, uid },
    { stageContributorStatus }) => {
    const isStatusLoaded = !uid || stageContributorStatus.isLoaded({ projectId, stagePath, uid });

    if (!isStatusLoaded) {
      return <LoadIndicator className="project-contributor-status-icon" />;
    }

    const userStatus = uid && stageContributorStatus({ projectId, stagePath, uid }) ||
      StageContributorStatus.None;

    const iconProps = {
      uid,
      userStatus,
      groupName
    };

    return (<ProjectContributorIcon {...iconProps} />);
  }
);

export default StageContributorIcon;