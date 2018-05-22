import { makeRefWrapper } from 'src/refwrappers';


const UIActivitiesLogRef = makeRefWrapper({
  pathTemplate: '/logs/uiActivities',

  updatedAt: null,

  children: {
    entry: {
      pathTemplate: '$(uid)/$(updatedAt)',

      children: {
        page: 'page',
        args: 'args'
      }
    }
  }
});

export default UIActivitiesLogRef;