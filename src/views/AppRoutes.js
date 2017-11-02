import React from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';

import { routeNames, routeTemplates } from './routes';

import dataBind from 'src/dbdi/react/dataBind';

import SignInPage from './pages/SignInPage';
import UserProfilePage from './pages/UserProfilePage';
import LandingPage from './pages/LandingPage';
import MissionControlPage from './pages/MissionControlPage';
import GMPage from './pages/GMPage';
import ProjectPage from './pages/ProjectPage';
import TestPage from './pages/TestPage';

import { LoadOverlay } from 'src/views/components/overlays';

const AppRoutes = dataBind()(function AppRoutes(
  { },
  { },
  { currentUid, currentUid_isLoaded }
) {
  if (!currentUid_isLoaded) {
    return (<LoadOverlay message="logging in..." className="color-lightred" />);
  }
  if (!currentUid) {
    // not signed in yet
    return (
      <Switch>
        <Route exact path={routeTemplates.SIGN_IN} component={SignInPage} />
        <Redirect to={routeTemplates.SIGN_IN} />
      </Switch>
    );
  }
  else {
    return (
      <Switch>
        <Route exact path={routeTemplates.USER_PROFILE + '*'} component={UserProfilePage} />
        <Route path={routeTemplates.MISSION_CONTROL} component={MissionControlPage} />
        <Route exact path={routeTemplates.GM} component={GMPage} />
        <Route exact path={routeTemplates.PROJECTS} component={ProjectPage} />
        <Route exact path={routeTemplates.TEST} component={TestPage} />
        <Route exact path={routeTemplates.ROOT} component={LandingPage} />
        <Redirect to={routeTemplates.ROOT} />
      </Switch>
    );
  }
});

export default AppRoutes;
