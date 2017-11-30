import {
  isAscendantPath
} from 'src/core/projects/ProjectPath';

import { EmptyObject, EmptyArray } from 'src/util';
import { getOptionalArgument, getOptionalArguments } from 'src/dbdi/dataAccessUtil';

import mapValues from 'lodash/mapValues';
import filter from 'lodash/filter';
import sortBy from 'lodash/sortBy';
import size from 'lodash/size';

export default {
  // #########################################################################
  // Project basics
  // #########################################################################

  sortedProjectIdsOfPage(args, { projectsOfPage }, { }) {
    if (!projectsOfPage.isLoaded(args)) {
      return undefined;
    }

    const projects = projectsOfPage(args);

    const {
        orderBy,
      ascending
      } = getOptionalArguments(args, {
        orderBy: 'updatedAt',
        ascending: false
      });

    return sortBy(Object.keys(projects || EmptyObject),
      id => ascending ?
        projects[id][orderBy] :
        -projects[id][orderBy]
    );
  },

  isAscendantOfActiveStage(
    { projectId, stagePath },
    { get_activeStagePath },
    { }
  ) {
    const activeStagePath = get_activeStagePath({ projectId }) || '';
    //console.log(`${activeStagePath}.startsWith(${stagePath})`);
    return isAscendantPath(stagePath, activeStagePath);
  },

  // #########################################################################
  // Project teams
  // #########################################################################

  allUidsNotInProject() {

  },

  activeProjectsOfUser({ uid }, { activeProjectIdsOfUser, projectById }, { }) {
    return mapValues(
      activeProjectIdsOfUser(
        { uid }) || EmptyObject,
      (_, projectId) => projectById({ projectId }
      )
    );
  },

  archivedProjectsOfUser({ uid }, { archivedProjectIdsOfUser, projectById }, { }) {
    return mapValues(
      archivedProjectIdsOfUser(
        { uid }) || EmptyObject,
      (_, projectId) => projectById({ projectId }
      )
    );
  },

  usersOfProject({ projectId }, { uidsOfProject, userPublic }, { }) {
    return mapValues(
      uidsOfProject(
        { projectId }) || EmptyObject,
      (_, uid) => userPublic({ uid }
      )
    );
  },

  projectPartySize({ projectId }, { uidsOfProject }) {
    const uids = uidsOfProject({ projectId });
    if (uids === undefined) {
      return undefined;
    }
    return size(uids);
  },

  uidsWithoutProject({ }, { },
    { userProjectIdIndex, userProjectIdIndex_isLoaded, usersPublic, usersPublic_isLoaded }) {
    // TODO: make this more efficient (achieve O(k), where k = users without project)
    if (!usersPublic_isLoaded | !userProjectIdIndex_isLoaded) {
      return undefined;
    }

    if (!usersPublic) {
      return null;
    }

    const uids = Object.keys(usersPublic);
    if (!userProjectIdIndex) {
      // not a single user is assigned yet
      return uids;
    }

    // get all uids of users who have no project yet
    return filter(uids, uid => !size(userProjectIdIndex[uid]));
  },

  projectReviewers({ projectId }, { projectById, userPublic }, { }) {
    const proj = projectById({ projectId });
    const uid = proj && proj.guardianUid;
    const reviewer = uid && userPublic({ uid });

    // single reviewer as "list" or "object" of reviewers
    return reviewer && { [uid]: reviewer } || EmptyObject;
  }
};