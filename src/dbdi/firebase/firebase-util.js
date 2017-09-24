function tryParseToNumber(value) {
  const result = Number(value);
  if (isNaN(result)) {
    return value;
  }
  return result;
}

/**
 * Thanks go to react-redux-firebase!
 * 
 * @see https://github.com/prescottprue/react-redux-firebase/tree/master/src/utils/query.js#L123
 * 
 * @param {*} queryParams 
 * @param {*} query 
 */
export function applyParamsToQuery(queryParams, query) {
  let doNotParse = false;
  if (queryParams); {
    queryParams.forEach(param => {
      param = param.split('=');
      switch (param[0]) {
        case 'orderByValue':
          query = query.orderByValue();
          doNotParse = true;
          break;
        case 'orderByPriority':
          query = query.orderByPriority();
          doNotParse = true;
          break;
        case 'orderByKey':
          query = query.orderByKey();
          doNotParse = true;
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
        case 'notParsed':
          // support disabling internal number parsing (number strings);
          doNotParse = true;
          break;
        case 'equalTo':
          let equalToParam = !doNotParse ? tryParseToNumber(param[1]) : param[1];
          equalToParam = equalToParam === 'null' ? null : equalToParam;
          equalToParam = equalToParam === 'false' ? false : equalToParam;
          equalToParam = equalToParam === 'true' ? true : equalToParam;
          query = param.length === 3
            ? query.equalTo(equalToParam, param[2])
            : query.equalTo(equalToParam);
          break;
        case 'startAt':
          let startAtParam = !doNotParse ? tryParseToNumber(param[1]) : param[1];
          startAtParam = startAtParam === 'null' ? null : startAtParam;
          query = param.length === 3
            ? query.startAt(startAtParam, param[2])
            : query.startAt(startAtParam);
          break;
        case 'endAt':
          let endAtParam = !doNotParse ? tryParseToNumber(param[1]) : param[1];
          endAtParam = endAtParam === 'null' ? null : endAtParam;
          query = param.length === 3
            ? query.endAt(endAtParam, param[2])
            : query.endAt(endAtParam);
          break;
        default:
          throw new Error('unknown query argument: ' + param[0]);
      }
    });
  }
  return query;
}