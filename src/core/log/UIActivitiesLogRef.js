import { makeRefWrapper } from 'src/firebaseUtil';
import _ from 'lodash';


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