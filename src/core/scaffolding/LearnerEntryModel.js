import map from 'lodash/map';
import mapValues from 'lodash/mapValues';
import groupBy from 'lodash/groupBy';

import { getOptionalArguments } from 'src/dbdi/dataAccessUtil';

const readers = {
  learnerEntryIdsOfCycleByAllUsers(
    { scheduleId, cycleId },
    { learnerEntriesOfCycle },
    { usersPublic, usersPublic_isLoaded }
  ) {
    if (!learnerEntriesOfCycle.isLoaded({ scheduleId, cycleId }) | !usersPublic_isLoaded) {
      return undefined;
    }

    const entries = learnerEntriesOfCycle({ scheduleId, cycleId });

    const byUid = mapValues(groupBy(entries, 'uid'), arr => arr[0]);
    return mapValues(usersPublic, (_, uid) => byUid[uid] || null);
  }
};

const writers = {
  createLearnerEntry(
    { uid, scheduleId, cycleId },
    { },
    { },
    { set_learnerEntryStatus }
  ) {
    const learnerEntryId = {
      uid,
      scheduleId,
      cycleId
    };

    const val = {
      uid,
      scheduleId,
      cycleId,
      nFinishedEntries: 0,
      nTotalEntries: 100 // TODO!
    };

    return set_learnerEntryStatus({ learnerEntryId }, val);
  }
};

const learnerEntryIdPath = {
  path: '$(learnerEntryId)',
  indices: {
    learnerEntryId: ['uid', 'scheduleId', 'cycleId']
  }
};

export default {
  allLearnerEntryData: {
    path: 'learnerEntries',
    readers,
    writers,
    children: {
      learnerEntryList: {
        path: 'list',
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
              queryParams({ scheduleId, cycleId }) {
                return [
                  ['orderByChild', 'cycleId'],
                  ['equalTo', cycleId]
                ];
              }
            }
          },
          learnerEntryStatus: {
            path: learnerEntryIdPath,
            children: {
              uid: 'uid',
              scheduleId: 'scheduleId',
              cycleId: 'cycleId',
              nFinishedEntries: 'nFinishedEntries',
              nTotalEntries: 'nTotalEntries',
              updatedAt: 'updatedAt',
              createdAt: 'createdAt'
            },
            onWrite: [
              'updatedAt',
              'createdAt',

              // function setCycleId(queryArgs, val, { currentScheduleCycleId }) {
              //   if (val && !val.cycleId) {
              //     const cycleId = currentScheduleCycleId();
              //     console.assert(cycleId,
              //       'tried to save learnerEntryStatus when currentScheduleCycleId was not loaded yet or returned invalid value');
              //     val.cycleId = cycleId;
              //   }
              // }
            ]
          },
        },
      },
      learnerEntryDataList: {
        path: 'data',
        children: {
          learnerEntryData: {
            path: learnerEntryIdPath,
            children: {
              // TODO
            }
          }
        }
      }
    }
  }
};
