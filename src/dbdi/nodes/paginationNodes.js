/**
 * Basic pagination (for Firebase only)
 */

import sortBy from 'lodash/sortBy';

import { getOptionalArguments } from '../dataAccessUtil';
import { EmptyObject } from '../../util';

export default (nodeName, sortedIdNodeName) => {
  function queryParams(args) {
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

  const path = {
    queryParams
  };

  const children = {};

  if (nodeName) {
    children[nodeName] = {
      path
    };
  }

  if (sortedIdNodeName) {
    children[sortedIdNodeName] = {
      path,

      reader(vals, args) {
        // convert object of {id->entry} to sorted array of id
        if (vals) {
          const {
            orderBy,
            ascending
          } = getOptionalArguments(args, {
            orderBy: 'updatedAt',
            ascending: false
          });

          const ids = Object.keys(vals);

          return sortBy(ids,
            id => ascending ?
              vals[id][orderBy] :
              -vals[id][orderBy]
          );
        }
        return vals;
      }
    };
  }

  return children;
};