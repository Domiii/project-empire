import { combineReducers } from 'redux';


// ################################################
// Actions
// ################################################

export const actions = {
  setIsLogging(value) {
    return {
      type: 'APP_IS_LOGGING',
      value
    };
  }
};


// ################################################
// Reducer
// ################################################

export const reducer = combineReducers({
  setIsLogging(state = null, action) {
    const { type, value } = action;

    return value !== undefined ? value : false;
  }
});