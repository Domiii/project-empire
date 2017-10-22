import map from 'lodash/map';
import sortBy from 'lodash/sortBy';
import filter from 'lodash/filter';
import take from 'lodash/take';
import takeRight from 'lodash/takeRight';

import { EmptyObject, EmptyArray } from 'src/util';

/**
 * First version credit goes to react-redux-firebase!
 * TODO: Make this more performant + stabler
 * 
 * @see https://github.com/prescottprue/react-redux-firebase/tree/master/src/utils/query.js#L123
 * 
 * @param {*} queryParams 
 * @param {*} query 
 */
export function applyParamsToQuery(queryParams, query) {
  queryParams.forEach(param => {
    switch (param[0]) {
      case 'orderByValue':
        query = query.orderByValue();
        break;
      case 'orderByPriority':
        query = query.orderByPriority();
        break;
      case 'orderByKey':
        query = query.orderByKey();
        break;
      case 'orderByChild':
        query = query.orderByChild(param[1]);
        break;
      case 'limitToFirst':
        // TODO: Handle number not being passed as param
        query = query.limitToFirst(parseInt(param[1], 10));
        break;
      case 'limitToLast':
        // TODO: Handle number not being passed as param
        query = query.limitToLast(parseInt(param[1], 10));
        break;
      case 'equalTo':
        let equalToParam = param[1];
        query = param.length === 3
          ? query.equalTo(equalToParam, param[2])
          : query.equalTo(equalToParam);
        break;
      case 'startAt':
        let startAtParam = param[1];
        query = param.length === 3
          ? query.startAt(startAtParam, param[2])
          : query.startAt(startAtParam);
        break;
      case 'endAt':
        let endAtParam = param[1];
        query = param.length === 3
          ? query.endAt(endAtParam, param[2])
          : query.endAt(endAtParam);
        break;
      default:
        throw new Error('unknown query argument: ' + param[0]);
    }
  });
  return query;
}

const objectSelectors = {
  orderByValue(__, _, obj) {
    return obj.val;
  },

  orderByPriority(__, _, obj) {
    // NYI
    console.error('[NYI] orderByPriority is not implemented in dbdi-firebase');
    return 0;
  },

  orderByKey(__, _, obj) {
    return obj.key;
  },

  orderByChild(child, _, obj) {
    return obj.val[child];
  }
};


const filters = {
  limitToFirst(limit, selectorFn, result) {
    return take(result, limit);
  },
  limitToLast(limit, selectorFn, result) {
    return takeRight(result, limit);
  },
  equalTo(filterVal, selectorFn, result) {
    return filter(result, obj => selectorFn(obj) === filterVal);
  },
  startAt(filterVal, selectorFn, result) {
    return filter(result, obj => selectorFn(obj) >= filterVal);
  },
  endAt(filterVal, selectorFn, result) {
    return filter(result, obj => selectorFn(obj) <= filterVal);
  }
};

export function applyQueryToDataSet(data, queryParams) {
  // convert object to array
  let result = map(data, (val, key) => {
    return {
      key,
      val
    };
  });

  // determine filters + selectors

  //let sortFn;
  let selectorFn;
  const filterFns = [];
  queryParams.forEach(param => {
    param = param || EmptyArray;
    //sortFn = sorters[param[0]].bind(null, param[1], param[2]) || sortFn;
    selectorFn = objectSelectors[param[0]].bind(null, param[1], param[2]) || selectorFn;
    filters[param[0]] && filterFns.push(filters[param[0]].bind(null, param[1]));
  });

  // first sort (because some filters require sorting before being effective)
  if (selectorFn) {
    result = sortBy(result, selectorFn);
  }
  
  // then filter
  filterFns.forEach(filterFn => result = filterFn(selectorFn, result));

  return result;
}