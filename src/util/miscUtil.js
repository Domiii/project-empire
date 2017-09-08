import _ from 'lodash';

// If collection is array, return collection, 
//  else we assume it to be an object, and only return it's values array.
export function asArray(collection) {
  return collection;
  // return _.isArray(collection) ? collection : (
  //     _.isObject(collection) ? _.values(collection) : null
  //   );
}


export const EmptyObject = Object.freeze({});
export const EmptyArray = Object.freeze([]);