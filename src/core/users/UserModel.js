import firebase from 'firebase/app';
import 'firebase/database';

import Roles, {
  hasRole, hasDisplayRole, getRole
} from 'src/core/users/Roles';

import pick from 'lodash/pick';
import map from 'lodash/map';
import filter from 'lodash/filter';
import sortBy from 'lodash/sortBy';
import forEach from 'lodash/forEach';



import { NOT_LOADED } from '../../dbdi/react';
import { EmptyObject } from '../../util';

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
        if (usersPublic === NOT_LOADED) {
          return NOT_LOADED;
        }

        const allUids = Object.keys(usersPublic || EmptyObject);
        const sortedUids = sortBy(allUids, uid => usersPublic[uid].role || 0);
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
      },

      unregisteredUids({ }, { }, { usersPublic }) {
        if (usersPublic === NOT_LOADED) {
          return NOT_LOADED;
        }

        const allUids = Object.keys(usersPublic || EmptyObject);
        const unregisteredUids = filter(allUids, uid => 
          !usersPublic[uid].role || usersPublic[uid].role === Roles.Unregistered);

        return unregisteredUids;
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

          // TODO: proper cohort management
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
              displayName: displayName || '<unknown user>'
            };
          }

          userData.cohortId = defaultCohortId;
          userData.createdAt = firebase.database.ServerValue.TIMESTAMP;

          console.warn('Registering new user:', userData);

          const privateUserData = {
            ...userData,
            email
          };

          return Promise.all([
            setUserData({ uid, userData }),
            set_userPrivateData(userArgs, privateUserData)
          ]);
        },

        _updateUserLastLoginTime(
          { },
          { },
          { currentUid },
          { set_userLastLogin }
        ) {
          const uid = currentUid;
          const userArgs = { uid };

          return set_userLastLogin(userArgs, firebase.database.ServerValue.TIMESTAMP);
        },

        /**
         * Store new user data in database after first login
         */
        async ensureUserInitialized(
          { },
          { user, userPrivate, get_currentUid },
          { },
          { _addNewUser, _updateUserLastLoginTime }
        ) {
          // wait for currentUid to have loaded
          const uid = await get_currentUid.readAsync();
          const userArgs = { uid };

          // wait for user data to have loaded
          const [pub, priv] = await Promise.all([
            await user.readAsync(userArgs),
            await userPrivate.readAsync(userArgs),
          ]);

          if (!!pub && !!priv) {
            // existing user
            await _updateUserLastLoginTime();
            return true;
          }

          await _addNewUser();
          await _updateUserLastLoginTime();

          return true;
          //});
        },

        setAdminDisplayMode({ uid, enabled }, { userRole }, { }, { set_userDisplayRole }) {
          return set_userDisplayRole({ uid }, enabled ? userRole({uid}) : Roles.User);
        },

        setUserData(
          { uid, userData },
          { },
          { },
          { set_userPhotoURL, set_userDisplayName, set_userFullName, set_userCohortId, set_userCreatedAt }) {
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

          if (userData.createdAt) {
            updates.push(set_userCreatedAt(userArgs, userData.createdAt));
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

        setRole({ uid, role }, { }, { }, { update_user }) {
          const roleNum = getRole(role) || 0;

          // make sure to set display role first.
          // in case, you demote yourself, you still need your original role for this.
          // return this.set_userDisplayRole(uid, roleNum).then(() =>
          //   this.set_userRole(uid, roleNum)
          // );

          const upd = {
            role: roleNum,
            displayRole: roleNum
          };
          return update_user({ uid }, upd);
        },

        registerAllUnregisteredUsers(
          { },
          { get_userRole },
          { unregisteredUids },
          { update_db }
        ) {
          const updates = {};

          if (unregisteredUids === NOT_LOADED) {
            return null;
          }

          forEach(unregisteredUids, uid =>
            updates[get_userRole.getPath({ uid })] = Roles.User
          );

          return update_db(updates);
        }
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
                userPrivateData: {
                  path: 'data',
                  children: {
                    userEmail: 'email'
                  }
                }
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
                //'createdAt' (doesn't work like that right now)
              ],
              children: {
                userDisplayName: 'displayName',
                userPhotoURL: 'photoURL',
                userFullName: 'fullName',
                userLastLogin: 'lastLogin',
                userCohortId: 'cohortId',
                userSelfLabel: 'selfLabel',
                userLocale: 'locale',
                userRole: 'role',
                userDisplayRole: 'displayRole',
                userPlaceId: 'placeId',
                userCreatedAt: 'createdAt'
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