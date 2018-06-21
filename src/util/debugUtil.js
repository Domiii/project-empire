if (process.env.NODE_ENV !== 'production') {
  // when not in production...

  // show more error information in Error.prototype.stack
  Error.stackTraceLimit = 100;
  
  let dataAccess;
  Object.defineProperty(window, 'dbdi', {
    get() {
      const tree = require('src/core/dataSourceTree').default;
      return dataAccess || (dataAccess = tree.newAccessTracker('TESTER'));
    }
  });
}

export const errorLog = [];

export function setupDebugTools() {
  // little HACKFIX:
  // keep an error log which is displayed to it's own page, so we can investigate errors when on mobile
  const fn = console.error.bind(console);
  console.error = function (...args) {
    errorLog.unshift({
      time: new Date(),
      args
    });
    fn(...args);
  };
}