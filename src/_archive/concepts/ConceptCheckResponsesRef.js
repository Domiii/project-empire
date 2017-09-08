import { makeRefWrapper } from 'src/firebaseUtil';
import _ from 'lodash';
import { EmptyObject, EmptyArray } from 'src/util';

// TODO: Likes + maybe some more responses toward entire concepts
/*
  like: {
    title_en: 'Like!',
    icon: 'heart',
    className: 'color-red',
    bsStyle: 'warning'
  },
*/

const ConceptCheckResponsesRef = makeRefWrapper({
  pathTemplate: '/conceptCheckResponses',

  indices: {
    uid: ['uid'],
    conceptId: ['conceptId'],
    //groupId: ['groupId'],
    //groupId_conceptId: ['groupId', 'conceptId']

    // cannot currently use updatedAt, since it is only set after query returns
    //conceptId_updatedAt: ['conceptId', 'updatedAt']
  },

  queryString({uid}) {
    // get all responses by given uid
    return this.indices.where({uid});
    //return this.indices.where({uid: '11RtZ4mMz5QC9oMqY5gZbXlRLa03'});
    //return this.indices.where({uid: 'CT5Wf1IAvDeOaMLrXBpkcetkJHR2'});
    // return this.indices.where({
    //   uid,
    //   conceptId
    // });
    // {
    //   orderByChild: 'uid',
    //   equalTo: uid
    // };
  },

  methods: {
    ofConcept(conceptId) {
      const { uid } = this.props;
      const selector = {
        uid,
        conceptId
      };
      return this.val && _.filter(this.val, selector) || EmptyArray;
    },

    getResponseByName(name) {
      // TODO: Change below methods to take responseName instead of response object
      // TODO: Get response object from default type settings
    },

    getResponseId(conceptId, checkId) {
      const { uid } = this.props;
      return this.val && _.findKey(this.val, {
        uid,
        conceptId,
        checkId
      });
    },

    isActive(conceptId, checkId, response) {
      const responseId = this.getResponseId(conceptId, checkId);
      const responseName = response.name;
      const categoryName = response.category;

      const currentSelection = this.response(responseId);
      return !!(currentSelection && currentSelection.done);

      // if (!this[categoryName]) {
      //   // NOTE: "this[categoryName]" is a the getter method for that specific category
      //   console.error(`Invalid categoryName "${categoryName}" in response "${responseName}"`);
      //   return false;
      // }

      // const currentSelection = responseId && this[categoryName](responseId);
      // return currentSelection && currentSelection === responseName || false;
    },

    updateResponse(conceptId, checkId, checkStillExists, response) {
      const { uid } = this.props;
      const responseId = this.getResponseId(conceptId, checkId);
      const responseName = response.name;
      const categoryName = response.category;

      // TODO: Revamp this - Separate the different categories into different paths

      if (checkStillExists) {
        // check still exists
        const isNowActive = !this.isActive(conceptId, checkId, response);
        const newStatus = isNowActive;
        const update = {
          done: newStatus
        };

        if (categoryName !== 'statusUpdate') {
          //update.progress = isNowActive && response.progress || 0;
          throw new Error("Invalid response category: " + categoryName);
        }

        if (responseId) {
          //console.log(responseId, update);
          return (this.updateChild(responseId, update)
          .then(() => isNowActive));
        }
        else {
          return (this.push(Object.assign(update, {
            uid,
            conceptId,
            checkId
          }))
          .then(() => true));
        }
        //return Promise.resolve(1);
      }
      else {
        // check object is gone -> delete response
        return this.setChild(responseId, null).then(() => false);
      }
    }
  },

  children: {
    response: {
      pathTemplate: '$(responseId)',

      children: {
        uid: 'uid',
        conceptId: 'conceptId',
        checkId: 'checkId',
        //progress: 'progress',
        done: 'done'
        // selected: {
        //   pathTemplate: 'selected',

        //   children: {
        //     statusUpdate: 'statusUpdate',
        //     feedback: 'feedback',
        //     request: 'request',
        //   }
        // }
      }
    }
  }
});

export default ConceptCheckResponsesRef;