'use strict';

module.exports = self => {
  for (const key of Object.getOwnPropertyNames(self.constructor.prototype)) {
    if (key !== 'constructor' &&
        key !== 'arguments' &&
        key !== 'caller') {
      const val = self[key];

      if (typeof val === 'function') {
        self[key] = val.bind(self);
      }
    }
  }

  return self;
};