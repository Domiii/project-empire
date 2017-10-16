


export default {
  allMissions: {
    path: '/missions',

    methods: {

    },

    children: {
      missionById: {
        path: '$(missionId)',

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
  }
};


// when importing (simple way of fixing keys):
// missions = _.zipObject(_.map(missions, m => m.code.replace('-', '')), Object.values(missions));