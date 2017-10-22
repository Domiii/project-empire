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
import Flexbox from 'flexbox-react';

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
  [StageContributorStatus.None]: {
    color: 'gray'
  },
  [StageContributorStatus.NotStarted]: {
    color: 'gray'
  },
  [StageContributorStatus.Started]: {
    color: 'blue'
  },
  [StageContributorStatus.Finished]: {
    color: 'green'
  },
  [StageContributorStatus.Failed]: {
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


function StageContributorStatusIcon({ status, ...props }) {
  const iconCfg = constributorStatusIcons[status];
  const style = contributorStatusStyles[status];
  return (<FAIcon {...iconCfg} style={style} {...props} />);
}
StageContributorStatusIcon.propTypes = {
  status: PropTypes.number.isRequired
};

const StageContributorIcon = dataBind()(
  ({ projectId, stagePath, groupName, uid }, { userPublic, stageContributorStatus }) => {
    const isStatusLoaded = !uid || stageContributorStatus.isLoaded({ projectId, stagePath, uid });
    const isUserLoaded = !uid || userPublic.isLoaded({ uid });
    const userStatus = isUserLoaded && stageContributorStatus({ projectId, stagePath, uid }) || 0;
    const user = isUserLoaded && uid && userPublic({ uid });

    const statusIconEl = (
      !isStatusLoaded ?
        <LoadIndicator className="project-contributor-status-icon" /> :
        <StageContributorStatusIcon status={userStatus} className="project-contributor-status-icon" />
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
          <FAIcon className={classes} name="user-secret" >
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



// Render icon + status of all responsible contributors for given stage


const StageStatusBar = dataBind()(
  ({ thisProjectId, stagePath }, { stageContributors }) => {
    const projectId = thisProjectId;
    let contributors = projectId && stageContributors({ projectId, stagePath });

    // render all groups of contributors
    return (<Flexbox flexDirection="row" justifyContent="flex-end" alignItems="center">
      {map(contributors, (contributorSet, iSet) => {
        const {
          groupName,
          signOffCount,
          uids
        } = contributorSet;

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
        if (signOffCount > 0 && signOffCount > userEls.length) {
          unknownEls = times(signOffCount - userEls.length, (i) =>
            (<StageContributorIcon
              key={i + userEls.length}
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
  stagePath: PropTypes.string.isRequired
};



// ###########################################################################
// Project tree + stage logic
// ###########################################################################

function getToggleStatus(oldStatus) {
  const isDone = isStageStatusOver(oldStatus);
  return isDone ? StageStatus.None : StageStatus.Finished;
}

const ProjectStageView = dataBind({
  toggleStageStatus(evt, { thisProjectId, stagePath },
    { get_stageStatus, set_stageStatusRaw }) {
    const oldStatus = get_stageStatus({ projectId: thisProjectId, stagePath }) || StageStatus.None;

    const newStatus = getToggleStatus(oldStatus);
    set_stageStatusRaw({ projectId: thisProjectId, stagePath }, newStatus);
  },
  setNone(evt, { thisProjectId, stagePath },
    { set_stageStatusRaw }) {
    set_stageStatusRaw({ projectId: thisProjectId, stagePath }, StageStatus.None);
  },
  setFinished(evt, { thisProjectId, stagePath },
    { set_stageStatusRaw }) {
    set_stageStatusRaw({ projectId: thisProjectId, stagePath }, StageStatus.Finished);
  },
  setFailed(evt, { thisProjectId, stagePath },
    { set_stageStatusRaw }) {
    set_stageStatusRaw({ projectId: thisProjectId, stagePath }, StageStatus.Failed);
  },

  setContributorNone(evt, { thisProjectId, stagePath },
    { set_stageContributorStatusRaw },
    { currentUid }) {
    const uid = currentUid;
    const projectId = thisProjectId;
    set_stageContributorStatusRaw({ uid, projectId, stagePath }, StageContributorStatus.None);
  },
  setContributorFinished(evt, { thisProjectId, stagePath },
    { set_stageContributorStatusRaw },
    { currentUid }) {

    const uid = currentUid;
    const projectId = thisProjectId;
    set_stageContributorStatusRaw({ uid, projectId, stagePath }, StageContributorStatus.Finished);
  },
  setContributorFailed(evt, { thisProjectId, stagePath },
    { set_stageContributorStatusRaw },
    { currentUid }) {

    const uid = currentUid;
    const projectId = thisProjectId;
    set_stageContributorStatusRaw({ uid, projectId, stagePath }, StageContributorStatus.Failed);
  }
})(
  ({ stageNode, stagePath, thisProjectId, children },
    { get_stageStatus, get_isStageContributor,
      setFinished, setNone, setFailed,
      setContributorFinished, setContributorNone, setContributorFailed },
    { currentUid }) => {
    const stageDef = stageNode.stageDef;

    if (!stageDef) {
      // root node
      return <div className="full-width">{children}</div>;
    }

    const title = stageDef.title;
    const order = stageNode.order;
    const uid = currentUid;
    const projectId = thisProjectId;
    const status = get_stageStatus({ projectId, stagePath }) || StageStatus.None;
    const bsStyle = stageStatusBsStyles[status];
    const newStatus = getToggleStatus(status);
    const isStageContributor = get_isStageContributor({ uid, projectId, stagePath });

    const header = (
      <Flexbox justifyContent="space-between" alignItems="center">
        <Flexbox>
          <span>{`${order + 1}. ${title}`}</span>
        </Flexbox>
        <Flexbox>
          <StageStatusBar stagePath={stagePath} />
        </Flexbox>
      </Flexbox>
    );


    ///className="full-width no-margin no-shadow no-border project-stage-panel"

    /*
     * TODO: update stageFinishTime
     * TODO: when updating last child, update parent status as well
     * TODO: determine stage status from aggregation of individual user statuses
     * TODO: add forms
     * TODO: add proper buttons for different actors in stage
     * TODO: proper layout
     * TODO: When "finish" stage is "finished", also finish entire project
     */

    return (
      <Panel header={header}
        className="full-width no-margin project-stage-panel"
        bsStyle={bsStyle}>
        <div>
          <Button onClick={setNone} bsStyle="info">
            Reset status
          </Button>

          <Button onClick={setFinished} bsStyle="success">
            Finish
          </Button>

          <Button onClick={setFailed} bsStyle="danger">
            Fail
          </Button>
        </div>
        {isStageContributor && <div>
          <Button onClick={setContributorNone} bsStyle="info">
            Reset own status
          </Button>

          <Button onClick={setContributorFinished} bsStyle="success">
            Finish own
          </Button>

          <Button onClick={setContributorFailed} bsStyle="danger">
            Fail own
          </Button>
        </div>}

        {children}
      </Panel>
    );
  }
  );
ProjectStageView.propTypes = {
  stageNode: PropTypes.object.isRequired
};

const ProjectStageArrow = dataBind()(
  ({ thisProjectId, previousStagePath }, { get_stageStatus }) => {
    const stageStatus = get_stageStatus({ projectId: thisProjectId, stagePath: previousStagePath });
    const status = stageStatus || StageStatus.None;
    const style = stageStatusStyles[status];
    return (<FAIcon name="arrow-down" size="4em" style={style} />);
  }
);


// ###########################################################################
// ProjectControlView
// ###########################################################################




const ProjectTree = dataBind()(
  ({ thisProjectId }, { get_stageEntries }) => {
    const stageEntries = get_stageEntries({ projectId: thisProjectId });
    return (<div className="full-width" data-name="ProjectTree">
      {projectStageTree.traverse(stageEntries, genStageNode)}
    </div>);
  }
);

function genStageNode(node, stagePath, stageEntry, children) {
  const customRender = stageRenderers[node.stageId];
  return (
    <Flexbox key={node.stageId} className="full-width"
      flexDirection="column"
      justifyContent="center" alignItems="center">
      <Flexbox className="full-width">
        <ProjectStageView
          stageNode={node}
          stagePath={stagePath}
          stageEntry={stageEntry}>

          {customRender &&
            customRender(node, stagePath, stageEntry, children)}

          {children}
        </ProjectStageView>
      </Flexbox>
      {!!node.next &&
        <Flexbox style={{ display: 'flex' }} justifyContent="center">
          <ProjectStageArrow previousStagePath={stagePath} />
        </Flexbox>
      }
    </Flexbox>
  );
}

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