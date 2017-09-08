import { makeRefWrapper } from 'src/firebaseUtil';
import _ from 'lodash';

const ConceptsRef = makeRefWrapper({
  pathTemplate: '/concepts',

  queryString(ownerId) {
    if (ownerId) {
      // get all entries of given parent
      return [
        'orderByChild=ownerId',
        `equalTo=${ownerId}`
      ];
    }
    else {
      // get root entries
      return [
        'orderByChild=parentId',
        `equalTo=null`
      ];
    }
  },

  methods: {
    // updateKeepOrder(parentId, updates) {
    //   // TODO: this.val and this.update_ofConcept don't work in cascading methods

    //   updates = updates || {};
    //   const concepts = this.val;
    //   const ids = Object.keys(concepts);
    //   debugger;
    //   const orderedIds = _.sortBy(ids, id => concepts[id].num);
    //   updates = _.reduce(orderedIds, (updates, id, index) => {
    //     const newNum = 1+index;
    //     if (concepts[id].num != newNum) {
    //       updates[id] = newNum;
    //     }
    //   }, updates);

    //   const numUpdates = _.keyBy(concepts, (concept) => {});
    //   return this.update_ofConcept(parentId, updates);
    // },

    // TODO: update concept order
    // updateOrder(parentId, conceptId, conceptData) {
    //   const updates = {
    //     [conceptId]: conceptData
    //   };
    //   return this.update_ofConcept(parentId, updates);
    //   //return this.updateKeepOrder(parentId, updates);
    // },

    getLoadedConcepts(all) {
      if (all) {
        return this.getAllLoadedConcepts();
      }
      return this.getPublicLoadedConcepts();
    },

    getAllLoadedConcepts() {
      return this.val || {};
    },

    getPublicLoadedConcepts() {
      return this.val && _.pickBy(this.val, {isPublic: true}) || {};
    },

    getChildren(parentId, all) {
      if (all) {
        return this.getAllChildren(parentId);
      }
      return this.getPublicChildren(parentId);
    },

    getAllChildren(parentId) {
      return this.val && _.pickBy(this.val, concept => concept.parentId === parentId) || {};
    },

    getPublicChildren(parentId) {
      return this.val && _.pickBy(this.val, {parentId, isPublic: true}) || {};
    },

    getFirstChild(parentId, all) {
      // TODO: this assumes, we have all concepts cached!
      const firstChildId = this.getFirstChildId(parentId, all);
      return firstChildId && this.concept(firstChildId);
    },

    getFirstChildId(parentId, all) {
      // TODO: this assumes, we have all concepts cached!
      // TODO: Make this more efficient
      const concepts = this.getChildren(parentId, all);
      if (!concepts) {
        return null;
      }
      let firstNum = 99999999999;
      let firstKey = null;
      for (let key in concepts) {
        const prob = concepts[key];
        if (prob.num < firstNum) {
          firstNum = prob.num;
          firstKey = key;
        }
      }
      return firstKey;
    },

    getLastChildId(parentId, all) {
      // TODO: this assumes, we have all concepts cached!
      // TODO: Make this more efficient
      const concepts = this.getChildren(parentId, all);
      if (!concepts) {
        return null;
      }
      let lastNum = -999999999;
      let lastKey = null;
      for (let key in concepts) {
        const prob = concepts[key];
        if (prob.num > lastNum) {
          lastNum = prob.num;
          lastKey = key;
        }
      }
      return lastKey;
    },

    getPreviousChildId(parentId, currentChildId, all) {
      // TODO: this assumes, we have all concepts cached!
      const concepts = this.getChildren(parentId, all);
      if (!concepts) {
        return null;
      }
      const currentChild = this.concept(currentChildId);
      if (!currentChild) {
        return this.getFirstChildId(parentId, all);
      }

      let newNum = -99999999999;
      let newKey = null;
      for (let key in concepts) {
        const prob = concepts[key];
        if (prob.num < currentChild.num && prob.num > newNum) {
          newNum = prob.num;
          newKey = key;
        }
      }
      return newKey || this.getLastChildId(parentId, all);
    },

    getNextChildId: function(parentId, currentChildId, all) {
      // TODO: this assumes, we have all concepts cached!
      const concepts = this.getChildren(parentId, all);
      if (!concepts) {
        return null;
      }
      const currentChild = this.concept(currentChildId);
      if (!currentChild) {
        return this.getFirstChildId(parentId, all);
      }

      let newNum = 99999999999;
      let newKey = null;
      for (let key in concepts) {
        const prob = concepts[key];
        if (prob.num > currentChild.num && prob.num < newNum) {
          newNum = prob.num;
          newKey = key;
        }
      }
      return newKey || this.getFirstChildId(parentId, all);
    },

    getConceptIdByOrder(parentId, num) {
      return this.findKey(concept => Math.abs(concept.num - num) < 0.1 && concept.parentId === parentId);
    },

    changeOrder(conceptId, delta) {
      const concept = this.concept(conceptId);
      if (!concept) {
          throw new Error('concept does not exist: ' + conceptId);
      }
      const oldOrder = Math.round(concept.num) | 0;
      let newOrder = oldOrder + delta;

      if (newOrder < 1) {
        newOrder = 1;
      }
      else {
        const allChildren = this.getAllChildren(concept.parentId);
        const maxOrder = _.size(allChildren);
        if (newOrder > maxOrder) {
          newOrder = maxOrder;
        }
      }

      if (oldOrder == newOrder) {
        // nothing to do here
        return Promise.resolve();
      }

      const promises = [
        this.set_num(conceptId, newOrder)
      ];

      const replaceConceptId = this.getConceptIdByOrder(concept.parentId, newOrder);
      if (replaceConceptId) {
        // switch with concept that has the new id
        promises.push(this.set_num(replaceConceptId, oldOrder));
      }


      return Promise.all(promises);
    },

    togglePublic(conceptId) {
      const concept = this.concept(conceptId);
      if (!concept) {
          throw new Error('concept does not exist: ' + conceptId);
      }
      return this.set_isPublic(conceptId, !this.isPublic(conceptId));
    },

    deleteConcept(conceptId) {
      if (!conceptId) {
        throw new Error('missing conceptId');
      }
      return this.delete_concept(conceptId)
      .then(() => {
        // TODO: keep order after deleting
        //return this.updateKeepOrder(parentId);
      });
    }
  },

  children: {
    concept: {
      pathTemplate: '$(conceptId)',

      children: {
        ownerId: 'ownerId',
        parentId: 'parentId',
        isPublic: 'isPublic',
        title_en: 'title_en',
        title_zh: 'title_zh',
        description_en: 'description_en',
        description_zh: 'description_zh',
        expectsSubmission: 'expectsSubmission',
        num: 'num'
      }
    }
  }
});

export default ConceptsRef;