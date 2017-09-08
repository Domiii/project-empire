import { applyMiddleware, compose, createStore } from 'redux'
import thunk from 'redux-thunk'
import makeRootReducer from './reducers'
import { browserHistory } from 'react-router'
import { reactReduxFirebase, getFirebase } from 'react-redux-firebase'
import { version } from 'package.json'

export default (firebaseConfig, reduxFirebaseConfig, initialState = {}, history) => {
  // ======================================================
  // Window Vars Config
  // ======================================================
  window.version = version

  // ======================================================
  // Middleware Configuration
  // ======================================================
  const middleware = [
    thunk.withExtraArgument(getFirebase)
    // This is where you add other middleware like redux-observable
  ]

  // ======================================================
  // Store Enhancers
  // ======================================================
  const enhancers = [];

  if (process.env.NODE_ENV !== 'production') {
    const devToolsExtension = window.devToolsExtension
    if (typeof devToolsExtension === 'function') {
      enhancers.push(devToolsExtension())
    }
  }

  // ======================================================
  // Store Instantiation and HMR Setup
  // ======================================================
  const store = createStore(
    makeRootReducer(),
    initialState,
    compose(
      applyMiddleware(...middleware),
      reactReduxFirebase(firebaseConfig, reduxFirebaseConfig),
      ...enhancers
    )
  )
  store.asyncReducers = {}

  //// To unsubscribe, invoke `store.unsubscribeHistory()` anytime
  //store.unsubscribeHistory = browserHistory.listen(updateLocation(store))
  if (module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept('./reducers', () => {
      const nextRootReducer = require('./reducers')
      store.replaceReducer(nextRootReducer)
    })
  }

  return store
}