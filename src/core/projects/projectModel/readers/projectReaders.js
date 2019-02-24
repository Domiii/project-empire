import { EmptyObject, EmptyArray } from 'src/util';
import { getOptionalArguments } from 'dbdi/util';

import mapValues from 'lodash/mapValues';
import filter from 'lodash/filter';
import sortBy from 'lodash/sortBy';
import size from 'lodash/size';

import { NOT_LOADED } from 'dbdi';

export default {
  // #########################################################################
  // Project basics
  // #########################################################################

  sortedProjectIdsOfPage(args, { projectsOfPage }, { }) {
    if (!projectsOfPage.isLoaded(args)) {
      return NOT_LOADED;
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

  // #########################################################################
  // Project teams
  // #########################################################################

  archivedProjectsOfUser({ uid }, { archivedProjectIdsOfUser, projectById }, { }) {
    return mapValues(
      archivedProjectIdsOfUser(
        { uid }) || EmptyObject,
      (_, projectId) => projectById({ projectId }
      )
    );
  },

  activeProjectsOfUser({ uid }, { activeProjectIdsOfUser, projectById }, { }) {
    return mapValues(
      activeProjectIdsOfUser(
        { uid }) || EmptyObject,
      (_, projectId) => projectById({ projectId }
      )
    );
  },

  usersOfProject({ projectId }, { uidsOfProject, userPublic }, { }) {
    return mapValues(
      uidsOfProject({ projectId }) || EmptyObject,
      (_, uid) => userPublic({ uid })
    );
  },

  projectPartySize({ projectId }, { uidsOfProject }) {
    const uids = uidsOfProject({ projectId });
    if (uids === NOT_LOADED) {
      return NOT_LOADED;
    }
    return size(uids);
  },

  uidsWithoutProject(
    { },
    { },
    { userProjectIdIndex, userProjectIdIndex_isLoaded, usersPublic, usersPublic_isLoaded }
  ) {
    // TODO: make this more efficient (achieve O(k), where k = users without project)
    if (!usersPublic_isLoaded | !userProjectIdIndex_isLoaded) {
      return NOT_LOADED;
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

  uidsWithProjectButNotIn(
    { projectId },
    {},
    { userProjectIdIndex, userProjectIdIndex_isLoaded, usersPublic, usersPublic_isLoaded }
  ) {
    if (!usersPublic_isLoaded | !userProjectIdIndex_isLoaded) {
      return NOT_LOADED;
    }

    if (!usersPublic) {
      return EmptyArray;
    }

    const uids = Object.keys(usersPublic);
    if (!userProjectIdIndex) {
      // not a single user is assigned yet
      return EmptyArray;
    }


    // get all uids of users who have at least one project (excluding the given project)
    return filter(uids, uid => {
      // has projects and is not in given project
      return userProjectIdIndex[uid] && 
      size(userProjectIdIndex[uid]) > 0 && 
        !(userProjectIdIndex[uid][projectId]);
      // const excludeSize = (userProjectIdIndex[uid] && userProjectIdIndex[uid][projectId] && 1) || 0;
      // return size(userProjectIdIndex[uid]) <= excludeSize;
    });
  },

  projectReviewers({ projectId }, { projectById, userPublic }, { }) {
    const proj = projectById({ projectId });
    const uid = proj && proj.guardianUid;
    const reviewer = uid && userPublic({ uid });

    // single reviewer as "list" or "object" of reviewers
    return reviewer && { [uid]: reviewer } || EmptyObject;
  }
};