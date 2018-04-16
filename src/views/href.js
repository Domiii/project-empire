import { routePaths } from './routes';

export function hrefProjectControl(projectId, stagePath) {
  const url = [];

  url.push(routePaths.MISSION_CONTROL);
  if (projectId) {
    url.push(`${projectId}`);
    if (stagePath) {
      url.push(`${stagePath}`);
    }
  }

  return url.join('/');
}

export function hrefProjectEntry(mode, projectId) {
  mode = mode || 'view';

  return `${routePaths.PROJECTS}/${mode}#${projectId}`;
}

export function hrefProjectList(mode) {
  mode = mode || 'view';

  return `${routePaths.PROJECTS}/${mode}`;
}

export function hrefLearnerStatusEntry(mode, uid, scheduleId, cycleId) {
  mode = mode || 'view';

  return `${routePaths.LEARNER_STATUS}/${mode}/${uid}/${scheduleId}/${cycleId}`;
}

export function hrefLearnerStatusList() {
  return `${routePaths.LEARNER_STATUS}`;
}

export function hrefMission(missionId, isEditing) {
  return `${routePaths.MISSIONS}/${missionId}${isEditing ? '/edit' : ''}`;
}

export function hrefMissionList() {
  return `${routePaths.MISSIONS}`;
}