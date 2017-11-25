
/**
 * Feedback
  * User story: A sends feedback F to B. B now sees F as "active/received". A sees the feedback as "active/sent".
    * B can 
    * F will now be "archived/reacted" to B.
    * A can see the reaction immediately in their "active/replied"
      * A can decide to comment + archive it after talking to B the next time.
        * F will now be "archived/checked" to A.
  * TODO: repeated feedback? (including a "gave up" flag)
 */

export default dataBind()(function FeedbackView(
  {},
  {},
  {}
) {
  return (<Alert>
    <div>
      * Types of feedback:
        * reference material (inspirational, learn, etc.), habit, list of `FeedbackTypeTemplate`
        * question + possible goal (e.g. to make )?
        * LearningObservation (e.g.: 卡住而分心, 連開始都沒開始, 一開始先休息, 幾乎都在休息)
      * Feedback can be in reaction to:
        * Meeting, Project (w/o meeting), Feedback, Promise, DailyReflection
      * Feedback text
    </div>
    <div>
      Reaction Buttons
      * one button per emotion
      * one button per reaction
      * everyone gets to react to feedback
        * can see reaction status of everyone in group
        * feedback is shown in multiple places: under Project team, as well as own feedback list
    </div>
  </Alert>);
});