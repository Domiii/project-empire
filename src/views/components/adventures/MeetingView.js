import MeetingsRef from 'src/core/adventures/MeetingsRef';

import pickBy from 'lodash/pickBy';
import isEmpty from 'lodash/isEmpty';

import { EmptyObject, EmptyArray } from 'src/util';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { firebaseConnect } from 'react-redux-firebase'
import autoBind from 'react-autobind';

import {
  Panel, Button, ListGroup, ListGroupItem, Alert, Badge
} from 'react-bootstrap';

import { FAIcon } from 'src/views/components/util';

import UserList from 'src/views/components/users/UserList';


/*
// TODO: party prep checklist (with "i'm ready" check)
// TODO: render individual party member status
// TODO: renderPrepOverview (must be close to "status")
// TODO: GM: startMeeting action
// TODO: GM (go) feedback (and party can see it)
// TODO: party final feedback
// TODO: finishMeeting action
// TODO: finishAdventure action
// TODO: archive adventure action
*/

// #################################
// Meeting core stuff
// #################################

export const MeetingPrepStatus = {
  NotStarted: 0,
  Preparing: 1,
  Done: 2
};

export const MeetingStatus = {
  NotStarted: 0,
  InProgress: 1,
  Finished: 2
};

const activeMeetingQuery = meeting => !!meeting.active;
const inactiveMeetingQuery = meeting => !meeting.active;
const defaultActiveMeetings = Object.freeze([{}]);

export function groupActiveMeetings(allMeetings) {
  let activeMeetings = pickBy(allMeetings, 
    activeMeetingQuery);
  activeMeetings = !isEmpty(activeMeetings) ?
    activeMeetings :
    defaultActiveMeetings;

  const archivedMeetings = pickBy(allMeetings,
    inactiveMeetingQuery);
  return [activeMeetings, archivedMeetings];
}

export function createNewMeeting(meetingsRef) {
  return meetingsRef.push_meeting({active: 1});
}

export function ensureMeetingExists(
  meetingsRef, meetingId) {

  if (!meetingId) {
    return createNewMeeting(meetingsRef);
  }
  return Promise.resolve();
}

export function updateMeetingPrep(
  meetingsRef, meetingId, uid, prep) {
  ensureMeetingExists(meetingsRef, meetingId).
  then(() => meetingsRef.set_preparation(meetingId, uid, prep));
}

export function updateMeetingStatus() {
  
}


// #################################
// Meeting UI
// #################################

export class MeetingStatusView extends Component {
  static contextTypes = {
    currentUserRef: PropTypes.object.isRequired
  };

  static propTypes = {
    meetingId: PropTypes.string.isRequired,
    meeting: PropTypes.object.isRequired,

    adventureId: PropTypes.string.isRequired,
    adventure: PropTypes.object.isRequired,
    users: PropTypes.object,
    adventureGuardian: PropTypes.object,
    assignedGM: PropTypes.object
  };

  constructor() {
    super();

    autoBind(this);
  }

  renderPartyMember() {
    return (<Badge>
      <img src={user.photoURL} className="user-image-tiny" /> &nbsp;
      {user.displayName}
      &nbsp;

    </Badge>);
  }

  renderPartyStatus() {
    const {
      users
    } = this.props;

    // TODO: each party member's current status
    return (<UserList users={users}
      renderUser={this.renderPartyMember} />);
  }

  render() {
    return (<div>
      { this.renderPartyStatus() }
    </div>);
  }
}

export class MeetingPrepUserDetails extends Component {
  static contextTypes = {
    currentUserRef: PropTypes.object.isRequired
  };

  static propTypes = {
    meetingId: PropTypes.string.isRequired,
    meeting: PropTypes.object.isRequired,
    
    adventureId: PropTypes.string.isRequired,
    adventure: PropTypes.object.isRequired,
    users: PropTypes.object,
    adventureGuardian: PropTypes.object,
    assignedGM: PropTypes.object
  };

  render() {
    return (<ol>
      <li>
        <Panel header="作品 checklist">
        TODO
        </Panel>
      </li>
      <li>
        <Panel header="簡報 checklist">
        TODO
        </Panel>
      </li>
      <li>
        <Panel header="團隊鑑定 checklist">
        TODO
        </Panel>
      </li>
    </ol>);
  }
}

export class MeetingPrepUserDetailsEditor extends Component {
  static contextTypes = {
    currentUserRef: PropTypes.object.isRequired
  };

