import Roles, {
  hasRole, hasDisplayRole, getRole
} from 'src/core/users/Roles';

export default {
  allUserRecords: {
    path: 'users',

    // #######################################################################
    // User readers
    // #######################################################################

    readers: {
      isCurrentUserLoggedIn({ }, { }, { currentUid }) {
        return !!currentUid;
      },

      isCurrentUserAdminReal({ }, { hasCurrentUserRole }, { }) {
        return hasCurrentUserRole({ role: Roles.Admin });
      },

      isCurrentUserGuardian({ }, { hasCurrentUserDisplayRole }, { }) {
        return hasCurrentUserDisplayRole({ role: Roles.Guardian });
      },

      hasCurrentUserRole({ role }, { }, { currentUserRole }) {
        return currentUserRole && hasRole(currentUserRole, role);
      },

      hasCurrentUserDisplayRole({ role }, { }, { currentUserDisplayRole }) {
        return currentUserDisplayRole && hasDisplayRole(currentUserDisplayRole, role);
      },

      isCurrentUserAdmin({ }, { }, { currentUserDisplayRole }) {
        return currentUserDisplayRole && hasDisplayRole(currentUserDisplayRole, Roles.Admin);
      },

      currentUserRole({ }, { }, { currentUser }) {
        return currentUser && currentUser.role;
      },

      currentUserDisplayRole({ }, { }, { currentUser }) {
        return currentUser && currentUser.displayRole;
      }
    },


    // #######################################################################
    // User writers
    // #######################################################################

    writers: {
      /**
       * Store new user data in database after first login
       */
      ensureUserInitialized(
        { },
        { userPublic, userPrivate },
        { currentUserAuthData },
        { setUserData }) {
        if (!currentUserAuthData || !currentUserAuthData.uid) return;

        const {
          uid
        } = currentUserAuthData;

        if (!userPublic.isLoaded({ uid }) || !userPrivate.isLoaded({ uid })) {
          // not loaded yet
          return;
        }

        if (!!userPublic({ uid }) && !!userPrivate({ uid })) {
          // already saved this guy
          return;
        }

        //setTimeout(() => {
        const {
            providerData,
          displayName,
          email
          } = currentUserAuthData;

        // user logged in, but has no record of user data yet
        // -> get user data and add to userInfo DB
        // see: https://firebase.google.com/docs/reference/js/firebase.UserInfo
        let userData = providerData && providerData.length && providerData[0];
        if (!userData) {
          userData = {
            displayName: displayName || '<unknown user>',
            email
          };
        }

        setUserData({ uid, userData });
        //});
      },

      setAdminDisplayMode({ uid, enabled }, { }, { }, { set_userDisplayRole }) {
        return set_userDisplayRole({ uid }, enabled ? Roles.Admin : Roles.User);
      },

      setUserData(
        { uid, userData },
        { userPrivateData },
        { },
        { set_userPrivateData, set_userPhotoURL, set_userDisplayName }) {
        console.log('Writing user data: ' + JSON.stringify(userData));

        const updates = [];

        const userArgs = { uid };
        if (!userPrivateData(userArgs)) {
          updates.push(set_userPrivateData(userArgs, userData));
        }

        if (userData.photoURL) {
          updates.push(set_userPhotoURL(userArgs, userData.photoURL));
        }

        if (userData.displayName) {
          updates.push(set_userDisplayName(userArgs, userData.displayName));
        }

        return Promise.all(updates);
      },

      setRole({ uid, role }, { }, { }, { update_userPublic }) {
        const roleNum = getRole(role);
        if (!roleNum) {
          throw new Error('invalid role: ' + role);
        }

        // make sure to set display role first.
        // in case, you demote yourself, you still need your original role for this.
        // return this.set_userDisplayRole(uid, roleNum).then(() =>
        //   this.set_userRole(uid, roleNum)
        // );

        const val = {
          role: roleNum,
          displayRole: roleNum
        };
        return update_userPublic({ uid }, val);
      },
    },

    children: {
      // private user information is not available to other users
      usersPrivate: {
        path: 'private',
        children: {
          userPrivate: {
            path: '$(uid)',
            children: {
              // personal user data (we copy this from firebase auth on first use)
              userPrivateData: 'data'
            }
          }
        }
      },

      // public user information is shared
      usersPublic: {
        path: 'public',
        readers: {
          currentUser: ({ }, { userPublic }, { currentUid }) =>
            currentUid && userPublic({ uid: currentUid })
        },
        children: {
          gms: {
            path: {
              queryParams: [['orderByChild', 'role'], ['startAt', Roles.GM]]
            }
          },
          userPublic: {
            path: '$(uid)',
            children: {
              userDisplayName: 'displayName',
              userPhotoURL: 'photoURL',
              userLocale: 'locale',
              userRole: 'role',
              userDisplayRole: 'displayRole'
            }
          }
        }
      },


      // some UI user preferences
      usersPrefs: {
        path: 'prefs',
        children: {
          userPrefs: {
            path: '$(uid)',
            children: {
            }
          }
        }
      },
    }
  }
};