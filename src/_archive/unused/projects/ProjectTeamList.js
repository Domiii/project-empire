import map from 'lodash/map';
import size from 'lodash/size';
import times from 'lodash/times';

import React from 'react';
import PropTypes from 'prop-types';
import Flexbox from 'flexbox-react';

import dataBind from 'src/dbdi/react/dataBind';

import LoadIndicator from 'src/views/components/util/LoadIndicator';

import ProjectContributorIcon from './ProjectContributorIcon';

/**
 * Only show party for now
 */
const ProjectTeamList = dataBind()(
  ({ projectId }, { projectById, uidsOfProject }) => {
    // render party members
    if (!uidsOfProject.isLoaded({ projectId }) | !projectById.isLoaded({ projectId })) {
      return <LoadIndicator />;
    }
    const uids = uidsOfProject({ projectId });

    // party members
    const userEls = map(uids,
      (_, uid) => (
        <ProjectContributorIcon
          key={uid}
          uid={uid}
          groupName="party"
          userStatus={null}
        />
      )
    );

    const project = projectById({ projectId });

    // reviewer
    userEls.push(<ProjectContributorIcon
      key="reviewer"
      uid={project.reviewerUid}
      groupName="reviewer"
      userStatus={null}
    />);

    return (<Flexbox flexDirection="row" justifyContent="flex-end" alignItems="center">
      <Flexbox className="project-team" minWidth="2em" minHeight="2em"
        flexDirection="row" justifyContent="flex-end" alignItems="center">
        {userEls}
      </Flexbox>
    </Flexbox>);
  }
);
ProjectTeamList.propTypes = {
};

export default ProjectTeamList;