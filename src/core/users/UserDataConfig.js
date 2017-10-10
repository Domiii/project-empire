import Roles from 'src/core/users/Roles';

export default {
  allUserRecords: {
    path: 'users',
    children: {
      usersPrivate: {
        path: 'private',
        children: {
          userPrivate: {
            path: '$(uid)'
            // ...
          }
        }
      },
      usersPublic: {
        path: 'public',
        children: {
          gms: {
            path: {
              queryParams: [['orderByChild', 'role'], ['startAt', Roles.GM]]
            }
          },
          userPublic: {
            path: '$(uid)'
            // ...
          }
        }
      }
    }
  }
};