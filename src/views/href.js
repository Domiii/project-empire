import { routePaths } from './routes';

export function hrefXXView(ownerId, xId, mode) {
  const url = [];

  url.push(routePaths.CONCEPT_VIEW);
  if (ownerId && xId) {
    url.push(`${ownerId}/${xId}`);
  }
  else if (!mode) {
    return '/';
  }

  if (mode) {
    url.push(mode);
  }
  return url.join('/');
}