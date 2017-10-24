import Roles from 'src/core/users/Roles';

import {
  projectStageTree,
  StageStatus,
  StageContributorStatus,
  isStageStatusOver
} from 'src/core/projects/ProjectDef';

import ProjectStageForms from 'src/core/projects/ProjectStageForms';

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

//import stageFormRenderers from './stageFormRenderers';


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


const customStageRenderers = {
  prepare(node, previousPath, path, stageEntry, children) {

  },
  sprint(node, previousPath, path, stageEntry, children, iteration) {

  },
  execution(node, previousPath, path, stageEntry, children) {

  },
  partyPrepareMeeting(node, previousPath, path, stageEntry, children) {

  },
  reviewerPrepareMeeting(node, previousPath, path, stageEntry, children) {

  },
  holdMeeting(node, previousPath, path, stageEntry, children) {

  },
  postSprintReflection(node, previousPath, path, stageEntry, children) {

  },
  wrapup(node, previousPath, path, stageEntry, children) {

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
  ({ projectId, stagePath, groupName, uid },
    { userPublic, stageContributorStatus }) => {
    const isStatusLoaded = !uid || stageContributorStatus.isLoaded({ projectId, stagePath, uid });
    const isUserLoaded = !uid || userPublic.isLoaded({ uid });
    const userStatus = isUserLoaded && uid && stageContributorStatus({ projectId, stagePath, uid }) ||
      StageContributorStatus.None;
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
  stagePath: PropTypes.string.isRequired
};



// ###########################################################################
// Project tree + stage logic
// ###########################################################################

function getToggleStatus(oldStatus) {
  const isDone = isStageStatusOver(oldStatus);
  return isDone ? StageStatus.None : StageStatus.Finished;
}

const ActiveStageContent = dataBind({
  toggleStageStatus(evt, { thisProjectId, stagePath },
    { get_stageStatus, updateStageStatus }) {
    const oldStatus = get_stageStatus({ projectId: thisProjectId, stagePath }) || StageStatus.None;

    const newStatus = getToggleStatus(oldStatus);
    updateStageStatus({ projectId: thisProjectId, stagePath }, newStatus);
  },

  setNone(evt, { thisProjectId, stagePath },
    { updateStageStatus },
    { currentUid }) {
    const uid = currentUid;
    const projectId = thisProjectId;
    updateStageStatus({ projectId, uid, stagePath, status: StageStatus.None });
  },
  setFinished(evt, { thisProjectId, stagePath },
    { updateStageStatus },
    { currentUid }) {
    const uid = currentUid;
    const projectId = thisProjectId;
    updateStageStatus({ projectId, uid, stagePath, status: StageStatus.Finished });
  },
  setFailed(evt, { thisProjectId, stagePath },
    { updateStageStatus },
    { currentUid }) {
    const uid = currentUid;
    const projectId = thisProjectId;
    updateStageStatus({ projectId, uid, stagePath, status: StageStatus.Failed });
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
  ({ thisProjectId, stagePath, children }, {
    get_isStageContributor,
    setFinished, setNone, setFailed,
    setContributorFinished, setContributorNone, setContributorFailed
  }, {
    currentUid, isCurrentUserGuardian
  }) => {
    const stageNode = projectStageTree.getNodeByPath(stagePath);
    const uid = currentUid;
    const projectId = thisProjectId;
    const isStageContributor = get_isStageContributor({ uid, projectId, stagePath });

    return (<div>
      {children}

      {!stageNode.hasChildren &&
        <div className="right-bound">
          {isStageContributor &&
            <div>
              <Button onClick={setContributorNone} bsStyle="info">
                <FAIcon name="undo" /> Reset
              </Button>

              <Button onClick={setContributorFinished} bsStyle="success">
                <FAIcon name="check" /> Done
              </Button>
            </div>
          }

          {isCurrentUserGuardian &&
            <div>
              {isCurrentUserGuardian}
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
          }
        </div>
      }
    </div>);
  }
  );
ActiveStageContent.propTypes = {
  //previousStagePath: PropTypes.string,
  stagePath: PropTypes.string
};

const ProjectStageView = dataBind({
})(
  ({ previousStagePath, stagePath, thisProjectId, children },
    { get_stageStatus, get_stageEntry },
    { }) => {
    const stageNode = projectStageTree.getNodeByPath(stagePath);
    const stageDef = stageNode.stageDef;

    if (!stageDef) {
      // root node
      return <div className="full-width">{children}</div>;
    }

    const title = stageDef.title;
    const order = stageNode.order;
    const projectId = thisProjectId;
    const previousStageStatus = get_stageStatus({ projectId, stagePath: previousStagePath });
    const stageEntry = get_stageEntry({ projectId, stagePath });
    const status = stageEntry && stageEntry.status || StageStatus.None;

    let bsStyle;
    const isActive = stageNode.isFirstChild ||
      //stageEntry ||
      isStageStatusOver(previousStageStatus);

    if (isActive) {
      bsStyle = stageStatusBsStyles[status];
    }
    else {
      bsStyle = 'default';
    }

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
DONE:
* Fix tree rendering
* write stageEndTime when ending stage
* when updating last stage in node, update parent status as well
* When last stage is "finished", also finish entire project
* Fix handling of multiple groups of contributors

TODO:
* Condense mission overview into a single row
    * When too long, use slider/scrolling
    * Separate between: line of stage progression + separate ContributorStatuses (and their stats)
* Display forms of stages
  * Contributors can fill out forms (under right circumstances)
  * GM can overview all form results
* Add Conditions for "finishing" stages
  * determine stage status from aggregation of individual user statuses (if not overridden)
* handle project archiving properly
* allow project team editing to add "any user" (not just users w/o project)
* feature: Admin can change own user for debugging (through FirebaseAuthDataProvider)
* basic performance optimizations
* feature: add iterations for repeatable nodes
     */

    return (
      <Panel header={header}
        className="full-width no-margin project-stage-panel"
        bsStyle={bsStyle}>
        {isActive &&
          <ActiveStageContent
            stagePath={stagePath}>
            {children}
          </ActiveStageContent>
        }
        {
          map(stageNode.forms, form => {
            const {
              id
            } = form;
            const formData = ProjectStageForms[id];
            return ;
          })
        }
      </Panel>
    );
  }
  );
ProjectStageView.propTypes = {
  previousStagePath: PropTypes.string,
  stagePath: PropTypes.string
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
      {projectStageTree.traverse(stageEntries, renderStageNode)}
    </div>);
  }
);

function renderStageNode(node, previousStagePath, stagePath, stageEntry, children) {
  const customRender = customStageRenderers[node.stageId];
  return (
    <Flexbox key={stagePath} className="full-width"
      flexDirection="column"
      justifyContent="center" alignItems="center">
      <Flexbox className="full-width">
        <ProjectStageView
          previousStagePath={previousStagePath}
          stagePath={stagePath}
          stageEntry={stageEntry}>

          {customRender &&
            customRender(node, previousStagePath, stagePath, stageEntry, children)}

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