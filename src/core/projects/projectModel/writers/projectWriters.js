import times from 'lodash/times';
import map from 'lodash/map';
import zipObject from 'lodash/zipObject';

import firebase from 'firebase';
import { NOT_LOADED } from '../../../../dbdi/react';
import { EmptyObject } from '../../../../util';

export default {
  deleteProject(
    { projectId },
    { projectById, get_uidsOfProject, activeProjectIdOfUser },
    { },
    { update_db }
  ) {
    const args = {
      projectId
    };
    
    if (!get_uidsOfProject.isLoaded(args)) {
      return NOT_LOADED;
    }

    const uids = Object.keys(get_uidsOfProject(args) || EmptyObject);
    
    // delete project from all user index
    const updateObj = zipObject(
      map(uids, uid => activeProjectIdOfUser.getPath({projectId, uid})),
      times(uids.length, () => null)
    );

    // delete project users
    updateObj[get_uidsOfProject.getPath(args)] = null;

    // delete project
    updateObj[projectById.getPath(args)] = null;
    return update_db(updateObj);
  },

  addUserToProject(
    { uid, projectId },
    { uidOfProject, activeProjectIdOfUser },
    { },
    { updateAll }) {
    return updateAll({
      pathArgs: { uid, projectId },
      readers: [uidOfProject, activeProjectIdOfUser],
      val: 1
    });
  },

  deleteUserFromProject(
    { uid, projectId },
    { uidOfProject, activeProjectIdOfUser },
    { },
    { updateAll }) {
    return updateAll({
      pathArgs: { uid, projectId },
      readers: [uidOfProject, activeProjectIdOfUser],
      val: null
    });
  },

  updateProjectStatus(
    { uid, projectId, status },
    { projectStatus, projectFinishTime },
    { },
    { update_db }
  ) {
    // TODO: handle archiving properly
    const updates = {
      [projectStatus.getPath({ projectId })]: status,
      [projectFinishTime.getPath({ projectId })]: firebase.database.ServerValue.TIMESTAMP
    };

    return update_db(updates);
  }
};