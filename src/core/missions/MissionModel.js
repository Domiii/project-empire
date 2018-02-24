

export const MissionCompletionStatus = {
  NotStarted: 0,
  Started: 1,
  Finished: 2,
  Failed: 3
};

export default {
  missionList: {
    path: '/missions',

    methods: {

    },

    children: {
      mission: {
        path: '$(missionId)',

        children: {
          title_en: 'title_en',
          goals_en: 'goals_en',
          details_en: 'details_en',
          title_zh: 'title_zh',
          goals_zh: 'goals_zh',
          details_zh: 'details_zh',
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