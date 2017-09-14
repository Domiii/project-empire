/**
 * Adventures
 */


import { 
  makeRefWrapper,
  m2mIndex
} from 'src/firebaseUtil';

import { EmptyObject, EmptyArray } from 'src/util';

import UserInfoRef from 'src/core/users/UserInfoRef';

/*
    1. [Advanced] Prepare for mission
    1. Sprint(i):
      1. Go on mission (stateless?)
      1. Party meeting prep
      1. GM meeting prep
      1. Run meeting
        * checklist: 『團隊鑑定標準』
      1. [Advanced] Post-meeting reflection + plan next steps
    1. Mission Finished
*/

const renderers = {

};

const StepViews = {

};

const Checklists = {

};

const Steps = [
  {
    // TODO: how to prepare for a collaborative mission properly?
    id: 'prepare',
    title: '開始執行之前的暖身開會',
    requiredLevel: 2 // advanced option, only for those who consider themselves advanced
  },
  {
    id: 'sprints',
    title: 'Sprints',
    children: [
      {
        id: 'sprint',
        children: [
          {
            id: 'execution',
            title: '執行階段',
            views: {
              //GM: 
            }
          },
          {
            id: 'prepareMeeting',
            title: '準備團隊鑑定',

          }
        ]
      }
    ]
  }
];

const AdventuresRef = makeRefWrapper({
  pathTemplate: '/adventures',

  methods: {

  },

  children: {
    adventure: {
      pathTemplate: '$(adventureId)',

      children: {
        assignedGMUid: 'assignedGMUid',
        missionId: 'missionId',
        guardianUid: 'guardianUid',
        adventureStatus: 'adventureStatus',

        gmNotes: 'gmNotes',
        guardianNotes: 'guardianNotes',
        partyNotes: 'partyNotes'
      }
    }
  }
});

export default AdventuresRef;

export const UserAdventureRef = m2mIndex(
  'adventureUsers',

  'user',
  'adventure',
  
  UserInfoRef.userList,
  AdventuresRef
);
