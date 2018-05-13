import sortBy from 'lodash/sortBy';
import size from 'lodash/size';
import forEach from 'lodash/forEach';
import { NOT_LOADED } from '../../dbdi/react/dataBind';

export const PresentationStatus = {
  Pending: 1,
  //Preparing: 2,
  GoingOnStage: 3,
  InProgress: 4,
  Finished: 10,
  Cancelled: 15
};

export const PresentationViewMode = {
  Normal: 0,
  Edit: 1,
  Operator: 2
};

const presentationReaders = {
  
};

const presentationWriters = {
  
};

export default {
  presentationData: {
    path: 'presentations',
    children: {
      presentations: {
        path: 'list',
        indices: {
          sessionId: 'sessionId'
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
            const presentations = get_presentations(args);
            if (presentations === NOT_LOADED) {
              return NOT_LOADED;
            }

            // since we lose the id when converting to array, we do an ugly hack-around here
            forEach(presentations, (p, id) => p.id = id);

            return sortBy(presentations, 'index');
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

            children: {
              sessionId: 'sessionId', // the session this presentation belongs to
              index: 'index', // the order during the session

              presentationStatus: 'presentationStatus',
              creatorUid: 'creatorUid', // the user who started this presentation
              presentationFileId: 'fileId', // local filesystem fileId (file only available to creator on the device + browser they used to record it with)
              videoId: 'videoId', // youtube videoId (once uploaded)
              presnetationFinishTime: 'finishTime',

              title: 'title',
              commentText: 'commentText'
            }
          },

          presentationSyncInfo: {
            path: '$(presentationId)',
            children: {
              // whether the presentation video's title has changed and not yet synced
              presentationSyncVideoTitle: 'title'
            }
          }
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