import mapValues from 'lodash/mapValues';
import isString from 'lodash/isString';
import isObject from 'lodash/isObject';
import isFunction from 'lodash/isFunction';

const Roles = {
  User: 1,
  Adventurer: 1,
  Reviewer: 2,

  Guardian: 5,

  Admin: 99,
  GM: 99
};
export default Roles;

//export const NamesByRoles = zipObject(Object.values(Roles), Object.keys(Roles));

// gets numeric value of role, role name, or user object
export function getDisplayRole(roleObj) {
  if (!roleObj) return null;
  if (isString(roleObj)) {
    if (!Roles[roleObj]) {
      throw new Error('invalid role name: ' + roleObj);
    }
    return Roles[roleObj];
  }
  if (Number.isInteger(roleObj)) {
    return roleObj;
  }
  if (isObject(roleObj)) {
    let role = roleObj.displayRole;
    if (isFunction(role)) {
      role = role();
    }
    return role || 0;
  }

  throw new Error('invalid role query: ' + roleObj);
}

// gets numeric value of role, role name, or user object
export function getRole(roleObj) {
  if (!roleObj) return null;
  if (isString(roleObj)) {
    if (!Roles[roleObj]) {
      throw new Error('invalid role name: ' + roleObj);
    }
    return Roles[roleObj];
  }
  if (Number.isInteger(roleObj)) {
    return roleObj;
  }
  if (isObject(roleObj)) {
    let role = roleObj.role;
    if (isFunction(role)) {
      role = role();
    }
    return role || 0;
  }

  throw new Error('invalid role query: ' + roleObj);
}

export function hasDisplayRole(a, b) {
  return getDisplayRole(a) >= getDisplayRole(b);
}

export function isGM(roleObj) {
  return getDisplayRole(roleObj) >= Role.GM;
}

export function isGuardian(roleObj) {
  return getDisplayRole(roleObj) >= Role.Guardian;
}

export function isAdventurer(roleObj) {
  return getDisplayRole(roleObj) >= Role.Adventurer;
}