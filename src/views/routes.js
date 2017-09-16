export const routeNames = {
  ROOT: '/',
  SIGN_IN: 'sign-in',
  USER_PROFILE: 'user',
  MISSION_CONTROL: 'mymissions',
  GM: 'gm',
  PROJECTS: 'projects',
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
  GROUPS: `/${routeNames.GROUPS}`,

  TEST: `/${routeNames.TEST}`
};

export const routeTemplates = {
  ROOT: `${routeNames.ROOT}`,
  SIGN_IN: `${routeNames.SIGN_IN}`,
  USER_PROFILE: `${routeNames.USER_PROFILE}`,
  MISSION_CONTROL: `${routeNames.MISSION_CONTROL}`,
  GM: `${routeNames.GM}`,
  PROJECTS: `${routeNames.PROJECTS}`,
  GROUPS: `${routeNames.GROUPS}`,

  TEST: `${routeNames.TEST}`
};
