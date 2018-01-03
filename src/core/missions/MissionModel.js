
export default {
  allMissions: {
    path: '/missions',

    methods: {

    },

    children: {
      missionById: {
        path: '$(missionId)',

        children: {
          title: 'title',
          missionGoals: 'goals',
          missionDetails: 'details',
          author: 'author',
          category: 'category',
          subCategory: 'subCategory',
          difficulty: 'difficulty',
          recommendedTime: 'recommendedTime',
          isRepeatable: 'isRepeatable',
          link: 'link',
          tags: 'tags',
          rubrics: 'rubrics'
        }
      }
    }
  }
};


// when importing (simple way of fixing keys):
// missions = _.zipObject(_.map(missions, m => m.code.replace('-', '')), Object.values(missions));