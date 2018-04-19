//import ProjectStageForms from 'src/core/projects/ProjectStageForms';

import map from 'lodash/map';
import size from 'lodash/size';
import times from 'lodash/times';

import React from 'react';
import PropTypes from 'prop-types';
import Flexbox from 'flexbox-react';

import { EmptyObject } from 'src/util';

import dataBind from 'src/dbdi/react/dataBind';
import UserIcon from 'src/views/components/users/UserIcon';
import LoadIndicator from 'src/views/components/util/loading';

// Render icon + status of all responsible contributors for given stage


const ProjectContributorBar = dataBind()((
  { thisProjectId, children },
  { uidsOfProject }
) => {
  const projectId = thisProjectId;
  if (!uidsOfProject.isLoaded({ projectId })) {
    return <LoadIndicator />;
  }

  const uids = Object.keys(uidsOfProject({ projectId }));

  // render all groups of contributors
  return (<Flexbox flexDirection="row" justifyContent="flex-end" alignItems="center">
    {
      // render icons of the actual users in group
      (<Flexbox minWidth="2em" minHeight="2em"
        flexDirection="row" justifyContent="flex-end" alignItems="center">
        {
          map(uids,
            (uid) => (
              <UserIcon
                key={uid}
                uid={uid}
              />
            )
          )
        }
      </Flexbox>)
    }
    { children }
  </Flexbox>);
}
);
ProjectContributorBar.propTypes = {
};

export default ProjectContributorBar;