  static propTypes = {
    meetingId: PropTypes.string.isRequired,
    meeting: PropTypes.object.isRequired,
    
    adventureId: PropTypes.string.isRequired,
    adventure: PropTypes.object.isRequired,
    users: PropTypes.object,
    adventureGuardian: PropTypes.object,
    assignedGM: PropTypes.object
  };

  // TODO: partySubmitMeetingPrep
  // TODO: form
  render() {
    return (<div>
      <ol>
        <li>
          <Panel header="作品 checklist">
          TODO
          </Panel>
        </li>
        <li>
          <Panel header="簡報 checklist">
          TODO
          </Panel>
        </li>
        <li>
          <Panel header="團隊鑑定 checklist">
          TODO
          </Panel>
        </li>
      </ol>

      <Button block bsStyle="danger"
        active={ userPrepStatus !== MeetingPrepStatus.Done }
        onClick={ () => setUserPrepStatus(MeetingPrepStatus.Done) }>
        我準備好了！送出去～
      </Button>
    </div>);
  }
}


export class MeetingPrepView extends Component {
  static contextTypes = {
    currentUserRef: PropTypes.object.isRequired
  };

  static propTypes = {
    meetingId: PropTypes.string.isRequired,
    meeting: PropTypes.object.isRequired,
    
    adventureId: PropTypes.string.isRequired,
    adventure: PropTypes.object.isRequired,
    users: PropTypes.object,
    adventureGuardian: PropTypes.object,
    assignedGM: PropTypes.object
  };

  get IsAdmin() {
    const { currentUserRef } = this.context;
    return currentUserRef && currentUserRef.isAdminDisplayMode() || false;
  }

  get IsInThisParty() {
    // TODO
    return true;
  }

  // renderGMStatus() {
  //   return (<p>
  //     GM status: <span className="color-gray">no assigned GM</span>
  //   </p>);
  // }

  renderOwnPrepView() {
    if (!this.IsInThisParty) {
      return null;
    }

    const userPrepStatus = MeetingPrepStatus.preparing;
    const userPrepData = null;
    const isPreparing = userPrepStatus === MeetingPrepStatus.Preparing;
    const isDone = userPrepStatus === MeetingPrepStatus.Done;

    return (<div>
      <Alert bsStyle="warning">
        你還沒開始準備囉～
      </Alert>
      <Button block bsStyle="danger"
        active={ isPreparing }
        disabled={ isPreparing }
        onClick={ () => setUserPrepStatus(MeetingPrepStatus.Preparing) }>
        { !isDone ? '開始準備！' : '我雖然已經準備好了，但是想改東西了' }
      </Button>

      { isPreparing && 
        <MeetingPrepUserDetailsEditor {...this.props} /> }
      { isDone && 
        <MeetingPrepUserDetails {...this.props} /> }
    </div>);
  }

  render() {
    return (<div>
      { /*this.renderGMStatus()*/ }
      { this.renderOwnPrepView() }
    </div>);
  }
}

export class MeetingGoView extends Component {
  static contextTypes = {
    currentUserRef: PropTypes.object.isRequired
  };

  static propTypes = {
    meetingId: PropTypes.string.isRequired,
    meeting: PropTypes.object.isRequired,
    
    adventureId: PropTypes.string.isRequired,
    adventure: PropTypes.object.isRequired,
    users: PropTypes.object,
    adventureGuardian: PropTypes.object,
    assignedGM: PropTypes.object
  };

  get IsAdmin() {
    const { currentUserRef } = this.context;
    return currentUserRef && currentUserRef.isAdminDisplayMode() || false;
  }


  renderPrepOverview() {
    // TODO: anyone in the party can also see it!?
    if (!this.IsAdmin) {
      return null;
    }

    return (<div>
      TODO: GM 可以看到 party 所有人的　『團隊鑑定準備』　結果
    </div>);
  }


  renderGMView() {
    if (!this.IsAdmin) {
      return null;
    }

    // TODO: set startTime

    return (<Panel header="GM 區域">
      <Button bsStyle="danger"
        active={ window.gming }
        onClick={() => { window.gming = !window.gming; this.setState({gming: window.gming}); }}>
        開始進行 團隊鑑定!
      </Button>

      { window.gming && 
        (<Panel header="團隊鑑定紀錄">
          <Panel header="狀況">
           TODO：　遲到，準備的完整度
           TODO: 所有 checklist 的 counter-checking?
          </Panel>
          <Panel header="最後結果">
           TODO
          </Panel>
          <Panel header="獎勵區">
           TODO: 用 text 來紀錄 fame, karma + gold　（隔週才能分配＋看到結果）
          </Panel>
        </Panel>)
      }
    </Panel>);
  }

