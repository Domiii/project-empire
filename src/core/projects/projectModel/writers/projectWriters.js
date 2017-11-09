import firebase from 'firebase';

export default {
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