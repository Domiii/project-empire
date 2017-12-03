export const routeNames = {
  ROOT: '',
  SIGN_IN: 'sign-in',
  USER_PROFILE: 'user',
  MISSION_CONTROL: 'mymissions',
  GM: 'gm',
  PROJECTS: 'projects',
  LEARNER_STATUS: 'learnerstatus',
  GROUPS: 'groups',

  TEST: 'test'
};

export const routePaths = {
  ROOT: '/',
  SIGN_IN: `/${routeNames.SIGN_IN}`,
  USER_PROFILE: `/${routeNames.USER_PROFILE}`,
  MISSION_CONTROL: `/${routeNames.MISSION_CONTROL}`,
  GM: `/${routeNames.GM}`,
  PROJECTS: `/${routeNames.PROJECTS}`,
  LEARNER_STATUS: `/${routeNames.LEARNER_STATUS}`,
  GROUPS: `/${routeNames.GROUPS}`,

  TEST: `/${routeNames.TEST}`
};

export const routeTemplates = {
  ROOT: `${routePaths.ROOT}`,
  SIGN_IN: `${routePaths.SIGN_IN}`,
  USER_PROFILE: `${routePaths.USER_PROFILE}`,
  MISSION_CONTROL: `${routePaths.MISSION_CONTROL}/:projectId?/:stagePath?`,
  GM: `${routePaths.GM}`,
  PROJECTS: `${routePaths.PROJECTS}`,
  LEARNER_STATUS_LIST: `${routePaths.LEARNER_STATUS}`,
  LEARNER_STATUS_USER: `${routePaths.LEARNER_STATUS}/:uid`,
  LEARNER_STATUS_ENTRY: `${routePaths.LEARNER_STATUS}/:mode/:uid/:scheduleId/:cycleId`,
  GROUPS: `${routePaths.GROUPS}`,

  TEST: `${routePaths.TEST}`
};
