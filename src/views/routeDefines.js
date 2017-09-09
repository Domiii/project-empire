import React from 'react';
import { isAuthenticated } from 'src/firebaseUtil';

import { routeNames, routeTemplates } from './routes';

import App from './app';

import SignInPage from './pages/SignInPage';
import UserProfilePage from './pages/UserProfilePage';
import LandingPage from './pages/LandingPage';
import GMPage from './pages/GMPage';
import GuardianPage from './pages/GuardianPage';
import GroupPage from './pages/GroupPage';
//import TestPage from './pages/TestPage';

const requireAuth = getState => {
  return (nextState, replace) => {
    if (!isAuthenticated(getState().firebase)) {
      replace(routeNames.SIGN_IN);
    }
  };
};

const requireUnauth = getState => {
  return (nextState, replace) => {
    if (isAuthenticated(getState().firebase)) {
      replace('/');
    }
  };
};

export const getRoutes = getState => {
  return {
    path: routeNames.ROOT,
    component: App,
    indexRoute: {
      component: LandingPage,
      onEnter: requireAuth(getState)
    },
    childRoutes: [
      {
        name: routeNames.SIGN_IN,
        path: routeTemplates.SIGN_IN,
        component: SignInPage,
        onEnter: requireUnauth(getState)
      },
      {
        name: routeNames.USER_PROFILE,
        path: routeTemplates.USER_PROFILE,
        component: UserProfilePage,
        onEnter: requireAuth(getState)
      },
      {
        name: routeNames.GM,
        path: routeTemplates.GM,
        indexRoute: {
          component: GMPage,
          onEnter: requireAuth(getState)
        }
      },
      {
        name: routeNames.GUARDIAN,
        path: routeTemplates.GUARDIAN,
        indexRoute: {
          component: GuardianPage,
          onEnter: requireAuth(getState)
        }
      },
      {
        name: routeNames.GROUPS,
        path: routeTemplates.GROUPS,
        indexRoute: {
          component: GroupPage,
          onEnter: requireAuth(getState)
        }
      },
      // {
      //   name: routeNames.TEST,
      //   path: routeTemplates.TEST,
      //   onEnter: requireAuth(getState),
      //   childRoutes: [
      //     {
      //       component: TestPage,
      //       onEnter: requireAuth(getState)
      //     }
      //   ]
      // }
    ]
  };
};