  render() {
    return (<div>
      { this.renderPrepOverview() }
      { this.renderGMView() }
    </div>);
  }
}

export class MeetingResultsView extends Component {
  static contextTypes = {
    currentUserRef: PropTypes.object.isRequired
  };

  static propTypes = {
    meetingId: PropTypes.string.isRequired,
    meeting: PropTypes.object.isRequired,
    
    adventureId: PropTypes.string.isRequired,
    adventure: PropTypes.object.isRequired,
    users: PropTypes.object,
    adventureGuardian: PropTypes.object,
    assignedGM: PropTypes.object
  };

  get IsAdmin() {
    const { currentUserRef } = this.context;
    return currentUserRef && currentUserRef.isAdminDisplayMode() || false;
  }

  renderMeetingResults() {
    const meetingStatus = MeetingStatus.InProgress;

    if (!meetingStatus) {
      return (<Alert bsStyle="warning">這次團隊鑑定還沒結束</Alert>);
    }
    return (<div>
      TODO: 冒險者可以看到 『團隊鑑定』 的結果
    </div>);
  }

  render() {
    return (<Panel header="團隊鑑定　－　結果">
      { this.renderMeetingResults() }
    </Panel>);
  }
}

export class MeetingArchive extends Component {
  static contextTypes = {
    currentUserRef: PropTypes.object.isRequired
  };

  static propTypes = {
    meetingId: PropTypes.string.isRequired,
    meeting: PropTypes.object.isRequired,
    
    adventureId: PropTypes.string.isRequired,
    adventure: PropTypes.object.isRequired,
    users: PropTypes.object,
    adventureGuardian: PropTypes.object,
    assignedGM: PropTypes.object,

    archivedMeetings: PropTypes.object
  };

  get IsAdmin() {
    const { currentUserRef } = this.context;
    return currentUserRef && currentUserRef.isAdminDisplayMode() || false;
  }

  render() {
    const {
      archivedMeetings
    } = this.props;

    // TODO: render differently from active meetings?

    return (<div>{ map(archivedMeetings || EmptyObject,
      (meeting, meetingId) =>
        (<MeetingView {...props}
          key={meetingId}
          meetingId={meetingId}
          meeting={meeting} 
          />)
    )}</div>);
  }
}

export default class MeetingView extends Component {
  static contextTypes = {
    currentUserRef: PropTypes.object.isRequired
  };

  static propTypes = {
    meetingId: PropTypes.string.isRequired,
    meeting: PropTypes.object.isRequired,

    adventureId: PropTypes.string.isRequired,
    adventure: PropTypes.object.isRequired,
    users: PropTypes.object,
    adventureGuardian: PropTypes.object,
    assignedGM: PropTypes.object
  };

  get IsAdmin() {
    const { currentUserRef } = this.context;
    return currentUserRef && currentUserRef.isAdminDisplayMode() || false;
  }


  // TODO: highlight the phase of the meeting that is currently most relevant!
      // (prep vs. go vs. results)

  render() {
    const props = this.props;

    return (<div>
      <MeetingStatusView {...props} />
      <MeetingPrepView {...props} />
      <MeetingGoView {...props} />
      <MeetingResultsView {...props} />
    </div>);
  }
}


/**
 * The panel that renders all meetings belonging to an adventure
 */
@connect(({ firebase }, prop) => {
  return {
    // TODO: provide all data!??!
  };
})
export class AdventureMeetingPanel extends Component {
  static contextTypes = {
    currentUserRef: PropTypes.object.isRequired
  };

  static propTypes = {
    adventureId: PropTypes.string.isRequired,
    adventure: PropTypes.object.isRequired,
    users: PropTypes.object,
    adventureGuardian: PropTypes.object,
    assignedGM: PropTypes.object,

    meetings: PropTypes.object
  };

  render() {
    const props = this.props;
    const [activeMeetings, archivedMeetings] = 
      groupActiveMeetings(this.props.meetings);

    return (<div>
      <Panel header="團隊鑑定">
        { map(activeMeetings, (meeting, meetingId) =>
          (<MeetingView {...props}
            key={meetingId}
            meetingId={meetingId}
            meeting={meeting} 
            />)
        )}
      </Panel>
      <Panel header="團隊鑑定歸檔紀錄">
        <MeetingArchive {...props}
          archivedMeetings={archivedMeetings} 
          />
      </Panel>
    </div>);
  }
}