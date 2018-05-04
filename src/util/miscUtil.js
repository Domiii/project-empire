import flatMap from 'lodash/flatMap';

// If collection is array, return collection, 
//  else we assume it to be an object, and only return it's values array.
export function asArray(collection) {
  return collection;
  // return isArray(collection) ? collection : (
  //     isObject(collection) ? values(collection) : null
  //   );
}

/**
 * Creates new array with new element interjected 
 * between any two existing elements.
 * The given callback returns the interjected element
 * for the three arguments: arr[index], arr[index+1], index.
 * @see https://stackoverflow.com/questions/31879576/what-is-the-most-elegant-way-to-insert-objects-between-array-elements
 */
export function interject(arr, cb) {
  return flatMap(arr, (value, index, array) =>
    array.length - 1 !== index  // insert new object only if not already at the end
      ? [value, cb(value, arr[index + 1], index)]
      : value
  );
}


export const EmptyObject = Object.freeze({});
export const EmptyArray = Object.freeze([]);

export async function waitAsync(ms) {
  return new Promise((r, j) => setTimeout(r, ms));
}