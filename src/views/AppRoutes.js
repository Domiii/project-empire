import React from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';

import { routeTemplates } from './routes';

import dataBind from 'src/dbdi/react/dataBind';

import SignInPage from './pages/SignInPage';
import RegistrationPage from './pages/RegistrationPage';
import UserProfilePage from './pages/UserProfilePage';
import HomePage from './pages/HomePage';
import PlacePage from './pages/PlacePage';
import MissionControlPage from './pages/MissionControlPage';
import MissionPage from './pages/MissionPage';
import ProjectPage from './pages/ProjectPage';
import VideoRecordingPage from './pages/VideoRecordingPage';

import GMPage from './pages/GMPage';
import DevPage from './pages/DevPage';
import DebugPage from './pages/DebugPage';

import LearnerKBPage from './pages/LearnerKBPage';

import LearnerStatusListPage from './pages/LearnerStatusListPage';
import LearnerStatusEntryPage from './pages/LearnerStatusEntryPage';
import LearnerOverviewPage from './pages/LearnerOverviewPage';

import TestPage from './pages/TestPage';

import { LoadOverlay } from 'src/views/components/overlays';

const AppRoutes = dataBind()(function AppRoutes(
  { },
  { },
  { currentUid, currentUser_isLoaded, isCurrentUserComplete }
) {
  if (!currentUser_isLoaded) {
    return (<LoadOverlay message="logging in..." className="color-lightred" />);
  }

  const commonRoutes = [
    {
      path: routeTemplates.DEBUG,
      component: DebugPage
    }
  ];

  if (!currentUid) {
    // not signed in
    return (
      <Switch>
        <Route exact path={routeTemplates.SIGN_IN} component={SignInPage} />
        
        {commonRoutes.map(({ path, component }) => <Route exact key={path} path={path} component={component} />)}
        
        <Redirect to={routeTemplates.SIGN_IN} />
      </Switch>
    );
  }
  else if (!isCurrentUserComplete) {
    // new user or user still has to fill in some data details
    return (
      <Switch>
        <Route exact path={routeTemplates.REGISTRATION} component={RegistrationPage} />
        
        {commonRoutes.map(({ path, component }) => <Route exact key={path} path={path} component={component} />)}
        
        <Redirect to={routeTemplates.REGISTRATION} />
      </Switch>
    );
  }
  else {
    // standard user
    return (
      <Switch>
        <Route exact path={routeTemplates.ROOT} component={HomePage} />
        <Route exact path={routeTemplates.USER_PROFILE + '*'} component={UserProfilePage} />

        {/* <Route exact path={routeTemplates.PLACES} component={PlacePage} /> */}

        <Route exact path={routeTemplates.PLACES} component={PlacePage} />
        <Route path={routeTemplates.MISSION_CONTROL} component={MissionControlPage} />
        <Route exact path={routeTemplates.MISSIONS} component={MissionPage} />
        <Route exact path={routeTemplates.PROJECTS} component={ProjectPage} />

        <Route exact path={routeTemplates.VIDEO_RECORDING} component={VideoRecordingPage} />


        <Route exact path={routeTemplates.GM} component={GMPage} />
        <Route exact path={routeTemplates.DEV} component={DevPage} />

        <Route exact path={routeTemplates.LEARNER_KB} component={LearnerKBPage} />

        <Route exact path={routeTemplates.LEARNER_STATUS_LIST} component={LearnerStatusListPage} />
        <Route exact path={routeTemplates.LEARNER_STATUS_USER} component={LearnerOverviewPage} />
        <Route exact path={routeTemplates.LEARNER_STATUS_ENTRY} component={LearnerStatusEntryPage} />

        <Route exact path={routeTemplates.TEST} component={TestPage} />

        {commonRoutes.map(({ path, component }) => <Route exact key={path} path={path} component={component} />)}

        <Redirect to={routeTemplates.ROOT} />
      </Switch>
    );
  }
});

export default AppRoutes;
