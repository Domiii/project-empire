import { makeRefWrapper } from 'src/firebaseUtil';
import { lookupLocalized } from 'src/util/localizeUtil';

import pick from 'lodash/pick';

// access to the current user's info
const UserInfoRef = makeRefWrapper({
  pathTemplate: '/users',

  children: {
    userList: {
      pathTemplate: 'public'
    },

    user: {
      groupBy: ['uid'],

      methods: {
        get uid() {
          return this.props && this.props.uid;
        },

        isLoggedIn() {
          return !!this.props && !!this.props.uid;
        },

        isAdmin() {
          return this.role() >= 5;
        },

        isAdminDisplayMode() {
          return this.isAdmin() && this.displayRole() >= 5;
        },

        getLocalized(obj, entry) {
          return lookupLocalized(this.locale(), obj, entry);
        },

        setAdminDisplayMode(enabled) {
          return this.set_displayRole(enabled ? 5 : 1);
        },

        setUserData(userData) {
          const updates = [];

          if (!this.data()) {
            updates.push(this.set_data(userData));
          }

          if (userData.photoURL) {
            updates.push(this.set_photoURL(userData.photoURL));
          }

          if (userData.displayName) {
            updates.push(this.set_displayName(userData.displayName));
          }

          return Promise.all(updates);
        },

        updateUserData(userData) {
          const updates = [];

          updates.push(this.update_data(userData));

          if (userData.photoURL) {
            updates.push(this.set_photoURL(userData.photoURL));
          }

          if (userData.displayName) {
            updates.push(this.set_displayName(userData.displayName));
          }

          return Promise.all(updates);
        },

        ensureUserInitialized() {
          const { auth } = this.props;

          // TODO: Separate data writes

          setTimeout(() => {
            if (this.isLoggedIn() && this.isLoaded && !this.public() && !this.private()) {
              // user logged in and but no record of user data
              // -> get user data and add to userInfo DB
              // see: https://firebase.google.com/docs/reference/js/firebase.UserInfo
              let userData = auth.providerData && auth.providerData.length && 
                auth.providerData[0];
              if (!userData) {
                userData = {
                  displayName: auth.displayName || 'unknown',
                  email: auth.email
                };
              }

              console.log("Writing user data: " + JSON.stringify(userData));
              return this.setUserData(userData);
            }
          });
        },

        updateUser(userFormData) {
          const pblic = userFormData && userFormData.public;
          if (!pblic) throw new Error('invalid form data: ' + JSON.stringify(userFormData));

          const data = pick(pblic, ['displayName', 'photoURL']);
          return this.updateUserData(data);
        }
      },

      children: {
        public: {
          pathTemplate: 'public/$(uid)',
          pushPathTemplate: 'public',

          children: {
            displayName: 'displayName',
            photoURL: 'photoURL',
            locale: 'locale',
            role: 'role'
          }
        },

        private: {
          pathTemplate: 'private/$(uid)',
          pushPathTemplate: 'private',

          children: {
            displayRole: 'displayRole',

            data: 'data',   // personal user data (we copy this from firebase auth on first use)

            // TODO: Put this into a different path. Personal user settings don't belong with account data.
            prefs: {    // some UI user preferences
              pathTemplate: 'prefs',
              children: {
                
              }
            }
          }
        }
      }
    }
  }
});

export default UserInfoRef;