import { getOptionalArguments } from 'src/dbdi/dataAccessUtil';

const readers = {
  a(
    { },
    { },
    { }
  ) {
  }
};

function learnerEntryNode(prefix) {
  const node = {
    children: {
      learnerEntryStatusList: {
        path: 'status',
        children: {
          learnerEntriesOfUser: {
            path: {
              queryParams({ uid }) {
                // const {
                //   page
                // } = args;

                // const {
                //   itemsPerPage,
                //   ascending
                // } = getOptionalArguments(args, {
                //   itemsPerPage: 20,
                //   ascending: false
                // });

                return [
                  ['orderByChild', 'uid'],
                  ['equalTo', uid]
                  //[ascending ? 'limitToFirst' : 'limitToLast', page * itemsPerPage]
                ];
              }
            }
          },
          learnerEntriesOfCycle: {
            path: {
              queryParams({ cycleId }) {
                return [
                  ['orderByChild', 'cycleId'],
                  ['equalTo', cycleId]
                ];
              }
            }
          },
          learnerEntryStatus: {
            path: '$(learnerEntryId)',
            children: {
              uid: 'uid',
              cycleId: 'cycleId',
              nFinishedEntries: 'nFinishedEntries',
              nTotalEntries: 'nTotalEntries',
              updatedAt: 'updatedAt',
              createdAt: 'createdAt'
            },
            onWrite: [
              'updatedAt',
              'createdAt',

              function setCycleId(queryArgs, val, { currentScheduleCycleId }) {
                if (val && !val.cycleId) {
                  const cycleId = currentScheduleCycleId();
                  console.assert(cycleId,
                    'tried to save learnerEntryStatus when currentScheduleCycleId was not loaded yet or returned invalid value');
                  val.cycleId = cycleId;
                }
              }
            ]
          },
        },
      },
      learnerEntryRecord: {
        path: 'data/$(learnerEntryId)',
        children: {
        }
      }
    }
  };

  // TODO: add prefix to all nodes of subtree

  return node;
}

export default {
  allLearnerEntryData: {
    path: 'learnerEntries',
    children: {
      currentLearnerEntries: learnerEntryNode(),
      archive: {
        path: 'archive',
        children: {
          archivedEntries: {
            path: '$(archiveId)',
            children: {
              //learnerEntryStatusList
            }
          }
        }
      }
    },
    readers
  }
};