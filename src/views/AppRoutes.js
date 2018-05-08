import React from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';

import { routeTemplates } from './routes';

import dataBind from 'src/dbdi/react/dataBind';

import SignInPage from './pages/SignInPage';
import RegistrationPage from './pages/RegistrationPage';
import UserProfilePage from './pages/UserProfilePage';

import GMPage from './pages/GMPage';
import DevPage from './pages/DevPage';
import DebugPage from './pages/DebugPage';

import HomePage from './pages/HomePage';

import ProjectPage from './pages/ProjectPage';
import PresentationsPage from './pages/PresentationsPage';

import VideoRecordingPage from './pages/VideoRecordingPage';

import TestPage from './pages/TestPage';
import LearnerKBPage from './pages/LearnerKBPage';


import { LoadOverlay } from 'src/views/components/overlays';


const signedInRoutes = [
  {
    path: routeTemplates.DEBUG,
    component: DebugPage
  }
];

const AppRoutes = dataBind()(function AppRoutes(
  { },
  { },
  { currentUid, currentUser_isLoaded, isCurrentUserComplete }
) {
  if (!currentUser_isLoaded) {
    return (<LoadOverlay message="logging in..." className="color-lightred" />);
  }

  if (!currentUid) {
    // not signed in
    return (
      <Switch>
        <Route exact path={routeTemplates.SIGN_IN} component={SignInPage} />

        <Redirect to={routeTemplates.SIGN_IN} />
      </Switch>
    );
  }
  else if (!isCurrentUserComplete) {
    // new user or user still has to fill in some data details
    return (
      <Switch>
        <Route exact path={routeTemplates.REGISTRATION} component={RegistrationPage} />

        {/* 
          NOTE: we have to do it this way because router does not support Fragment yet 
          see: https://github.com/ReactTraining/react-router/issues/5785
        */}
        {signedInRoutes.map((r) => <Route exact key={r.path} {...r} />)}

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

        <Route exact path={routeTemplates.GM} component={GMPage} />
        <Route exact path={routeTemplates.DEV} component={DevPage} />
        <Route exact path={routeTemplates.TEST} component={TestPage} />

        <Route exact path={routeTemplates.PROJECTS} component={ProjectPage} />
        <Route exact path={routeTemplates.PRESENTATION_SESSIONS} component={PresentationsPage} />

        <Route exact path={routeTemplates.VIDEO_RECORDING} component={VideoRecordingPage} />
        <Route exact path={routeTemplates.LEARNER_KB} component={LearnerKBPage} />

        {/* <Route exact path={routeTemplates.PLACES} component={PlacePage} />
        <Route path={routeTemplates.MISSION_CONTROL} component={MissionControlPage} />
        <Route exact path={routeTemplates.MISSIONS} component={MissionPage} /> */}

        {/* <Route exact path={routeTemplates.LEARNER_STATUS_LIST} component={LearnerStatusListPage} />
        <Route exact path={routeTemplates.LEARNER_STATUS_USER} component={LearnerOverviewPage} />
        <Route exact path={routeTemplates.LEARNER_STATUS_ENTRY} component={LearnerStatusEntryPage} /> */}

        {signedInRoutes.map((r) => <Route exact key={r.path} {...r} />)}

        <Redirect to={routeTemplates.ROOT} />
      </Switch>
    );
  }
});

export default AppRoutes;
