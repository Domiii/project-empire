/**
 * Basic pagination (for Firebase only)
 */

import { getOptionalArguments } from '../dataAccessUtil';

export default {
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
        itemsPerPage: 30,
        ascending: false
      });

      return [
        ['orderByChild', orderBy],
        [ascending ? 'limitToFirst' : 'limitToLast', page * itemsPerPage]
      ];
    }
  }
};