let SimulatorModel;

if (process.env.NODE_ENV !== 'production') {
  SimulatorModel = {
    simulator: {
      writers: {
        async simPresentationSessionStart(
          { startDelay, finishDelay },
          { },
          { set_simActive }
        ) {
          const timer = setTimeout();
          set_simActive(timer);
        },

        async simPresentationSessionStop(
          { },
          { get_simActive },
          { }
        ) {
          const timer = get_simActive();
          if (timer) {
            clearTimeout(timer);
          }
        }
      },
      children: {
        simActive: 'simActive'
      }
    }
  };
}
else {
  SimulatorModel = {};
}

export default SimulatorModel;