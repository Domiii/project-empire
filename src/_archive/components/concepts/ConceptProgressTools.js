import _ from 'lodash';

function addConceptProgress(allProgress, concepts, checkResponsesByConceptId, dstConceptId, srcConceptId) {
  let conceptProgress = allProgress[dstConceptId];
  if (!conceptProgress) {
    allProgress[dstConceptId] = conceptProgress = { nTotal: 0, nCurrent: 0 };
  }

  const srcConcept = concepts[srcConceptId];
  if (!srcConcept) {
    // orphaned concept
    return;
  }

  conceptProgress.nTotal += srcConcept.nChecks || 0;
  conceptProgress.nCurrent += (checkResponsesByConceptId[srcConceptId] && 
    _.sum(_.map(checkResponsesByConceptId[srcConceptId], response => response.done && 1 || 0))) ||
    0;

  conceptProgress.progress = !conceptProgress.nTotal ? NaN :
    conceptProgress.nCurrent / conceptProgress.nTotal;

  // conceptProgress.srcConceptId = srcConceptId;
  // conceptProgress.dstConceptId = dstConceptId;  
  // console.log(JSON.stringify(conceptProgress));
}

export function computeAllChecksProgress(concepts, checkResponses) {
  const checkResponsesByConceptId = _.groupBy(checkResponses, 'conceptId');
  const allProgress = {};
  const childCounts = _.countBy(concepts, 'parentId');

  // start at the bottom with all leaf nodes (nodes that have no children)
  let queue = _.filter(
    _.keys(concepts), 
    conceptId => !childCounts[conceptId]
  );

  //console.log('\nComputing progress:');
  //console.log(JSON.stringify(_.keys(concepts)));
  //console.log(JSON.stringify(childCounts));

  // compute each layer, then bubble up (a sort-of top-down BFS)
  while (queue.length) {
    for (let i = 0; i < queue.length; ++i) {
      const conceptId = queue[i];
      const concept = concepts[conceptId];
      if (!concept) continue;

      // compute own stats
      addConceptProgress(allProgress, concepts, checkResponsesByConceptId, conceptId, conceptId);
      if (concept.parentId && concept.parentId !== conceptId) {
        // add to parent stats
        addConceptProgress(allProgress, concepts, checkResponsesByConceptId, concept.parentId, conceptId);
      }
    }
    
    //console.log(JSON.stringify(queue));

    queue = _.filter(
      _.uniq(
        _.map(queue, id => concepts[id] && concepts[id].parentId)
      ),
      id => !!id);
  }
  // TODO: This is super buggy and has the wrong sort of logic.
  //console.log(JSON.stringify(allProgress['-KcbRaNtzZEvh7h21Ig6']));
  return allProgress;
}