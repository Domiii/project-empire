import {
  ProjectStageTree,
  StageStatus
} from 'src/core/projects/ProjectDef';

import { EmptyObject, EmptyArray } from 'src/util';

import map from 'lodash/map';
import mapValues from 'lodash/mapValues';
import filter from 'lodash/filter';
import flatMap from 'lodash/flatMap';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Flex, Item } from 'react-flex';
import { firebaseConnect } from 'react-redux-firebase';
import { 
  Panel, Button, Alert, Well
} from 'react-bootstrap';

import FAIcon from 'src/views/components/util/FAIcon';


// ####################################################
// Getters + Enums
// ####################################################

function getStageStatus(stage) {
  if (stage.noStatus) {
    return StageStatus.None;
  }
  if (stage.stageDef.id === 'prepare') {
    return StageStatus.Finished;
  }
  return StageStatus.None;
  // TODO
}

function getStageContributors() {
  // TODO: get all contributors (party members, reviewer, guardian, etc...)
}

function getStageContributorStatus(user, stage) {
  // TODO: How to update or determine the stage status of any contributor?
  return 1;
}


// ####################################################
// Renderers
// ####################################################


const statusStyles = {
  [StageStatus.None]: {
    color: 'lightgray'
  },
  [StageStatus.NotStarted]: {
    color: 'lightgray'
  },
  [StageStatus.Started]: {
    color: 'gray'
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
    name: ''
  },
  [StageStatus.NotStarted]: {
    name: ''
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


const renderers = {

};
function StageStatusIcon({ status, ...props }) {
  const iconCfg = statusIcons[status];
  const style = statusStyles[status];
  return (<FAIcon {...iconCfg} style={style} {...props} />);
}
StageStatusIcon.propTypes = {
  status: PropTypes.number.isRequired
};

function StageContributorIcon({user, status, groupName}) {
  // TODO: groupName classes
  const classes = 'project-contributor project-contributor-' + groupName;
  return (
    <div className={classes} style={{backgroundImage: 'url(' + user.photoURL + ')'}}>
      { status && 
        <StageStatusIcon status={status} 
          className=".project-contributor-status-icon" />
      }
    </div>
  );
}
StageContributorIcon.propTypes = {
  groupName: PropTypes.string.isRequired,
  status: PropTypes.number,
  user: PropTypes.object.isRequired
};

// Render icon + status of all responsible contributors for given stage
function StageStatusBar({stageNode}) {
  const stageContributors = getStageContributors(stageNode);
  //return (<StageStatusIcon status={status} />);
  return (<div>
    { map(stageContributors, user =>
      <StageContributorIcon 
        groupName={'???'}
        user={user}
        status={getStageContributorStatus(user, stageNode)}
      /> )
    }
  </div>);
}
StageStatusBar.propTypes = {
  stageNode: PropTypes.object.isRequired
};


// ####################################################
// Util
// ####################################################
/**
 * Creates new array with new element interjected 
 * between any two existing elements.
 * The given callback returns the interjected element
 * for the three arguments: arr[index], arr[index+1], index.
 * @see https://stackoverflow.com/questions/31879576/what-is-the-most-elegant-way-to-insert-objects-between-array-elements
 */
function interject(arr, cb) {
  return flatMap(arr, (value, index, array) =>
    array.length -1 !== index  // insert new object only if not already at the end
    ? [value, cb(value, arr[index+1], index)]
    : value
  );
}

// ####################################################
// Actions
// ####################################################


// ####################################################
// Project tree + stage logic
// ####################################################


// TODO: Hook up to db
// TODO: ProjectsRef, ProjectStagesRef, MissionsRef, UserInfoRef

export function ProjectStageView({stageNode}) {
  const stageDef = stageNode.stageDef;
  const title = stageDef.title;

  const order = stageNode.order;
  const status = getStageStatus(stageNode);
  const bsStyle = statusBsStyles[status];

  const header = (
    <Flex row justifyContent="space-between" alignItems="center">
      <Item>
        <span>{`${order+1}. ${title}`}</span>
      </Item>
      <Item>
        <StageStatusBar stageNode={stageNode} />
      </Item>
    </Flex>
  );

  return (<div>
    <Panel header={header} className="no-margin no-shadow no-border project-stage-panel"
      bsStyle={bsStyle}>
      { stageNode.firstChild && (
        <div>
          <ProjectStagesView stageNode={stageNode.firstChild} />
        </div>
      )}
    </Panel>
  </div>);
}
ProjectStageView.propTypes = {
  stageNode: PropTypes.object.isRequired
};

function ProjectStageArrow({previousNode}) {
  const status = getStageStatus(previousNode);
  const style = statusStyles[status];
  return (<FAIcon name="arrow-down" size="4em" style={style} />);
}
ProjectStageArrow.propTypes = {
  previousNode: PropTypes.object.isRequired
};

export function ProjectStagesView({stageNode}) {
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
            { !!node.next && 
              <Item style={{display: 'flex'}} justifyContent="center" flex="1" >
                <ProjectStageArrow previousNode={node} />
              </Item>
            }
          </div>);
        })
      }
    </Flex>
  );
}
ProjectStagesView.propTypes = {
  stageNode: PropTypes.object.isRequired
};


// ####################################################
// ProjectControlView
// ####################################################

@firebaseConnect((props, firebase) => {
  
})
@connect(({ firebase }, props) => {
  return {
  }; 
})
export default class ProjectControlView extends Component {
  render() {
    console.log('ProjectControlView.render');
    return (
      <ProjectStagesView stageNode={ProjectStageTree.root} />
    );
  }
}