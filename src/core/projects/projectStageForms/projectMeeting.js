
/**
   Meeting:
  * with project team
  * Reviewer Can issue feedback to individual or project team
  * Reviewer (or all?) can see list of recent meetings and who participated
    * list of all learners and their most recent meeting?
  * SOP #1:
    * Check all participants
    * Go through goals
      * What were your goals?
      * What were your successes, stuck, failures and lessons learned? (problem: what about individual s/f/l)? Help recording. Generate list of LearnerSuccess/LearnerStuck/LearnerFail/LearnerLessonLearned.
      * Content discussion
    * Go through previous Feedback, Promises + DailyReflections (problem: these are individual, need to first sum them up and discuss with the team), and wrap them up
      * 幫每個人了解 DailyReflection 給自己的好處
    * Give Feedback
    * next Goals + Promises
 */

const projectMeeting = {
  title: '',
  description: '',
  type: 'object',
  properties: [
    {
      id: 'createdAt',
      'title': 'Created',
      'type': 'number'
    },
    {
      id: 'updatedAt',
      'title': 'Last Updated',
      'type': 'number'
    },
    {

    }
  ]
};


export default projectMeeting;