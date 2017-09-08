
import { firebase, helpers } from 'redux-react-firebase';
const { isLoaded, isEmpty } = helpers;

export function renderData(data, notLoadedCb, emptyCb, renderCb) {
  return (
    !isLoaded(data) ?
      ({notLoadedCb()})
      : (isEmpty(question) ? 
        ({emptyCb()})
        : ({renderCb()})
      )
    );
}