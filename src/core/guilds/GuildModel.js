import { EmptyObject } from 'src/util';
import { getOptionalArguments } from 'src/dbdi/dataAccessUtil';

/**
 * Guild data
 */
const guildsById = {
  path: '$(guildId)',
  onWrite: [
    'updatedAt',
    'createdAt'
  ],
  children: {
    guildName: 'name',
    guildDescription: 'description',
    guildLeaderUid: 'leaderUid',
    guildGMUid: 'gmUid'
  }
};

const readers = {

};

const writers = {

};

export default {
  allGuildData: {
    path: '/guilds',
    readers,
    writers,
    children: {
      guildList: {
        path: 'list',
        children: {
          guildsById
        }
      }
    }
  }
};