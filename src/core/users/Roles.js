import mapValues from 'lodash/mapValues';

const Roles = {
  User: 1,
  Adventurer: 1,

  Guardian: 5,

  Admin: 99,
  GM: 99
};
export default Roles;

//export const NamesByRoles = zipObject(Object.values(Roles), Object.keys(Roles));

function getRole(roleOrUser) {
  return (Number.isInteger(roleOrUser) ? 
    roleOrUser : 
    (roleOrUser && roleOrUser.role)) || 0;
}

export function getRoleName(roleOrUser) {
  const role = getRole(roleOrUser);
}

export function isGM(roleOrUser) {

}

export function isGuardian(roleOrUser) {

}

export function isAdventurer(roleOrUser) {
  
}