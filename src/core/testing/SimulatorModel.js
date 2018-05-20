import doWait from '../../util/doWait';
import CancelablePromise from '../../util/CancelablePromise';
import dataSourceTree from '../dataSourceTree';
import { getOptionalArguments } from '../../dbdi/dataAccessUtil';

let SimulatorModel;

//function 

/* globals window document */

process.env.NODE_ENV !== 'production' && (function () {
  const $ = document.querySelector.bind(document);

  function clickElem(sel) {
    const elem = $(sel);
    if (!elem) {
      throw new Error(`element ${sel} does not exist`);
    }
    simulateClick(elem);
  }

  /**
   * Simulate a click event.
   */
  function simulateClick(elem) {
    // Create our event (with options)
    var evt = new window.MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    // If cancelled, don't dispatch our event
    //var canceled = !elem.dispatchEvent(evt);
    elem.dispatchEvent(evt);
  }

  // a bit hacky, but we'll fix it eventually!
  // this allows us to do something like this in the console:
  // dbdi.do.simPresentationSessionStart();
  let dataAccess;
  Object.defineProperty(window, 'dbdi', {
    get() {
      return dataAccess || (dataAccess = dataSourceTree.newAccessTracker('TESTER'));
    }
  });

  SimulatorModel = {
    simulator: {
      dataProvider: 'memory',

      readers: {
        isSimActive(
          { },
          { },
          { simActiveTimer }
        ) {
          return simActiveTimer !== null;
        }
      },

      writers: {
        async simPresentationSessionStart(
          args,
          { },
          { },
          { simPresentationSessionStop, set_simActiveTimer }
        ) {
          simPresentationSessionStop();

          const { startDelay, finishDelay, nReps } = getOptionalArguments(args, {
            startDelay: 4000,
            finishDelay: 6000,
            nReps: 20
          });

          console.warn(`starting sim: run ${nReps} times, startDelay: ${startDelay}, finishDelay: ${finishDelay}`);

          const timer = CancelablePromise.resolve();
          set_simActiveTimer(timer);

          try {
            // skip the preparation stuff
            const prepBtn = '#start-stream-btn';
            if ($(prepBtn)) {
              clickElem(prepBtn);
              await doWait(500);
            }

            // let's go!
            for (let i = 0; i < nReps; ++i) {
              await doWait(startDelay);
              clickElem('#stream-control-btn');
              await doWait(finishDelay);
              clickElem('#stream-finish-btn');
            }
            console.warn(`[SUCCESS] Finished sim (${nReps} reps)!`);
          }
          catch (err) {
            console.error('sim failed:', err.stack);
          }
          finally {
            set_simActiveTimer(null);
          }
        },

        async simPresentationSessionStop(
          { },
          { },
          { simActiveTimer },
          { set_simActiveTimer }
        ) {
          if (simActiveTimer) {
            set_simActiveTimer(null);
            simActiveTimer.cancel();
          }
        }
      },
      children: {
        simActiveTimer: 'simActiveTimer'
      }
    }
  };
}());

export default SimulatorModel || {};