/**
 * Teams are self-organized entities of users
 */


const TeamsRef = {
  pathTemplate: '/teams',

  methods: {

  },

  children: {
    team: {
      pathTemplate: '$(teamId)',

      children: {
        title: 'title',
        iconUrl: 'iconUrl',
        description: 'description'
      }
    }
  }
};

export default TeamsRef;