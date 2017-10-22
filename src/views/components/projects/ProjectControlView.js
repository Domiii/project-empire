import Roles from 'src/core/users/Roles';

import {
  projectStageTree,
  StageStatus,
  StageContributorStatus,
  isStageStatusOver
} from 'src/core/projects/ProjectDef';

import autoBind from 'src/util/auto-bind';

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


const stageStatusStyles = {
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

const contributorStatusStyles = {
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

const constributorStatusIcons = {
  [StageContributorStatus.None]: {
    name: 'question'
  },
  [StageContributorStatus.NotStarted]: {
    name: 'question'
  },
  [StageContributorStatus.Started]: {
    name: 'repeat'
  },
  [StageContributorStatus.Finished]: {
    name: 'check'
  },
  [StageContributorStatus.Failed]: {
    name: 'remove'
  }
};

const stageStatusBsStyles = {
  [StageStatus.None]: 'info',
  [StageStatus.NotStarted]: 'default',
  [StageStatus.Started]: 'primary',
  [StageStatus.Finished]: 'success',
  [StageStatus.Failed]: 'danger'
};


const stageRenderers = {
  prepare(node, path, stageEntry, children) {

  },
  sprint(node, path, stageEntry, children, iteration) {

  },
  execution(node, path, stageEntry, children) {

  },
  partyPrepareMeeting(node, path, stageEntry, children) {

  },
  reviewerPrepareMeeting(node, path, stageEntry, children) {

  },
  holdMeeting(node, path, stageEntry, children) {

  },
  postSprintReflection(node, path, stageEntry, children) {

  },
  wrapup(node, path, stageEntry, children) {

  },
};



function StageStatusIcon({ status, ...props }) {
  const iconCfg = constributorStatusIcons[status];
  const style = contributorStatusStyles[status];
  return (<FAIcon {...iconCfg} style={style} {...props} />);
}
StageStatusIcon.propTypes = {
  status: PropTypes.number.isRequired
};

const StageContributorIcon = dataBind()(
  ({ projectId, stageId, groupName, uid }, { userPublic, stageContributorStatus }) => {

    const isStatusLoaded = !uid || stageContributorStatus.isLoaded({ projectId, stageId, uid });
    const isUserLoaded = !uid || userPublic.isLoaded({ projectId, stageId, uid });
    const userStatus = stageContributorStatus({ projectId, stageId, uid }) || 0;
    const user = isUserLoaded && uid && userPublic({ uid });

    const statusIconEl = (
      !isStatusLoaded ?
        <LoadIndicator className="project-contributor-status-icon" /> :
        <StageStatusIcon status={userStatus} className="project-contributor-status-icon" />
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
      // still loading
      return (<LoadIndicator />);
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
  ({ stageNode, stageEntry, thisProjectId, children }, { }) => {
    //const projectId = thisProjectId;
    const stageDef = stageNode.stageDef;
    //const stageId = stageNode.stageId;
    if (!stageDef) {
      return <div>{children}</div>;
    }

    const title = stageDef.title;

    const order = stageNode.order;
    const status = stageEntry && stageEntry.status || StageStatus.None;
    const bsStyle = stageStatusBsStyles[status];

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
      <Panel header={header}
        className="no-margin no-shadow no-border project-stage-panel"
        bsStyle={bsStyle}>
        {children}
      </Panel>
    </div>);
  }
);
ProjectStageView.propTypes = {
  stageNode: PropTypes.object.isRequired,
  stageEntry: PropTypes.object
};

const ProjectStageArrow = dataBind()(
  ({ previousNode, stageEntry, thisProjectId }, { }) => {
    const projectId = thisProjectId;
    const stageId = previousNode.stageId;
    const status = stageEntry && stageEntry.status || StageStatus.None;
    const style = stageStatusStyles[status];
    return (<FAIcon name="arrow-down" size="4em" style={style} />);
  }
);


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


const ProjectTree = dataBind()(
  ({ thisProjectId }, { get_stageEntries }) => {
    const stageEntries = get_stageEntries({ projectId: thisProjectId });
    return projectStageTree.traverse(stageEntries, genStageNode);
  }
);

function genStageNode(node, path, stageEntry, children) {
  return (<div key={node.stageId} className="full-width">
    <Flex column justifyContent="center" alignItems="center">
      <Item className="full-width">
        <ProjectStageView stageNode={node}
          stageEntry={stageEntry}>
          {children}
        </ProjectStageView>
      </Item>
      {!!node.next &&
        <Item style={{ display: 'flex' }} justifyContent="center" flex="1" >
          <ProjectStageArrow previousNode={node}
            stageEntry={stageEntry} />
        </Item>
      }
    </Flex>
  </div>);
}

const ProjectControlView = dataBind()(
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
      return (<div>{
        map(currentProjectIds, (_, projectId) =>
          (<ProjectControlView key={projectId} projectId={projectId} />)
        )
      }</div>);
    }
  }
);

export default ProjectControlList;