import isPlainObject from 'lodash/isPlainObject';
import isArray from 'lodash/isArray';
import isString from 'lodash/isString';
import isFunction from 'lodash/isFunction';
import map from 'lodash/map';
import filter from 'lodash/filter';
import uniqBy from 'lodash/uniqBy';

import { EmptyObject, EmptyArray } from 'src/util';



export function getOptions(allValues, context, item) {
  let options = item.options;
  if (isFunction(options)) {
    options = options(allValues, context, item);
  }

  if (isPlainObject(options)) {
    // key -> value mappings
    return map(options, (v, k) => ({label: v, value: k}));
  }
  if (isArray(options)) {
    return map(options, v => isPlainObject(v) ? v : ({label: v, value: v}));
  }
  if (!options) {
    return EmptyArray;
  }
  throw new Error('invalid options: ' + JSON.stringify(options) + 
    ' (in item definition: ' + JSON.stringify(item) + ')');
}

export const formItemSpecs = {
  section: {
    isNotInput: true,
  },
  text: {
    
  },
  checkbox: {
  },
  radio: {
  }
};

export function isItemInput(allValues, context, item) {
  const typeSpec = formItemSpecs[item.type];
  return !item.isNotInput && 
    (!typeSpec || !typeSpec.isNotInput);
}

export function isItemReadonly(allValues, context, item) {
  const typeSpec = formItemSpecs[item.type];
  return !isItemInput(allValues, context, item) || (
      item.readonly || 
      (typeSpec && typeSpec.readonly)
    );
}

export function validateAndSanitizeFormat(allValues, context, items) {
  if (!isArray(items)) {
    throw new Error('form format must be an array of items: ' + JSON.stringify(items, null, 2));
  }

  const id = {};

  items.forEach(item => {
    // make sure, each item has a valid type
    const typeSpec = formItemSpecs[item.type];
    if (!typeSpec) {
      throw new Error('invalid form item type `' + item.type + '` on item: ' + JSON.stringify(item) + ' - ' + JSON.stringify(items, null, 2));
    }

    // make sure, each item has a unique id
    if (!item.id) {
      if (isItemInput(allValues, context, item)) {
        throw new Error('invalid form item: `' + JSON.stringify(item) + '` must have an "id" property');
      }
    }
    else {
      if (!!id[item.id]) {
        throw new Error('multiple form items with same id `' + item.id + '`: ' + 
          JSON.stringify(items, null, 2));
      }
      id[item.id] = 1;
    }
  });

  return filter(items, item => !item.if || !!item.if(allValues || EmptyObject, context, items));
}


export function getValue(val, selectFrom, selectFromContext, context) {
 if (!selectFrom && !selectFromContext) {
  return val;
 }
 else if (!!selectFromContext) {
  const container = context[selectFrom];
  return container && container[val];
 }
 else {
  const result = selectFrom[val];
  return result && (isPlainObject(result) ? result.value : result);
 }
}