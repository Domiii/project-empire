import sortBy from 'lodash/sortBy';
import size from 'lodash/size';
import forEach from 'lodash/forEach';
import { NOT_LOADED } from '../../dbdi/react/dataBind';

export const PresentationStatus = {
  Pending: 1,
  InProgress: 2,
  Finished: 3,
  Cancelled: 4
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
              fileId: 'fileId', // local filesystem fileId (file only available to creator on the device + browser they used to record it with)
              videoId: 'videoId', // youtube videoId (once uploaded)

              title: 'title',
              commentText: 'commentText'
            }
          }
        }
      }
    }
  }
};