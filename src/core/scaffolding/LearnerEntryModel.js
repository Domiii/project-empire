import map from 'lodash/map';
import mapValues from 'lodash/mapValues';
import groupBy from 'lodash/groupBy';
import zipObject from 'lodash/zipObject';

import { EmptyObject } from '../../util/miscUtil';

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
    const ids = Object.keys(entries || EmptyObject);
    const entryIdsByUid = zipObject(map(ids, id => entries[id].uid), ids);

    //const byUid = mapValues(groupBy(entries, 'uid'), arr => arr[0]);
    return mapValues(usersPublic, (_, uid) => entryIdsByUid[uid] || null);
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

const indices = {
  uid: ['uid'],
  scheduleCycle: ['scheduleId', 'cycleId'],
  learnerEntryId: {
    keys: ['uid', 'scheduleId', 'cycleId'],
    isProperty: false // this should never be written as a property
  }
};

const learnerEntryIdPath = {
  path: '$(learnerEntryId)',
  indices
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
              indices,
              queryParams({ uid }) {
                return { uid };
              }
            }
          },
          learnerEntriesOfCycle: {
            path: {
              indices,
              queryParams({ scheduleId, cycleId }) {
                return { scheduleId, cycleId };
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
