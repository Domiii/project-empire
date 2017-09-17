import {
  ProjectStages,
  StageStatus
} from 'src/core/projects/ProjectStagesRef';

import { EmptyObject, EmptyArray } from 'src/util';

import map from 'lodash/map';
import mapValues from 'lodash/mapValues';
import filter from 'lodash/filter';
import flatMap from 'lodash/flatMap';

import React from 'react';
import PropTypes from 'prop-types';
import { Flex, Item } from 'react-flex';
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
  if (stage.id === 'prepare') {
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
  // TODO: party member vs. reviewer
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
function StageStatusBar({stage}) {
  const stageContributors = getStageContributors(stage);
  //return (<StageStatusIcon status={status} />);
  return (<div>
    { map(stageContributors, user =>
      <StageContributorIcon 
        user={user}
        status={getStageContributorStatus(user, stage)}
      /> )
    }
  </div>);
}
StageStatusBar.propTypes = {
  stage: PropTypes.object.isRequired
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
// Project graph + stage logic
// ####################################################

export function ProjectStageView({node}) {
  const title = stage.title;
  const status = getStageStatus(stage);
  const bsStyle = statusBsStyles[status];
  const otherEls = stage.children && (<div>
    <Well>{stage.description}</Well>
    <ProjectStagesList stages={stage.children} />
  </div>);

  const header = (
    <Flex row justifyContent="space-between" alignItems="center">
      <Item>
        <span>{`${i+1}. ${title}`}</span>
      </Item>
      <Item>
        <StageStatusBar stage={stage} />
      </Item>
    </Flex>
  );


// TODO: render actual view for stage

  return (<div>
    <Panel header={header} className="no-margin"
      bsStyle={bsStyle}>
      {otherEls}
    </Panel>
  </div>);
}
ProjectStageView.propTypes = {
  node: PropTypes.object.isRequired
};

function ProjectStageArrow({previousStage}) {
  const status = getStageStatus(previousStage);
  const style = statusStyles[status];
  return (<FAIcon name="arrow-down" size="4em" style={style} />);
}
ProjectStageArrow.propTypes = {
  previousStage: PropTypes.object.isRequired
};

export function ProjectStagesList({stages}) {
  // interject stages with arrows
  stages = filter(stages, stage => !!stage.id);
  let els = map(stages, (stage, i) => {
    const nextStage = (i < stages.length-1) && stages[i+1];
    return (<div key={i} className="full-width">
      <Item className="full-width">
        <ProjectStageView i={i} 
          stage={stage} stages={stages}
        />
      </Item>
      { !!nextStage && 
        <Item style={{display: 'flex'}} justifyContent="center" flex="1" >
          <ProjectStageArrow previousStage={stage} />
        </Item>
      }
    </div>);
  });

  return (
    <Flex column justifyContent="center" alignItems="center">
      { els }
    </Flex>
  );
}
ProjectStagesList.propTypes = {
  stages: PropTypes.array.isRequired
};

// ####################################################
// ProjectControlView
// ####################################################

export default function ProjectControlView() {
  return (
    <ProjectStagesList stages={ProjectStages} />
  );
}