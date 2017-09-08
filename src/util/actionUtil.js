import { createAction as _createAction } from 'redux-act';

export function actionCreator(prefix) {
  return (...args) => {
    const newArgs = Array.from(args);
    newArgs[0] = prefix + newArgs[0];
    return _createAction(...newArgs);
  };
};