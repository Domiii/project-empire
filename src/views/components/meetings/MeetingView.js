
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
      * form: projectMeeting
      * with project team
      * all can see list of recent meetings and who participated
      * list of all learners and their most recent meeting? 
      * View through previous Feedback, Promises + DailyReflections (problem: these are individual, need to first sum them up and discuss with the team), and wrap them up
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
