import Roles, {
  hasRole, hasDisplayRole, getRole
} from 'src/core/users/Roles';

import pick from 'lodash/pick';
import isEmpty from 'lodash/isEmpty';
import map from 'lodash/map';
import mapValues from 'lodash/mapValues';
import sortBy from 'lodash/sortBy';



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

      isCurrentUserRegistered({ }, { hasCurrentUserRole }, { }) {
        return hasCurrentUserRole({ role: Roles.User });
      },

      isCurrentUserDataComplete({ }, { isUserDataComplete }, { currentUid }) {
        return isUserDataComplete({ uid: currentUid });
      },

      isCurrentUserComplete({ }, { }, { isCurrentUserRegistered, isCurrentUserDataComplete }) {
        return isCurrentUserRegistered && isCurrentUserDataComplete;
      },

      isCurrentUserDev({ }, { }, { currentUserDisplayRole }) {
        return currentUserDisplayRole && hasDisplayRole(currentUserDisplayRole, Roles.Dev);
      },

      isCurrentUserAdminReal({ }, { hasCurrentUserRole }, { }) {
        return hasCurrentUserRole({ role: Roles.Admin });
      },

      isCurrentUserAdmin({ }, { }, { currentUserDisplayRole }) {
        return !!currentUserDisplayRole && hasDisplayRole(currentUserDisplayRole, Roles.Admin);
      },

      isCurrentUserGuardian({ }, { hasCurrentUserDisplayRole }, { }) {
        return hasCurrentUserDisplayRole({ role: Roles.Guardian });
      },

      hasCurrentUserRole({ role }, { }, { currentUserRole }) {
        return currentUserRole !== NOT_LOADED && hasRole(currentUserRole, role);
      },

      hasCurrentUserDisplayRole({ role }, { }, { currentUserDisplayRole }) {
        return currentUserDisplayRole && hasDisplayRole(currentUserDisplayRole, role);
      },

      currentUserRole({ }, { }, { currentUser }) {
        return currentUser && currentUser.role || Roles.Unregistered;
      },

      currentUserDisplayRole({ }, { }, { currentUser }) {
        return currentUser && currentUser.displayRole || Roles.Unregistered;
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

      roleUserLists({ roleNames }, { }, { usersPublic }) {
        const allUids = Object.keys(usersPublic);
        const sortedUids = sortBy(allUids, uid => usersPublic[uid].role || 1);
        const userLists = map(roleNames, name => ({ name, role: Roles[name], list: {} }));

        // sort users into userLists by role
        let listI = 0;
        for (let i = 0; i < sortedUids.length; ++i) {
          const uid = sortedUids[i];
          const user = usersPublic[uid];
          while (listI < roleNames.length - 1 && 
            user.role && 
            user.role >= userLists[listI + 1].role
          ) {
            ++listI;
          }
          userLists[listI].list[uid] = user;
        }
        return userLists;
      }
    },


    // #######################################################################
    // User writers
    // #######################################################################

    writers: {
      _addNewUser(
        { },
        { },
        { currentUid, currentUserAuthData },
        { setUserData, set_userPrivateData }
      ) {
        const uid = currentUid;
        const userArgs = { uid };
        const defaultCohortId = 1;

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

        userData.cohortId = defaultCohortId;

        console.warn('Registering new user:', userData);

        return Promise.all([
          setUserData({ uid, userData }),
          set_userPrivateData(userArgs, userData)
        ]);
      },

      /**
       * Store new user data in database after first login
       */
      ensureUserInitialized(
        { },
        { userPublic, userPrivate },
        { currentUid, currentUid_isLoaded },
        { _addNewUser }
      ) {

        if (!currentUid_isLoaded) {
          // still loading
          return false;
        }

        const uid = currentUid;
        const userArgs = { uid };

        if (!userPublic.isLoaded(userArgs) | !userPrivate.isLoaded(userArgs)) {
          // still loading
          return false;
        }


        // TODO: handle all kinds of cases:
        //  1. logged out user
        //  2. unregistered user
        //  3. registered user
        // TODO: use this info to render the right page (AppRouter)

        if (!!userPublic(userArgs) && !!userPrivate(userArgs)) {
          // existing user
          return true;
        }

        _addNewUser();

        return true;
        //});
      },

      setAdminDisplayMode({ uid, enabled }, { }, { }, { set_userDisplayRole }) {
        return set_userDisplayRole({ uid }, enabled ? Roles.Admin : Roles.User);
      },

      setUserData(
        { uid, userData },
        { },
        { },
        { set_userPhotoURL, set_userDisplayName, set_userFullName, set_userCohortId }) {
        console.log('Writing user data: ' + JSON.stringify(userData));

        const updates = [];

        const userArgs = { uid };

        if (userData.photoURL && userData.photoURL.trim()) {
          updates.push(set_userPhotoURL(userArgs, userData.photoURL.trim()));
        }

        if (userData.displayName && userData.displayName.trim()) {
          updates.push(set_userDisplayName(userArgs, userData.displayName.trim()));
        }

        if (userData.fullName && userData.fullName.trim()) {
          updates.push(set_userFullName(userArgs, userData.fullName.trim()));
        }

        if (userData.cohortId) {
          updates.push(set_userCohortId(userArgs, userData.cohortId));
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
        const roleNum = getRole(role) || 0;

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
          userPublic(args, { user }) {
            return user(args);
          },
          get_userPublic(args, { user }) {
            return user(args);
          },
          userPublic_isLoaded(args, { user }) {
            return user.isLoaded(args);
          },
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
          user: {
            path: '$(uid)',
            readers: {
              isUserDataComplete({ uid }, { get_user }) {
                if (!uid) {
                  return false;
                }

                const user = get_user({ uid });
                if (user === NOT_LOADED) {
                  return NOT_LOADED;
                }
                if (!user) {
                  return false;
                }
                return !!user.fullName;
              }
            },
            onWrite: [
              'updatedAt',
              'createdAt'
            ],
            children: {
              userDisplayName: 'displayName',
              userPhotoURL: 'photoURL',
              userFullName: 'fullName',
              userCohortId: 'cohortId',
              userSelfLabel: 'selfLabel',
              userLocale: 'locale',
              userRole: 'role',
              userDisplayRole: 'displayRole',
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