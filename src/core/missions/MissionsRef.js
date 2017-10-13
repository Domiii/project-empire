/**
 * Missions
 */


import { makeRefWrapper } from 'src/firebaseUtil';
import { EmptyObject, EmptyArray } from 'src/util';

const MissionsRef = makeRefWrapper({
  pathTemplate: '/missions',

  methods: {

  },

  children: {
    mission: {
      pathTemplate: '$(missionId)',

      children: {
        code: 'code',
        title: 'title',
        description: 'description',
        prereqs: 'prereqs',
        goals: 'goals',
        rewards: 'rewards',
        responsibleGm: 'responsibleGm',
        link: 'link',
        meetingFrequency: 'meetingFrequency'
      }
    }
  }
});

export default MissionsRef;