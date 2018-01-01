export const routeNames = {
  ROOT: '',
  SIGN_IN: 'sign-in',
  USER_PROFILE: 'user',
  PLACES: 'places',
  MISSION_CONTROL: 'myprojects',
  PROJECTS: 'projects',
  MISSIONS: 'missions',
  GROUPS: 'groups',
  GM: 'gm',
  LEARNER_KB: 'kb',
  LEARNER_STATUS: 'learnerstatus',

  TEST: 'test'
};

export const routePaths = {
  ROOT: '/',
  SIGN_IN: `/${routeNames.SIGN_IN}`,
  USER_PROFILE: `/${routeNames.USER_PROFILE}`,
  PLACES: `/${routeNames.PLACES}`,
  MISSION_CONTROL: `/${routeNames.MISSION_CONTROL}`,
  PROJECTS: `/${routeNames.PROJECTS}`,
  MISSIONS: `/${routeNames.MISSIONS}`,
  GROUPS: `/${routeNames.GROUPS}`,
  GM: `/${routeNames.GM}`,
  LEARNER_KB: `/${routeNames.LEARNER_KB}`,
  LEARNER_STATUS: `/${routeNames.LEARNER_STATUS}`,

  TEST: `/${routeNames.TEST}`
};

export const routeTemplates = {
  ROOT: `${routePaths.ROOT}`,
  SIGN_IN: `${routePaths.SIGN_IN}`,
  USER_PROFILE: `${routePaths.USER_PROFILE}`,
  PLACES: `${routePaths.PLACES}`,
  MISSION_CONTROL: `${routePaths.MISSION_CONTROL}/:projectId?/:stagePath?`,
  PROJECTS: `${routePaths.PROJECTS}`,
  MISSIONS: `${routePaths.MISSIONS}`,
  GROUPS: `${routePaths.GROUPS}`,
  GM: `${routePaths.GM}`,
  LEARNER_KB: `${routePaths.LEARNER_KB}`,
  LEARNER_STATUS_LIST: `${routePaths.LEARNER_STATUS}`,
  LEARNER_STATUS_USER: `${routePaths.LEARNER_STATUS}/:uid`,
  LEARNER_STATUS_ENTRY: `${routePaths.LEARNER_STATUS}/:mode/:uid/:scheduleId/:cycleId`,

  TEST: `${routePaths.TEST}`
};
