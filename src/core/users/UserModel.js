import Roles, {
  hasRole, hasDisplayRole, getRole
} from 'src/core/users/Roles';

import pick from 'lodash/pick';
import { NOT_LOADED } from '../../dbdi/react';

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

      isCurrentUserDev({ }, { }, { currentUserDisplayRole }) {
        return currentUserDisplayRole && hasDisplayRole(currentUserDisplayRole, Roles.Dev);
      },

      isCurrentUserAdminReal({ }, { hasCurrentUserRole }, { }) {
        return hasCurrentUserRole({ role: Roles.Admin });
      },

      isCurrentUserAdmin({ }, { }, { currentUserDisplayRole }) {
        return currentUserDisplayRole && hasDisplayRole(currentUserDisplayRole, Roles.Admin);
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

      currentUserRole({ }, { }, { currentUser }) {
        return currentUser && currentUser.role;
      },

      currentUserDisplayRole({ }, { }, { currentUser }) {
        return currentUser && currentUser.displayRole;
      },

      currentUserCohortId({ }, { }, { currentUser }) {
        return currentUser && currentUser.cohortId;
      },




      userHasRole({ uid, role }, { userPublic }, { }) {
        const user = userPublic({ uid });
        if (!user) {
          return user;
        }
        return hasRole(user.role, role);
      },
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
        { userPublic, userPrivate, userPrivateData },
        { currentUid, currentUid_isLoaded, currentUserAuthData },
        { setUserData, set_userPrivateData }) {

        if (!currentUid_isLoaded) {
          return NOT_LOADED;
        }

        const uid = currentUid;
        const userArgs = {uid};

        if (!userPublic.isLoaded(userArgs) | !userPrivate.isLoaded(userArgs)) {
          // not loaded yet
          return NOT_LOADED;
        }

        if (!!userPublic(userArgs) && !!userPrivate(userArgs)) {
          // already saved this guy
          return NOT_LOADED;
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

        let privateUpdatePromise;
        if (!userPrivateData(userArgs)) {
          privateUpdatePromise = set_userPrivateData(userArgs, userData);
        }

        return Promise.all([
          setUserData({ uid, userData }),
          privateUpdatePromise
        ]);
        //});
      },

      setAdminDisplayMode({ uid, enabled }, { }, { }, { set_userDisplayRole }) {
        return set_userDisplayRole({ uid }, enabled ? Roles.Admin : Roles.User);
      },

      setUserData(
        { uid, userData },
        { },
        { },
        { set_userPhotoURL, set_userDisplayName }) {
        console.log('Writing user data: ' + JSON.stringify(userData));

        const updates = [];

        const userArgs = { uid };

        if (userData.photoURL) {
          updates.push(set_userPhotoURL(userArgs, userData.photoURL));
        }

        if (userData.displayName) {
          updates.push(set_userDisplayName(userArgs, userData.displayName));
        }

        return Promise.all(updates);
      },

      setCurrentUserData(
        { ...userData },
        { },
        { currentUid },
        { setUserData }
      ) {
        const uid = currentUid;
        return setUserData({ uid, userData });
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
            onWrite: [
              'updatedAt',
              'createdAt'
            ],
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
          currentUser(
            { },
            { userPublic },
            { currentUid, currentUid_isLoaded }
          ) {
            if (!currentUid_isLoaded) {
              return NOT_LOADED;
            }
            return currentUid && userPublic({ uid: currentUid });
          }
        },
        children: {
          gms: {
            path: {
              queryParams: [['orderByChild', 'role'], ['startAt', Roles.GM]]
            }
          },
          usersOfCohort: {
            path: {
              indices: {
                cohortId: ['cohortId']
              },
              queryParams({ cohortId }) {
                return { cohortId: cohortId || null };
              }
            }
          },
          userPublic: {
            path: {
              path: '$(uid)'
            },
            onWrite: [
              'updatedAt',
              'createdAt'
            ],
            children: {
              userDisplayName: 'displayName',
              userPhotoURL: 'photoURL',
              userLocale: 'locale',
              userRole: 'role',
              userDisplayRole: 'displayRole',
              userCohortId: 'cohortId',
              userPlaceId: 'placeId'
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