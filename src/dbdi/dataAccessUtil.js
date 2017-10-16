import mapValues from 'lodash/mapValues';

export function getOptionalArguments(args, argsConfig) {
  return mapValues(argsConfig, (defaultVal, name) => {
    if (name in args) {
      return args[name];
    }
    return defaultVal;
  });
}