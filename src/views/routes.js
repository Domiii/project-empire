export const routeNames = {
  ROOT: '',
  SIGN_IN: 'sign-in',
  USER_PROFILE: 'user',

  GM: 'gm',
  DEV: 'dev',

  LEARNER_STATUS: 'learnerstatus',

  PLACES: 'places',
  MISSION_CONTROL: 'myprojects',
  PROJECTS: 'projects',
  MISSIONS: 'missions',
  GROUPS: 'groups',

  VIDEO_RECORDING: 'video',

  LEARNER_KB: 'kb',

  TEST: 'test'
};

export const routePaths = {
  ROOT: '/',
  SIGN_IN: `/${routeNames.SIGN_IN}`,
  USER_PROFILE: `/${routeNames.USER_PROFILE}`,

  GM: `/${routeNames.GM}`,
  DEV: `/${routeNames.DEV}`,

  LEARNER_STATUS: `/${routeNames.LEARNER_STATUS}`,

  PLACES: `/${routeNames.PLACES}`,
  MISSION_CONTROL: `/${routeNames.MISSION_CONTROL}`,
  PROJECTS: `/${routeNames.PROJECTS}`,
  PROJECTS_VIEW: `/${routeNames.PROJECTS}/view`,
  MISSIONS: `/${routeNames.MISSIONS}`,
  GROUPS: `/${routeNames.GROUPS}`,
  VIDEO_RECORDING: `/${routeNames.VIDEO_RECORDING}`,
  LEARNER_KB: `/${routeNames.LEARNER_KB}`,

  TEST: `/${routeNames.TEST}`
};

export const routeTemplates = {
  ROOT: `${routePaths.ROOT}`,
  SIGN_IN: `${routePaths.SIGN_IN}`,
  USER_PROFILE: `${routePaths.USER_PROFILE}`,

  GM: `${routePaths.GM}`,
  DEV: `${routePaths.DEV}`,

  LEARNER_STATUS_LIST: `${routePaths.LEARNER_STATUS}`,
  LEARNER_STATUS_USER: `${routePaths.LEARNER_STATUS}/:uid`,
  LEARNER_STATUS_ENTRY: `${routePaths.LEARNER_STATUS}/:mode/:uid/:scheduleId/:cycleId`,

  PLACES: `${routePaths.PLACES}`,
  MISSION_CONTROL: `${routePaths.MISSION_CONTROL}/:projectId?/:stagePath?`,
  PROJECTS: `${routePaths.PROJECTS}/:mode?`,
  MISSIONS: `${routePaths.MISSIONS}/:missionId?/:editing?`,
  GROUPS: `${routePaths.GROUPS}`,
  VIDEO_RECORDING: `${routePaths.VIDEO_RECORDING}`,
  LEARNER_KB: `${routePaths.LEARNER_KB}`,

  TEST: `${routePaths.TEST}`
};
