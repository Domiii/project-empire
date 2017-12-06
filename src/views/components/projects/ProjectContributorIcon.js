import {
  contributorStatusStyles,
  constributorStatusIcons
} from './projectRenderSettings';

import React from 'react';
import PropTypes from 'prop-types';

// import {
//   Panel, Button, Alert, Well
// } from 'react-bootstrap';

import dataBind from 'src/dbdi/react/dataBind';

import FAIcon from 'src/views/components/util/FAIcon';
import LoadIndicator from 'src/views/components/util/loading';

import UserIcon from 'src/views/components/users/UserIcon';


export function ProjectContributorStatusIcon({ status, ...props }) {
  const iconCfg = constributorStatusIcons[status];
  const style = contributorStatusStyles[status];
  return (<FAIcon {...iconCfg} style={style} {...props} />);
}
ProjectContributorStatusIcon.propTypes = {
  status: PropTypes.number.isRequired
};

const ProjectContributorIcon = dataBind()(
  ({ uid, groupName, userStatus },
    { userPublic }) => {
    const isUserLoaded = !uid || userPublic.isLoaded({ uid });
    const user = isUserLoaded && uid && userPublic({ uid });

    const statusIconEl = (!!userStatus || userStatus === 0) && (
      <ProjectContributorStatusIcon status={userStatus} className="project-contributor-status-icon" />
    );

    if (!isUserLoaded) {
      // still loading
      return (
        <div className={classes}>
          <LoadIndicator />
        </div>
      );
    }

    const classes = 'project-contributor project-contributor-' + groupName;
    if (!user) {
      // unknown user
      return (
        <div className={classes}>
          <FAIcon name="user-secret" >
            {statusIconEl}
          </FAIcon>
        </div>
      );
    }
    else {
      // user icon
      return (
        <div className={classes}>
          <UserIcon user={user} />
          {statusIconEl}
        </div>
      );
    }
  }
);

export default ProjectContributorIcon;