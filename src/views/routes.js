/**
 * These are the names used in paths and templates
 */
export const routeNames = {
  ROOT: '',
  SIGN_IN: 'sign-in',
  REGISTRATION: 'reg',

  USER_PROFILE: 'user',

  GM: 'gm',
  DEV: 'dev',
  DEBUG: 'debug',
  TEST: 'test',

  PROJECTS: 'projects',
  PRESENTATION_SESSIONS: 'pres',

  VIDEO_RECORDING: 'video',
  LEARNER_KB: 'kb',

  // LEARNER_STATUS: 'learnerstatus',
  // PLACES: 'places',
  // MISSION_CONTROL: 'myprojects',
  // MISSIONS: 'missions',
  // GROUPS: 'groups'
};

/**
 * These are used when building URLs
 */
export const routePaths = {
  ROOT: '/',
  SIGN_IN: `/${routeNames.SIGN_IN}`,
  REGISTRATION: `/${routeNames.REGISTRATION}`,

  USER_PROFILE: `/${routeNames.USER_PROFILE}`,

  GM: `/${routeNames.GM}`,
  DEV: `/${routeNames.DEV}`,
  DEBUG: `/${routeNames.DEBUG}`,
  TEST: `/${routeNames.TEST}`,

  PROJECTS: `/${routeNames.PROJECTS}`,
  PROJECTS_VIEW: `/${routeNames.PROJECTS}/view`,
  PRESENTATION_SESSIONS: `/${routeNames.PRESENTATION_SESSIONS}`,
  PRESENTATION_SESSIONS_LIVE: `/${routeNames.PRESENTATIONS}/live`, // show current session
  PRESENTATION_SESSIONS_LIST: `/${routeNames.PRESENTATIONS}/list`, // browse list of all sessions
  PRESENTATION_SESSIONS_VIEW: `/${routeNames.PRESENTATIONS}/view`, // view specific session

  VIDEO_RECORDING: `/${routeNames.VIDEO_RECORDING}`,
  LEARNER_KB: `/${routeNames.LEARNER_KB}`,

  // LEARNER_STATUS: `/${routeNames.LEARNER_STATUS}`,
  // PLACES: `/${routeNames.PLACES}`,
  // MISSION_CONTROL: `/${routeNames.MISSION_CONTROL}`,
  // MISSIONS: `/${routeNames.MISSIONS}`,
  // GROUPS: `/${routeNames.GROUPS}`
};


/**
 * These are used by react-router for URL matching
 */
export const routeTemplates = {
  ROOT: `${routePaths.ROOT}`,
  SIGN_IN: `${routePaths.SIGN_IN}`,
  REGISTRATION: `${routePaths.REGISTRATION}`,

  USER_PROFILE: `${routePaths.USER_PROFILE}`,

  GM: `${routePaths.GM}`,
  DEV: `${routePaths.DEV}`,
  DEBUG: `${routePaths.DEBUG}`,
  TEST: `${routePaths.TEST}`,

  PROJECTS: `${routePaths.PROJECTS}/:mode?`,
  PRESENTATION_SESSIONS: `${routePaths.PRESENTATION_SESSIONS}/:mode?/:sessionId?#:presentationId?`,

  VIDEO_RECORDING: `${routePaths.VIDEO_RECORDING}`,
  LEARNER_KB: `${routePaths.LEARNER_KB}`,

  // MISSIONS: `${routePaths.MISSIONS}/:missionId?/:editing?`,
  // GROUPS: `${routePaths.GROUPS}`,
  // PLACES: `${routePaths.PLACES}`,
  // MISSION_CONTROL: `${routePaths.MISSION_CONTROL}/:projectId?/:stagePath?`,
  // LEARNER_STATUS_LIST: `${routePaths.LEARNER_STATUS}`,
  // LEARNER_STATUS_USER: `${routePaths.LEARNER_STATUS}/:uid`,
  // LEARNER_STATUS_ENTRY: `${routePaths.LEARNER_STATUS}/:mode/:uid/:scheduleId/:cycleId`,
};
