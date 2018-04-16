import { makeRefWrapper } from 'src/firebaseUtil';
import _ from 'lodash';

const ConceptChecksRef = makeRefWrapper({
  pathTemplate: '/conceptChecks',
  updatedAt: null,

  children: {
    ofConcept: {
      pathTemplate: '$(conceptId)',

      children: {
        conceptCheck: {
          pathTemplate: '$(conceptCheckId)',
          updatedAt: 'updatedAt',

          children: {
            title_en: 'title_en',
            title_zh: 'title_zh',
            num: 'num',
            responseTypeId: 'responseTypeId'
          }
        }
      }
    }
  }
});

export default ConceptChecksRef;