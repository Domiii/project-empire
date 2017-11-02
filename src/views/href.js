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