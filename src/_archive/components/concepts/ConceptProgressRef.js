import { makeRefWrapper } from 'src/firebaseUtil';


const ConceptProgressRef = makeRefWrapper({
  pathTemplate: '/conceptProgress',

  children: {
    ofUser: {
      pathTemplate: '$(uid)',

      children: {
        ofConcept: {
          pathTemplate: '$(conceptId)',

          children: {
            currentProblemId: 'currentProblemId'
          }
        }
      }
    }
  }
});

export default ConceptProgressRef;