import map from 'lodash/map';

export function getOptionalArguments(args, argsConfig) {
  return map(argsConfig, (defaultVal, name) => {
    if (name in args) {
      return args[name];
    }
    return defaultVal;
  });
}