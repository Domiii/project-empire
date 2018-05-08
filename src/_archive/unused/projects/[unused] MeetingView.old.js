// import MeetingsRef, {
//   meetingPrepItems,
//   MeetingPrepStatus, 
//   MeetingStatus,
//   groupActiveMeetings,

//   setMeetingPrep
// } from 'src/core/projects/MeetingsRef';

// import map from 'lodash/map';
// import pickBy from 'lodash/pickBy';
// import isEmpty from 'lodash/isEmpty';

// import { EmptyObject, EmptyArray } from 'src/util';

// import React, { Component } from 'react';
// import PropTypes from 'prop-types';
// import autoBind from 'react-autobind';

// import {
//   Panel, Button, ListGroup, ListGroupItem, Alert, Badge
// } from 'react-bootstrap';

// import { FAIcon } from 'src/views/components/util';

// import UserList from 'src/views/components/users/UserList';

// import FormInputView from 'src/views/components/forms/FormInputView';

// /*
// 緊急 TODO:

// 1. prep: form input specs
// 2. prep: input type renderers
// 3. user display in title bar + 身分切換功能 (+ warning)
// 4. prep: form
// 5. prep: own view
// 6. prep: table (all) view
// 7. prep: meeting + prep status view
// */

// /*
// // TODO: party prep checklist (with "i'm ready" check)
// // TODO: render individual party member status
// // TODO: renderPrepOverview (must be close to "status")
// // TODO: GM: startMeeting action
// // TODO: GM (go) feedback (and party can see it)
// // TODO: party final feedback
// // TODO: finishMeeting action
// // TODO: finishProject action
// // TODO: archive project action
// */


// // #################################
// // Meeting UI
// // #################################

// export class MeetingStatusView extends Component {
//   static contextTypes = {
//     currentUserRef: PropTypes.object.isRequired
//   };

//   static propTypes = {
//     meetingId: PropTypes.string,
//     meeting: PropTypes.object,

//     uid: PropTypes.string.isRequired,
//     projectId: PropTypes.string.isRequired,
//     project: PropTypes.object.isRequired,
//     users: PropTypes.object,
//     projectGuardian: PropTypes.object,
//     reviewer: PropTypes.object
//   };

//   constructor() {
//     super();

//     autoBind(this);
//   }

//   renderPartyMember({user, uid}) {
//     return (<Badge>
//       <img src={user.photoURL} className="user-image-tiny" /> &nbsp;
//       {user.displayName}
//       &nbsp;

//     </Badge>);
//   }

//   renderPartyStatus() {
//     const {
//       users
//     } = this.props;

//     // TODO: each party member's current status
//     return (<UserList 
//       users={users}
//       renderUser={this.renderPartyMember} 
//             />);
//   }

//   render() {
//     return (<div>
//       { this.renderPartyStatus() }
//     </div>);
//   }
// }

// export class MeetingPrepUserDetails extends Component {
//   static contextTypes = {
//     currentUserRef: PropTypes.object.isRequired
//   };

//   static propTypes = {
//     meetingId: PropTypes.string,
//     meeting: PropTypes.object,
    
//     uid: PropTypes.string.isRequired,
//     projectId: PropTypes.string.isRequired,
//     project: PropTypes.object.isRequired,
//     users: PropTypes.object,
//     projectGuardian: PropTypes.object,
//     reviewer: PropTypes.object
//   };

//   render() {
//     return (<ol>
//       <li>
//         <Panel header="作品 checklist">
//         TODO
//         </Panel>
//       </li>
//       <li>
//         <Panel header="簡報 checklist">
//         TODO
//         </Panel>
//       </li>
//       <li>
//         <Panel header="團隊鑑定 checklist">
//         TODO
//         </Panel>
//       </li>
//     </ol>);
//   }
// }

// // @firebaseConnect(({ meetingId, uid, projectId }, firebase) => {
// //   const meetingPrepPath = MeetingsRef.meeting.makeQuery({
// //         meetingId
// //       }, {
// //         projectId
// //       });
// //   console.log(meetingPrepPath);
// //   return [
// //     meetingPrepPath
// //   ];
// // })
// @dataBind(({ firebase }, { projectId, meetingId, meeting, uid }) => {
//   const meetingsRef = MeetingsRef(firebase);

//   //console.log(Object.keys(firebase.data), firebase.data.meetings)

//   const submit = newValues => 
//     setMeetingPrep(meetingsRef, projectId, meetingId, uid, newValues);

//   const allValues = meeting.preparations && 
//     meeting.preparations[uid];

//   return {
//     allValues,
//     submit
//     //submit: vals => console.log(vals)
//   };
// })
// export class MeetingPrepUserDetailsEditor extends Component {
//   static contextTypes = {
//     currentUserRef: PropTypes.object.isRequired
//   };

//   static propTypes = {
//     meetingId: PropTypes.string,
//     meeting: PropTypes.object,
    
