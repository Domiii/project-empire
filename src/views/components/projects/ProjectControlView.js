import Roles from 'src/core/users/Roles';

import {
  ProjectStageTree,
  StageStatus,
  ContributorGroupNames
} from 'src/core/projects/ProjectDef';

import autoBind from 'src/util/auto-bind';
import { EmptyObject, EmptyArray } from 'src/util';

import map from 'lodash/map';
import mapValues from 'lodash/mapValues';
import forEach from 'lodash/forEach';
import isEmpty from 'lodash/isEmpty';
import sortBy from 'lodash/sortBy';
import size from 'lodash/size';
import times from 'lodash/times';
import pickBy from 'lodash/pickBy';

import React, { Component, Children } from 'react';
import PropTypes from 'prop-types';
import { Flex, Item } from 'react-flex';

import {
  Panel, Button, Alert, Well
} from 'react-bootstrap';

import Form from 'react-jsonschema-form';

import dataBind from 'src/dbdi/react/dataBind';

import FAIcon from 'src/views/components/util/FAIcon';
import LoadIndicator from 'src/views/components/util/loading';

import ConfirmModal from 'src/views/components/util/ConfirmModal';
import UserIcon from 'src/views/components/users/UserIcon';



// ###########################################################################
// Enums
// ###########################################################################


// ###########################################################################
// Project-specific renderers
// ###########################################################################


const statusStyles = {
  [StageStatus.None]: {
    color: 'gray'
  },
  [StageStatus.NotStarted]: {
    color: 'gray'
  },
  [StageStatus.Started]: {
    color: 'blue'
  },
  [StageStatus.Finished]: {
    color: 'green'
  },
  [StageStatus.Failed]: {
    color: 'red'
  }
};

const statusIcons = {
  [StageStatus.None]: {
    name: 'question'
  },
  [StageStatus.NotStarted]: {
    name: 'question'
  },
  [StageStatus.Started]: {
    name: 'repeat'
  },
  [StageStatus.Finished]: {
    name: 'check'
  },
  [StageStatus.Failed]: {
    name: 'remove'
  }
};

const statusBsStyles = {
  [StageStatus.None]: 'info',
  [StageStatus.NotStarted]: 'default',
  [StageStatus.Started]: 'primary',
  [StageStatus.Finished]: 'success',
  [StageStatus.Failed]: 'danger'
};


function StageStatusIcon({ status, ...props }) {
  const iconCfg = statusIcons[status];
  const style = statusStyles[status];
  return (<FAIcon {...iconCfg} style={style} {...props} />);
}
StageStatusIcon.propTypes = {
  status: PropTypes.number.isRequired
};

const StageContributorIcon = dataBind()(
  ({ projectId, stageId, groupName, uid }, { userPublic, stageContributorStatus }) => {

    const isStatusLoaded = !uid || stageContributorStatus.isLoaded({ projectId, stageId, uid });
    const isUserLoaded = !uid || userPublic.isLoaded({ projectId, stageId, uid });
    const status = stageContributorStatus({ projectId, stageId, uid }) || 0;
    const user = isUserLoaded && uid && userPublic({ uid });

    const statusIconEl = (
      !isStatusLoaded ?
        <LoadIndicator className="project-contributor-status-icon" /> :
        <StageStatusIcon status={status} className="project-contributor-status-icon" />
    );

    const classes = 'project-contributor project-contributor-' + groupName;
    if (!uid) {
      // unknown user
      return (
        <FAIcon className={classes} name="user-secret" >
          {statusIconEl}
        </FAIcon>
      );
    }
    else if (!isUserLoaded) {
      return (<LoadIndicator />);
    }
    else {
      // user icon
      return (
        <div className={classes}>
          <UserIcon size="1em" user={user} />
          {statusIconEl}
        </div>
      );
    }
  }
);



// Render icon + status of all responsible contributors for given stage


const StageStatusBar = dataBind()(
  ({ thisProjectId, stageNode }, { stageContributors }) => {
    const projectId = thisProjectId;
    const { stageId } = stageNode;
    let contributors = projectId && stageContributors({ projectId, stageId: stageNode.stageId });

    // render all groups of contributors
    return (<div>
      {map(contributors, (contributorSet, iSet) => {
        const {
          groupName,
          signOffCount,
          userList
        } = contributorSet;

        // first: all already known users
        const userEls = map(userList,
          (user, uid) => (<Item key={uid} flex="none">
            <StageContributorIcon
              projectId={projectId}
              stageId={stageId}
              uid={uid}
              groupName={groupName}
            />
          </Item>)
        );

        // then: all missing users
        let unknownEls;
        if (signOffCount > 0 && signOffCount > userEls.length) {
          unknownEls = times(signOffCount - userEls.length, (i) =>
            (<StageContributorIcon
              key={i + userEls.length}
              projectId={projectId}
              stageId={stageId}
              uid={null}
              groupName={groupName}
            />)
          );
        }

        // render icons of the actual users in group
        return (<Flex row key={iSet} justifyContent="flex-end" alignItems="center">
          {userEls}
          {unknownEls}
        </Flex>);
      })}
    </div>);
  }
);
StageStatusBar.propTypes = {
  stageNode: PropTypes.object.isRequired
};



