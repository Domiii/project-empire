/**
 * Projects
 */


import { 
  makeRefWrapper,
  m2mIndex
} from 'src/firebaseUtil';

import { EmptyObject, EmptyArray } from 'src/util';

import UserInfoRef from 'src/core/users/UserInfoRef';

import isArray from 'lodash/isArray';


const ProjectsRef = makeRefWrapper({
  pathTemplate: '/projects/list',

  methods: {

  },

  children: {
    project: {
      pathTemplate: '$(projectId)',

      children: {
        assignedGMUid: 'assignedGMUid',
        missionId: 'missionId',
        guardianUid: 'guardianUid',
        projectStatus: 'projectStatus',

        gmNotes: 'gmNotes',
        guardianNotes: 'guardianNotes',
        partyNotes: 'partyNotes'
      }
    }
  }
});

export default ProjectsRef;

export const UserProjectRef = m2mIndex(
  'projectUsers',

  'user',
  'project',
  
  UserInfoRef.userList,
  ProjectsRef
);
