import Roles, {getRole} from 'src/core/users/Roles';

export default {
  allUserRecords: {
    path: 'users',
    readers: {
      
      isCurrentUserLoggedIn({ }, { currentUid }, { }) {
        return !!currentUid;
      },

      isCurrentUserAdmin({ }, { currentUserRole }, { }) {
        return currentUserRole >= Roles.Admin;
      },

      isCurrentUserAdminDisplayMode({ }, { isCurrentUserAdmin, currentUserDisplayRole }, { }) {
        return isCurrentUserAdmin && currentUserDisplayRole >= Roles.Admin;
      },

      currentUserRole({ }, { currentUser }, { }) {
        return currentUser && currentUser.role;
      },

      currentUserDisplayRole({ }, { currentUser }, { }) {
        return currentUser && currentUser.displayRole;
      }
    },

    writers: {
      /**
       * Store new user data in database after first login
       */
      ensureUserInitialized({ }, { currentUser },
        { userPublic, userPrivate }, { setUserData }) {
        if (!currentUser || !currentUser.uid) return;

        const {
          uid
        } = currentUser;

        if (!userPublic.isLoaded({ uid }) || !userPrivate.isLoaded({ uid })) {
          // not loaded yet
          return;
        }

        if (!!userPublic({ uid }) && !!userPrivate({ uid })) {
          // already saved this guy
          return;
        }

        setTimeout(() => {
          const {
            providerData,
            displayName,
            email
          } = currentUser;

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

          setUserData(userData);
        });
      },

      setAdminDisplayMode({ enabled }, { }, { }, set_displayRole) {
        return set_displayRole(enabled ? Roles.Admin : Roles.User);
      },

      setUserData(
        { uid, userData }, { },
        { userPrivateData },
        { set_userPrivateData, set_userPhotoURL, set_displayName }) {
        console.log('Writing user data: ' + JSON.stringify(userData));

        const updates = [];

        if (!userPrivateData({ uid })) {
          updates.push(set_userPrivateData({ uid }, userData));
        }

        if (userData.photoURL) {
          updates.push(set_userPhotoURL(userData.photoURL));
        }

        if (userData.displayName) {
          updates.push(set_displayName(userData.displayName));
        }

        return Promise.all(updates);
      },

      setRoleName({uid, role}, {}, {}, {update_userPublic}) {
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
        return update_userPublic({uid}, val);
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
          currentUser: ({ }, { currentUid }, { userPublic }) =>
            userPublic({ uid: currentUid })
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