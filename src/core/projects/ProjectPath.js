

//
// Path functions
//

export function pathToChild(parentPathStr, stageId) {
  return (parentPathStr && (parentPathStr + '_') || '') + stageId;
}

export function pathToIteration(parentPathStr, iteration) {
  return (parentPathStr && (parentPathStr + '_') || '') + iteration;
}

export function pathGetParentPath(stagePath) {
  try {
    let i = 0;
    let idx = stagePath.length;
    let idx2 = idx;
    do {
      idx2 = stagePath.lastIndexOf('_', idx - 1);
      const stageId = stagePath.substring(idx2 + 1, idx);
      if (isNaN(parseInt(stageId))) {
        // not an iteration -> stepping stone in hierarchy
        console.assert(this.getNode(stageId));
        ++i;
      }
      idx = idx2;
    }
    while (i < 1);
    return stagePath.substring(0, idx);
  }
  catch (err) {
    throw new Error(`could not getParentPathOfPath for "${stagePath}"`);
  }
}

export function pathGetLastPart(stagePath) {
  let idx = stagePath.lastIndexOf('_');
  return stagePath.substring(idx + 1);
}

export function pathGetStem(stagePath) {
  let idx = stagePath.lastIndexOf('_');
  return stagePath.substring(0, idx);
}

export function pathGetStageId(stagePath) {
  let stageId;
  let idx = stagePath.lastIndexOf('_');
  stageId = stagePath.substring(idx + 1);
  if (!isNaN(parseInt(stageId))) {
    // iteration node
    const idx2 = stagePath.lastIndexOf('_', idx - 1);
    stageId = stagePath.substring(idx2 + 1, idx);
  }
  return stageId;
}

export function pathGetIteration(stagePath) {
  let iteration = pathGetLastPart(stagePath);
  iteration = iteration && parseInt(iteration);
  if (!isNaN(iteration)) {
    // iteration node
    return iteration;
  }
  return -1;
}

/**
 * Takes a path to an iteration of a repeating loop and creates path
 * to that iteration + 1.
 */
export function pathToNextIteration(stagePath) {
  const iteration = pathGetIteration(stagePath);
  if (iteration >= 0) {
    return pathGetStem(stagePath) + '_' + (iteration + 1);
  }
  return null;
}

export function pathGetLastIteration(stagePath, allStagePaths) {
  let pathStem;
  if (pathGetIteration(stagePath) >= 0) {
    // get path to repeatable node (path stem)
    pathStem = pathGetStem(stagePath);
  }
  else {
    // path is not to an iteration
    pathStem = stagePath;
  }

  let iteration = 0;
  let lastStagePath = null;
  for (; allStagePaths[stagePath]; ++iteration) {
    lastStagePath = stagePath;
    stagePath = pathToIteration(pathStem, iteration);
  }
  return lastStagePath;
}

export function isPathToLastIteration(stagePath, allStagePaths) {
  const iteration = pathGetIteration(stagePath);
  // check if its an existing iteration
  if (iteration >= 0 && !!allStagePaths[stagePath]) {
    // check if next iteration does not exist
    const nextPath = pathToNextIteration(stagePath);
    return !allStagePaths[nextPath];
  }
  return false;
}

export function isAscendantPath(parent, child) {
  return child.startsWith(parent);
}