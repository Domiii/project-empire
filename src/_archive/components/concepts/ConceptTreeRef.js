import { makeRefWrapper } from 'src/firebaseUtil';
import _ from 'lodash';

const ConceptTreeRef = makeRefWrapper({
  pathTemplate: '/conceptTree',

  methods: {

  },

  children: {
    ofConcept: {
      pathTemplate: '$(ownerId)'
    }
  }
});

export default ConceptTreeRef;