// ###########################################################################
// Project tree + stage logic
// ###########################################################################

const ProjectStageView = dataBind()(
  ({ stageNode, thisProjectId }, { getStageStatus }) => {
    const projectId = thisProjectId;
    const stageDef = stageNode.stageDef;
    const stageId = stageDef.id;
    const title = stageDef.title;

    const order = stageNode.order;
    const status = projectId && getStageStatus({ projectId, stageId });
    const bsStyle = statusBsStyles[status];

    const header = (
      <Flex row justifyContent="space-between" alignItems="center">
        <Item>
          <span>{`${order + 1}. ${title}`}</span>
        </Item>
        <Item>
          <StageStatusBar stageNode={stageNode} />
        </Item>
      </Flex>
    );

    return (<div>
      <Panel header={header} className="no-margin no-shadow no-border project-stage-panel"
        bsStyle={bsStyle}>
        {stageNode.firstChild && (
          <div>
            <ProjectStagesView stageNode={stageNode.firstChild} />
          </div>
        )}
      </Panel>
    </div>);
  }
);
ProjectStageView.propTypes = {
  stageNode: PropTypes.object.isRequired
};

const ProjectStageArrow = dataBind()(
  ({ previousNode, thisProjectId }, { getStageStatus }) => {
    const projectId = thisProjectId;
    const stageDef = previousNode.stageDef;
    const stageId = stageDef.id;
    const status = projectId && getStageStatus({ projectId, stageId });
    const style = statusStyles[status];
    return (<FAIcon name="arrow-down" size="4em" style={style} />);
  }
);

const ProjectStagesView = dataBind()(
  ({ stageNode }, { }) => {
    // interject node views with arrows
    return (
      <Flex column justifyContent="center" alignItems="center">
        {
          stageNode.mapLine(node => {
            const order = node.order;
            return (<div key={order} className="full-width">
              {
                <Item className="full-width">
                  <ProjectStageView
                    stageNode={node}
                  />
                </Item>
              }
              {!!node.next &&
                <Item style={{ display: 'flex' }} justifyContent="center" flex="1" >
                  <ProjectStageArrow previousNode={node} />
                </Item>
              }
            </div>);
          })
        }
      </Flex>
    );
  }
);
ProjectStagesView.propTypes = {
  stageNode: PropTypes.object.isRequired
};


// ###########################################################################
// ProjectControlView
// ###########################################################################




// TODO: [ProjectStageTree]
// TODO: data tree + format tree have the same shape
// TODO: in case of repeatable nodes, data tree holds array instead of single object
// TODO: contributor data is still by UID
// TODO: in case more people than signOffCount from groupName give feedback, just show them all?
// TODO: write operations
// TODO: forms



const LoadedProjectControlView = dataBind()(
  ({ }, { }) => {
    return (<div>
      <ProjectStagesView stageNode={ProjectStageTree.root} />
    </div>);
  }
);



const ProjectControlView = dataBind()(
  ({ projectId }, { project }) => {
    if (!project.isLoaded({ projectId })) {
      return (<LoadIndicator block />);
    }

    const thisProject = project({ projectId });
    const newContext = {
      thisProjectId: projectId,
      thisProject
    };

    return <LoadedProjectControlView setContext={newContext} />;
  }
);

const ProjectControlList = dataBind()(
  ({ }, { projectIdsOfUser, currentUid }) => {
    const uid = currentUid();
    if (!uid || !projectIdsOfUser.isLoaded({ uid })) {
      return (<LoadIndicator block size={1.5} />);
    }

    const currentProjectIds = projectIdsOfUser({ uid });
    if (isEmpty(currentProjectIds)) {
      return (<Alert bsStyle="warning">
        你目前沒有在進行專案。推薦選擇任務並且找守門人註冊新的～
      </Alert>);
    }
    else {
      return (<div>{
        map(currentProjectIds, (_, projectId) =>
          (<ProjectControlView key={projectId} projectId={projectId} />)
        )
      }</div>);
    }
  }
);

export default ProjectControlList;