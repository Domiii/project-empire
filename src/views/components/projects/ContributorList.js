import map from 'lodash/map';
import size from 'lodash/size';
import times from 'lodash/times';

import React from 'react';
import PropTypes from 'prop-types';
import Flexbox from 'flexbox-react';

import dataBind from 'src/dbdi/react/dataBind';

import StageContributorIcon from './StageContributorIcon';
// Render icon + status of all responsible contributors for given stage


const StageStatusBar = dataBind()(
  ({ thisProjectId, thisStagePath }, { stageContributors }) => {
    const projectId = thisProjectId;
    const stagePath = thisStagePath;
    let contributors = projectId && stageContributors({ projectId, stagePath });

    // render all groups of contributors
    return (<Flexbox flexDirection="row" justifyContent="flex-end" alignItems="center">
      {map(contributors, (contributorSet, iSet) => {
        const {
          groupName,
          signOffCount,
          uids
        } = contributorSet;

        const knownUserCount = size(uids);

        // first: all already known users
        const userEls = map(uids,
          (uid) => (
            <StageContributorIcon
              key={uid}
              projectId={projectId}
              stagePath={stagePath}
              uid={uid}
              groupName={groupName}
            />
          )
        );

        // then: all missing users
        let unknownEls;
        if (signOffCount && signOffCount > knownUserCount) {
          unknownEls = times(signOffCount - knownUserCount, (i) =>
            (<StageContributorIcon
              key={i + knownUserCount}
              projectId={projectId}
              stagePath={stagePath}
              uid={null}
              groupName={groupName}
            />)
          );
        }

        // render icons of the actual users in group
        return (<Flexbox key={iSet} minWidth="2em" minHeight="2em"
          flexDirection="row" justifyContent="flex-end" alignItems="center">
          {userEls}
          {unknownEls}
        </Flexbox>);
      })}
    </Flexbox>);
  }
);
StageStatusBar.propTypes = {
};

export default StageStatusBar;