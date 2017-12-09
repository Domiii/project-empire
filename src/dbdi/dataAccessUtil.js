import mapValues from 'lodash/mapValues';
import map from 'lodash/map';
import isPlainObject from 'lodash/isPlainObject';

export function getOptionalArguments(args, ...namesOrConfig) {
  const argsConfig = namesOrConfig[0];
  if (isPlainObject(argsConfig)) {
    return mapValues(argsConfig, (defaultVal, name) => {
      if (name in args) {
        return args[name];
      }
      return defaultVal;
    });
  }
  
  const names = namesOrConfig;
  return map(names, name => getOptionalArgument(args, name));
}

export function getOptionalArgument(args, name, defaultVal = null) {
  return (name in args) && args[name] || defaultVal;
}