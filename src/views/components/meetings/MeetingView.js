
/**
 * 
 */

export default dataBind()(function MeetingView(
  {},
  {},
  {}
) {
  return (<Alert>
    <div>
      Meeting Timer
    </div>
    <div>
      Agenda:
      * What were your goals?
      * What were your successes?
      * Where were/have you stuck/failed? What was difficult?
      * Failed → Lesson learned?
      * Everyone ask at least one deep question (curious/want_to_learn_more)
      * [if has collaborator] Method + satisfaction of collaboration?
      * Need outside help?
      * Sharing + self-evaluation of current status of work
      * More in-depth content discussion
      * Go through previous Feedback, Promises + DailyReflections (problem: these are individual, need to first sum them up and discuss with the team), and wrap them up
        * Show all open Feedback/Promises related to project
        * [optional] Show all open feedback+promises related to each participant?
        * [optional] Show recent DailyReflecitons of each participant
        * [optional] archived Feedback/Promises/DailyReflections
        * Check/wrap up all relevant items
      * Issue new `Feedback`
      * ask: next Goals + Promises == ?
      * can finish/cancel project
    </div>
    <div>
      <Button>
        Finish Meeting
      </Button>
    </div>
  </Alert>);
});
