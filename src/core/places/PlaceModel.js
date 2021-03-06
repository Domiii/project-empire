import { EmptyObject } from 'src/util';

/**
 * Place data
 */
const placesById = {
  path: '$(placeId)',
  onWrite: [
    'updatedAt',
    'createdAt'
  ],
  children: {
    placeName: 'name',
    placeDescription: 'description',
    placeLeaderUid: 'leaderUid',
    placeGMUid: 'gmUid'
  }
};

const readers = {

};

const writers = {

};

export default {
  allPlaceData: {
    path: '/places',
    readers,
    writers,
    children: {
      placeList: {
        path: 'list',
        children: {
          placesById
        }
      }
    }
  }
};