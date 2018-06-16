import sortBy from 'lodash/sortBy';
import map from 'lodash/map';
import filter from 'lodash/filter';
import size from 'lodash/size';
import forEach from 'lodash/forEach';
import first from 'lodash/first';
import last from 'lodash/last';
import times from 'lodash/times';
import constant from 'lodash/constant';
import findIndex from 'lodash/findIndex';

import { NOT_LOADED } from '../../dbdi/react/dataBind';

export const PresentationStatus = {
  Pending: 1,
  GettingReady: 2,
  OnStage: 3,
  InProgress: 4,
  Finished: 10,
  Skipped: 15
};

export function isPresentationStatusGoTime(status) {
  return status === PresentationStatus.GettingReady || status === PresentationStatus.InProgress;
}

export const PresentationViewMode = {
  Normal: 0,
  Edit: 1,
  Operator: 2
};

const presentationReaders = {

};

const presentationWriters = {

};


function censorUserName(name) {
  // TODO: handle non-chinese names properly

  if (name.length > 5) {
    // strange?
    //console.warn('cannot properly censor user name with more than 5 character currently:', name);
  }
  const start = first(name);
  const end = name.length > 2 ? last(name) : '';
  const middle = times(size(name) - size(start) - size(end), constant('*')).join('');

  return `${start}${middle}${end}`;
}

function censorUserNames(userNames) {
  return map(filter(userNames, name => !!name && name.trim && name.trim()), censorUserName);
}

export default {
  presentationData: {
    path: 'presentations',
    children: {
      presentations: {
        path: {
          path: 'list',
          indices: {
            sessionId: 'sessionId'
          }
        },
        readers: {
          presentationCount(args, { get_presentations }) {
            const presentations = get_presentations(args);
            if (presentations === NOT_LOADED) {
              return NOT_LOADED;
            }

            return size(presentations);
          },
          
          orderedPresentations(args, { get_presentations }) {
            !args.sessionId && console.error('called orderedPresentation without `sessionId`');

            let presentations = get_presentations(args);
            
            if (presentations === NOT_LOADED) {
              return NOT_LOADED;
            }

            // some odd bug introduces null entries for presentations somehow
            if (presentations && filter(presentations, p => !p).length > 0) {
              console.error('problem fetching presentations', presentations);
              presentations = filter(presentations, p => !!p);
            }

            // since we lose the id when converting to array, we do an ugly hack-around here
            forEach(presentations, (p, id) => p.id = id);
            console.warn(args.sessionId, sortBy(presentations, 'index'));

            return sortBy(presentations, 'index');
          },

          nonPendingPresentations(
            args,
            { orderedPresentations }
          ) {
            const ps = orderedPresentations(args);
            const i = findIndex(ps, p => 
              p.presentationStatus === PresentationStatus.Pending || 
              p.presentationStatus === PresentationStatus.GettingReady
            );
            return ps.slice(0, i);
          },
          pendingPresentations(
            args,
            { orderedPresentations }
          ) {
            const ps = orderedPresentations(args);
            const i = findIndex(ps, p => 
              p.presentationStatus === PresentationStatus.Pending || 
              p.presentationStatus === PresentationStatus.GettingReady
            );
            return ps.slice(i);
          }
        },
        children: {
          presentation: {
            path: '$(presentationId)',

            hasMany: [
              'user',
              'project'
            ],

            onWrite: [
              'createdAt',
              'updatedAt'
            ],

            readers: {
              getPresentationVideoTitle(
                presentationArgs,
                { get_presentation }
              ) {
                const pres = get_presentation(presentationArgs);
                if (!pres) return pres; // null or NOT_LOADED

                const {
                  title,
                  userNamesString
                } = pres;

                // TODO: handle non-chinese names properly (cannot just split by whitespace)
                const userNames = (userNamesString || '').split(/\s+/);
                const censoredUsersString = censorUserNames(userNames);

                return `${title || ''} (${censoredUsersString.join(',  ')})`;
              }
            },

            children: {
              presentationSessionId: 'sessionId', // the session this presentation belongs to
              presentationIndex: 'index', // the order during the session

              presentationStatus: 'presentationStatus',
              creatorUid: 'creatorUid', // the user who started this presentation
              presentationFileId: 'fileId', // local filesystem fileId (file only available to creator on the device + browser they used to record it with)
              presentationVideoId: 'videoId', // youtube videoId (once uploaded)
              presentationFinishTime: 'finishTime',

              title: 'title',
              userNamesString: 'userNamesString',
              commentText: 'commentText'
            }
          },

          // /**
          //  * Since the editing user might not have access to the content provider backend (e.g. youtube channel),
          //  * we have to collect all possible issues of out-of-sync data, and let someone with corresponding
          //  * access privilege fix it through a single button press later.
          //  */
          // allPresentationSyncInfo: {
          //   path: 'syncInfo/$(sessionId)',

          //   writers: {
          //     async syncAllVideos() { },
          //     async fetchAllOutOfSyncPresentationInfo() {
          //       // TODO: get video info from content provider, and update sync status in DB
          //     },
          //   },
          //   children: {
          //     presentationSyncInfo:{
          //       path: '$(presentationId)',
          //       children: {
          //         // whether the presentation video's title has changed and not yet synced
          //         presentationSyncVideoTitle: 'title'
          //       }
          //     }
          //   }
          // }
        }
      }
    }
  },

  /**
   * The current user's presentation settings for specific sessionIds
   */
  presentationUserSettings: {
    dataProvider: 'memory',
    path: 'presentationUsersSettings/$(sessionId)',

    children: {
      /**
       * Whether this user is uploading videos for the session of given sessionId
       */
      isPresentationUploadMode: {
        path: 'uploadMode'
      },

      // presentationUserMode: {
      //   path: 'mode',
      //   reader(val, sessionArgs, { isPresentationSessionOperator }) {
      //     const isOp = isPresentationSessionOperator(sessionArgs);
      //     if (!isOp) {
      //       return val || PresentationViewMode.Normal;
      //     }
      //     return PresentationViewMode.Operator;
      //   }
      // }
    }
  }
};