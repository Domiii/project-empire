import { fetchData, setData } from '../adminDataUtil';
import _ from 'lodash';

function validate(users) {
  if (!!users.public || !!users.private) {
    throw new Error('Migration already finished: "public" or "private" children already exist');
  }
}

module.exports = function() {
  return fetchData('users')
    .then(users => {
      validate(users);

      const newUsers = {
        private: {},
        public: {}
      };

      for (const uid in users) {
        const user = users[uid];

        const {
          isAdmin,
          adminDisplayMode,
          prefs,
          data,
          updatedAt
        } = user;

        const {
          displayName,
          photoURL,
          email
        } = data;

        newUsers.private[uid] = {
          displayRole: adminDisplayMode ? 5 : 1,
          prefs: prefs || null,
          data: data || null,
          updatedAt: updatedAt || null
        };
        newUsers.public[uid] = {
          role: isAdmin ? 5 : 1,
          displayName: displayName || null,
          photoURL: photoURL || null,
          updatedAt: updatedAt || null
        };
      }

      if (_.size(newUsers.public) !== _.size(users)) {
        throw new Error('user migration failed');
      }

      //console.log(JSON.stringify(newUsers, null, 2));

      return setData('users', newUsers);
    });
};