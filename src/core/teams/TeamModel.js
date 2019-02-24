import { EmptyObject } from 'src/util';
import { getOptionalArguments } from 'dbdi/util';

/**
 * Team data
 */
const teamsById = {
  path: '$(teamId)',
  onWrite: [
    'updatedAt',
    'createdAt'
  ],
  children: {
    teamName: 'name',
    teamDescription: 'description',
    teamLeaderUid: 'leaderUid',
    teamGMUid: 'gmUid'
  }
};

const readers = {

};

const writers = {

};

export default {
  teamUidIndex: {
    path: '/_index/teamUsers/team',
    children: {
      uidsOfTeam: {
        path: '$(teamId)',
        reader(res) {
          return res === null ? EmptyObject : res;
        },
        children: {
          uidOfTeam: '$(uid)'
        }
      }
    }
  },
  userTeamIdIndex: {
    path: '/_index/teamUsers/user',
    children: {
      activeTeamIdsOfUser: {
        path: '$(uid)',
        reader(res) {
          return res === null ? EmptyObject : res;
        },
        children: {
          activeTeamIdOfUser: '$(teamId)'
        }
      }
    }
  },
  allTeamData: {
    path: '/teams',
    readers,
    writers,
    children: {
      teamList: {
        path: 'list',
        children: {
          teamsOfPage: {
            path: {
              queryParams(args) {
                const {
                  page
                } = args;

                const {
                  orderBy,
                  itemsPerPage,
                  ascending
                } = getOptionalArguments(args, {
                    orderBy: 'updatedAt',
                    itemsPerPage: 20,
                    ascending: false
                  });

                return [
                  ['orderByChild', orderBy],
                  [ascending ? 'limitToFirst' : 'limitToLast', page * itemsPerPage]
                ];
              }
            }
          },
          teamsById
        }
      }
    }
  }
};