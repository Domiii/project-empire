
import CancelablePromise from './CancelablePromise';

export default async function doWait(ms) {
  return new CancelablePromise((r, j) => setTimeout(r, ms));
}