//     uid: PropTypes.string.isRequired,
//     projectId: PropTypes.string.isRequired,
//     project: PropTypes.object.isRequired,
//     users: PropTypes.object,
//     projectGuardian: PropTypes.object,
//     reviewer: PropTypes.object,

//     allValues: PropTypes.object,
//     submit: PropTypes.func.isRequired
//   };

//   render() {
//     const {
//       meetingId,
//       allValues,
//       submit
//     } = this.props;

//     // TODO: connect to database
//     // TODO: submitPartyMeetingPrep action
//     // TODO: meeting status + project view "prep toggle"

//     const context = this.props;

//     return (<div>
//       <FormInputView
//         className="meetingPrepForm"
//         name={'meeting_' + meetingId}
//         format={meetingPrepItems} 
//         context={context}
//         allValues={allValues} 
//         onSubmit={submit}
//       />
//       <pre>{JSON.stringify(allValues, null, 2)}</pre>
//     </div>);
//   }
// }


// export class MeetingPrepView extends Component {
//   static contextTypes = {
//     currentUserRef: PropTypes.object.isRequired
//   };

//   static propTypes = {
//     meetingId: PropTypes.string,
//     meeting: PropTypes.object,

//     uid: PropTypes.string.isRequired,
//     projectId: PropTypes.string.isRequired,
//     project: PropTypes.object.isRequired,
//     users: PropTypes.object,
//     projectGuardian: PropTypes.object,
//     reviewer: PropTypes.object
//   };

//   get IsAdmin() {
//     const { currentUserRef } = this.context;
//     return currentUserRef && currentUserRef.isAdminDisplayMode() || false;
//   }

//   get IsInThisParty() {
//     // TODO
//     return true;
//   }

//   // renderGMStatus() {
//   //   return (<p>
//   //     GM status: <span className="color-gray">no assigned reviewer</span>
//   //   </p>);
//   // }

//   renderOwnPrepView() {
//     if (!this.IsInThisParty) {
//       return null;
//     }

//     const userPrepStatus = MeetingPrepStatus.Preparing;
//     const userPrepData = null;
//     const isPreparing = userPrepStatus === MeetingPrepStatus.Preparing;
//     const isDone = userPrepStatus === MeetingPrepStatus.Done;

//     return (<div>
//       <Alert bsStyle="warning">
//         你還沒開始準備囉～
//       </Alert>
//       <Button block bsStyle="danger"
//         active={ isPreparing }
//         disabled={ isPreparing }
//         onClick={ () => setUserPrepStatus(MeetingPrepStatus.Preparing) }>
//         { !isDone ? '開始準備！' : '我雖然已經準備好了，但是想改東西了' }
//       </Button>

//       { isPreparing && <MeetingPrepUserDetailsEditor 
//           {...this.props} 

//       /> }
//       { isDone && 
//         <MeetingPrepUserDetails {...this.props} /> }
//     </div>);
//   }

//   render() {
//     return (<div>
//       { /*this.renderGMStatus()*/ }
//       { this.renderOwnPrepView() }
//     </div>);
//   }
// }

// export class MeetingGoView extends Component {
//   static contextTypes = {
//     currentUserRef: PropTypes.object.isRequired
//   };

//   static propTypes = {
//     meetingId: PropTypes.string,
//     meeting: PropTypes.object,
    
//     uid: PropTypes.string.isRequired,
//     projectId: PropTypes.string.isRequired,
//     project: PropTypes.object.isRequired,
//     users: PropTypes.object,
//     projectGuardian: PropTypes.object,
//     reviewer: PropTypes.object
//   };

//   get IsAdmin() {
//     const { currentUserRef } = this.context;
//     return currentUserRef && currentUserRef.isAdminDisplayMode() || false;
//   }


//   renderPrepOverview() {
//     // TODO: anyone in the party can also see it!?
//     if (!this.IsAdmin) {
//       return null;
//     }

//     return (<div>
//       TODO: GM 可以看到 party 所有人的　『團隊鑑定準備』　結果
//     </div>);
//   }


//   renderGMView() {
//     if (!this.IsAdmin) {
//       return null;
//     }

//     // TODO: set startTime

//     return (<Panel header="GM 區域">
//       <Button bsStyle="danger"
//         active={ window.gming }
//         onClick={() => { window.gming = !window.gming; this.setState({gming: window.gming}); }}>
//         開始進行 團隊鑑定!
//       </Button>

//       { window.gming && 
//         (<Panel header="團隊鑑定紀錄">
//           <Panel header="狀況">
//            TODO：　遲到，準備的完整度
//            TODO: 所有 checklist 的 counter-checking?
//           </Panel>
//           <Panel header="最後結果">
//            TODO
//           </Panel>
//           <Panel header="獎勵區">
//            TODO: 用 text 來紀錄 fame, karma + gold　（隔週才能分配＋看到結果）
//           </Panel>
//         </Panel>)
//       }
//     </Panel>);
//   }

