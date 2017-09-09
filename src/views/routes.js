export const routeNames = {
  ROOT: '/',
  SIGN_IN: 'sign-in',
  USER_PROFILE: 'user',
  GM: 'gm',
  GUARDIANS: 'guardian',
  GROUPS: 'groups',

  TEST: 'test'
};

export const routePaths = {
  ROOT: '/',
  SIGN_IN: `/${routeNames.SIGN_IN}`,
  USER_PROFILE: `/${routeNames.USER_PROFILE}`,
  GM: `/${routeNames.GM}`,
  GUARDIANS: `/${routeNames.GUARDIANS}`,
  GROUPS: `/${routeNames.GROUPS}`,

  TEST: `/${routeNames.TEST}`
};

export const routeTemplates = {
  ROOT: `${routeNames.ROOT}`,
  SIGN_IN: `${routeNames.SIGN_IN}`,
  USER_PROFILE: `${routeNames.USER_PROFILE}`,
  GM: `${routeNames.GM}`,
  GUARDIANS: `${routeNames.GUARDIANS}`,
  GROUPS: `${routeNames.GROUPS}`,

  TEST: `${routeNames.TEST}`
};
