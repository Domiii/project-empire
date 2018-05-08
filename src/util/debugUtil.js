

// show more error information in Error.prototype.stack
Error.stackTraceLimit = 100;

export const errorLog = [];

export function setupDebugTools() {
  // setup some debugging stuff
  const fn = console.error.bind(console);
  console.error = function (...args) {
    errorLog.unshift({
      time: new Date(),
      args
    });
    fn(...args);
  };
}