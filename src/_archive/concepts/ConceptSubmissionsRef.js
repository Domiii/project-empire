import { makeRefWrapper } from 'src/firebaseUtil';

export const SubmissionStatus = {
  NotSubmitted: 0,
  Submitted: 1
};


const ConceptSubmissionsRef = makeRefWrapper({
  // TODO: Rename path
  pathTemplate: '/conceptResponses',

  indices: {
    uid: ['uid'],
    conceptId: ['conceptId'],
    uid_conceptId: {
      keys: ['uid', 'conceptId'],
      autoUpdate: false,
      forceSimpleEncoding: true
    }
  },


  queryString(args) {
    const limit = args && args.limit;
    const orderBy = args && args.orderBy;
    const filter = args && args.filter;
    const populates = args && args.populates;

    const q = {
      queryParams: []
    };

    if (limit) {
      q.queryParams.push(`limitToLast=${limit}`);
    }

    if (orderBy) {
      q.queryParams.push(`orderByChild=${orderBy}`);
    }

    if (filter && filter.length) {
      //console.log('filter: ' + JSON.stringify(filter));
      q.queryParams.push(
        `orderByChild=${filter[0]}`,
        `equalTo=${filter[1]}`
      );
    }

    if (populates) {
      q.populates = populates;
    }

    return q;
  },

  children: {
    response: {
      pathTemplate: '$(submissionId)',

      methods: {
        updateSubmission(givenConceptId, text) {
          const { uid, conceptId } = this.props;

          // sanity checks
          if (!uid || !conceptId) {
            return Promise.reject(new Error("[ERROR] Missing `uid` or `conceptId` props in ConceptSubmissionsRef."));
          }

          if (givenConceptId != conceptId) {
            return Promise.reject(new Error(`[ERROR] Invalid "conceptId" given in ConceptSubmissionsRef: ${givenConceptId} - expected: ${conceptId}`));
          }

          //return this.setByIndex({uid, conceptId}, {
          return this.update({
            uid,
            conceptId,
            ...text
          });
        }
      },

      children: {
        uid: 'uid',
        conceptId: 'conceptId',
        text: 'text',

        // whether the user has already clicked the "submit" button
        hasSubmitted: 'hasSubmitted'
      }
    }
  }
});

export default ConceptSubmissionsRef;