//   render() {
//     return (<div>
//       { this.renderPrepOverview() }
//       { this.renderGMView() }
//     </div>);
//   }
// }

// export class MeetingResultsView extends Component {
//   static contextTypes = {
//     currentUserRef: PropTypes.object.isRequired
//   };

//   static propTypes = {
//     meetingId: PropTypes.string,
//     meeting: PropTypes.object,
    
//     uid: PropTypes.string.isRequired,
//     projectId: PropTypes.string.isRequired,
//     project: PropTypes.object.isRequired,
//     users: PropTypes.object,
//     projectGuardian: PropTypes.object,
//     reviewer: PropTypes.object
//   };

//   get IsAdmin() {
//     const { currentUserRef } = this.context;
//     return currentUserRef && currentUserRef.isAdminDisplayMode() || false;
//   }

//   renderMeetingResults() {
//     const meetingStatus = MeetingStatus.InProgress;

//     if (!meetingStatus) {
//       return (<Alert bsStyle="warning">這次團隊鑑定還沒結束</Alert>);
//     }
//     return (<div>
//       TODO: 冒險者可以看到 『團隊鑑定』 的結果
//     </div>);
//   }

//   render() {
//     return (<Panel header="團隊鑑定　－　結果">
//       { this.renderMeetingResults() }
//     </Panel>);
//   }
// }

// export class MeetingArchive extends Component {
//   static contextTypes = {
//     currentUserRef: PropTypes.object.isRequired
//   };

//   static propTypes = {
//     meetingId: PropTypes.string,
//     meeting: PropTypes.object,
    
//     uid: PropTypes.string.isRequired,
//     projectId: PropTypes.string.isRequired,
//     project: PropTypes.object.isRequired,
//     users: PropTypes.object,
//     projectGuardian: PropTypes.object,
//     reviewer: PropTypes.object,

//     archivedMeetings: PropTypes.object
//   };

//   get IsAdmin() {
//     const { currentUserRef } = this.context;
//     return currentUserRef && currentUserRef.isAdminDisplayMode() || false;
//   }

//   render() {
//     const {
//       archivedMeetings
//     } = this.props;

//     // TODO: render differently from active meetings?

//     return (<div>{ map(archivedMeetings || EmptyObject,
//       (meeting, meetingId) =>
//         (<MeetingView {...this.props}
//           key={meetingId}
//           meetingId={meetingId}
//           meeting={meeting} 
//           />)
//     )}</div>);
//   }
// }

// export default class MeetingView extends Component {
//   static contextTypes = {
//     currentUserRef: PropTypes.object.isRequired
//   };

//   static propTypes = {
//     meetingId: PropTypes.string.isRequired,
//     meeting: PropTypes.object.isRequired,

//     uid: PropTypes.string.isRequired,
//     projectId: PropTypes.string.isRequired,
//     project: PropTypes.object.isRequired,
//     users: PropTypes.object,
//     projectGuardian: PropTypes.object,
//     reviewer: PropTypes.object
//   };

//   get IsAdmin() {
//     const { currentUserRef } = this.context;
//     return currentUserRef && currentUserRef.isAdminDisplayMode() || false;
//   }


//   // TODO: highlight the phase of the meeting that is currently most relevant!
//       // (prep vs. go vs. results)

//   render() {
//     const props = this.props;

//     return (<div>
//       <MeetingStatusView {...props} />
//       <MeetingPrepView {...props} />
//       <MeetingGoView {...props} />
//       <MeetingResultsView {...props} />
//     </div>);
//   }
// }


// /**
//  * The panel that renders all meetings belonging to an project
//  */
// export class ProjectMeetingPanel extends Component {
//   static contextTypes = {
//     currentUserRef: PropTypes.object.isRequired
//   };

//   static propTypes = {
//     projectId: PropTypes.string.isRequired,
//     project: PropTypes.object.isRequired,
//     users: PropTypes.object,
//     projectGuardian: PropTypes.object,
//     reviewer: PropTypes.object,

//     mission: PropTypes.object,
//     meetings: PropTypes.object
//   };

//   render() {
//     const {
//       currentUserRef
//     } = this.context;
//     const props = this.props;
//     const [activeMeetings, archivedMeetings] = 
//       groupActiveMeetings(this.props.meetings);

//     const uid = currentUserRef && currentUserRef.props.uid;



//     // TODO: handle case when there is no meeting!

//     return (<div>
//       <Panel header="團隊鑑定">
//         { map(activeMeetings, (meeting, meetingId) =>
//           (<MeetingView {...props}
//             key={meetingId}
//             uid={uid}
//             meetingId={meetingId}
//             meeting={meeting} 
//             />)
//         )}
//       </Panel>
//       <Panel header="團隊鑑定歸檔紀錄">
//         <MeetingArchive {...props}
//           uid={uid}
//           archivedMeetings={archivedMeetings} 
//           />
//       </Panel>
//     </div>);
//   }
// }