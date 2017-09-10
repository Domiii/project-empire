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


/*

// TODO: startMeeting action
// TODO: editMeeting / saveMeeting action
      // support ctrl/command + s for saving meeting record
// TODO: finishMeeting action
// TODO: finishAdventure action
*/

export class MeetingStatusView extends Component {
  renderPartyStatus() {
    // TODO: each party member's current status
    return (<UserList />);
  }

  render() {
    return (<div>
      { this.renderPartyStatus() }
    </div>);
  }
}

export class MeetingPrepUserDetails extends Component {
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
        onClick={ setUserPrepStatus(MeetingPrepStatus.Done); }>
        我準備好了！送出去～
      </Button>
    </div>);
  }
}


export class MeetingPrepView extends Component {
  static contextTypes = {
    currentUserRef: PropTypes.object.isRequired
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
        onClick={ setUserPrepStatus(MeetingPrepStatus.Preparing); }>
        { !isDone ? '開始準備！' : '我雖然已經準備好了，但是想改東西了' }
      </Button>

      { isPreparing && <MeetingPrepUserDetailsEditor /> }
      { isDone && <MeetingPrepUserDetails /> }
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

  get IsAdmin() {
    const { currentUserRef } = this.context;
    return currentUserRef && currentUserRef.isAdminDisplayMode() || false;
  }


  renderPrepOverview() {
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

      {window.gming && <Panel header="團隊鑑定紀錄">
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
      </Panel>
      }
    </Panel>);
  }

  render() {
    return (<div>
      { this.renderPrepOverview() }
      { this.renderGMView() }
    }
    </div>);
  }
}

export class MeetingResultsView extends Component {
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

  get IsAdmin() {
    const { currentUserRef } = this.context;
    return currentUserRef && currentUserRef.isAdminDisplayMode() || false;
  }

  render() {
    return (<div>
        TODO: 顯示之前的團隊鑑定列單在這裡
      </div>);
  }
}

export default class MeetingView extends Component {
  static contextTypes = {
    currentUserRef: PropTypes.object.isRequired
  };

  get IsAdmin() {
    const { currentUserRef } = this.context;
    return currentUserRef && currentUserRef.isAdminDisplayMode() || false;
  }


  // TODO: highlight the phase of the meeting that is currently most relevant!
      // (prep vs. go vs. results)

  render() {
    return (<div>
      <MeetingStatusView />
      <MeetingPrepView />
      <MeetingGoView />
      <MeetingResultsView />
    </div>);
  }
}


/**
 * The panel that renders all meetings belonging to an adventure
 */
export class AdventureMeetingPanel extends Component {
  render() {
    return (<div>
      <Panel header="團隊鑑定">
        <MissionView />
      </Panel>
      <Panel header="之前的團隊鑑定">
        <MeetingArchive />
      </Panel>
    </div>);
  }
}