# project-empire


* Users can group up and go on projects (after picking from a vast list of missions)
* Each project is completed in one or more sprints
  * ![sprint](http://www.dgc.co.uk/wp-content/uploads/2012/11/agile-sprint.jpg)
* At the end of each sprint, there is a "Demo & Feedback" meeting 『團隊鑑定』

* 準備/上課 SOP: https://docs.google.com/presentation/d/1PEDof6WXYTD4ejQWoBBlglemhnPD9OAx_4yTjyRLcBw/edit#slide=id.g1feab3d031_0_9
* 團隊鑑定 SOP + Karma 值算法： https://docs.google.com/spreadsheets/d/1JebRfwpLtFrlJBeuXrlGCvpzy5l8G_k5iha_WghgGsU/edit#gid=845971887
  * https://docs.google.com/presentation/d/1PEDof6WXYTD4ejQWoBBlglemhnPD9OAx_4yTjyRLcBw/edit#slide=id.g1ff0478143_0_7



## TODO

### Feature: Project Control
* add iterations for repeatable nodes (when? where? what about delete?)
  * custom StageButtons for "sprint -> meeting" node: let reviewer/GM determine current status
  * add "Project is done" + "Project needs more work" + "Project has been cancelled" buttons
* fix `ProjectProgressBar` layout (when width > container width)
* when user triggers change in activeStagePath and route matches that stagePath → redirect to new active stage?
* enable/disable forms + form buttons under given conditions
* add 完成 buttons to forms to update contributor status
  * disable 完成 buttons when form is not valid yet
* add row below ProjectProgressBar with one ProjectContributorStatus per contributor
* fix form reset problem, use `onChange` to:
  * store React state to store changed version
  * auto-save form content (e.g. Google Docs auto-saves after a change has occured and then no change has occured for 3s)
* form frontend: disabled forms
* form frontend: GM can overview all form results
* StageContentView:
  * What to show in stages where there is no forms or where the form is not the main point?
  * How to aggregate all relevant (previously composed) data in the current stage?
* Prepare all form files + forms
* forms: always add meta choices: "don't make sense" 不合理, "don't care" 不管, "don't understand" 不懂, "not now" 再說
* forms: always add an "other/comment" 註解 option
* handle project archiving properly
* allow project team editing to add "any user" (not just users w/o project)
* feature: Admin can change own user for debugging (through FirebaseAuthDataProvider)
* When ProgressStatusBar is too long, slide to proper position

### Feature: Learning structures

* Feedback/hint
  * Types of feedback:
    * reference material (inspirational, learn, etc.), habit, list of `FeedbackTypeTemplate`
  * User story: A sends feedback F to B. B now sees F as "active/received". A sees the feedback as "active/sent".
    * B can react to the feedback:
      * [Emotions](https://simple.wikipedia.org/wiki/List_of_emotions)
      * Actions:
        * "Don't care"
        * "Don't understand" (w/ comment)
        * "Parts are unclear" (w/ comment)
        * "Make promise" -> list of `PromiseReactionTemplate`, e.g.:
          * Will do!
          * Will try
    * F will now be "archived/reacted" to B.
    * A can see the reaction immediately in their "active/replied"
      * A can attach an emotion to the reaction
      * A can decide to comment + archive it after talking to B the next time.
      * F will now be "archived/checked" to A.
  * Team feedback
    * everyone gets to react to feedback
    * can see reaction status of everyone in group
    * feedback is shown in multiple places: under Project team, as well as own reflection list
  * TODO: repeated feedback? (including a "gave up" flag)
* Promise
  * Can make promises to individuals or project teams
  * <ProjectTemplates>
  * Promiser can change status: InProgress -> Done, GiveUp
  * receiver of promise gets to evaluate fulfillment of promise
    * Fulfilled, Cancelled, Failed
* DailyReflection - In reaction to given timeslot T:
  * Overall Feeling: "Cool", "今天很感動，覺得突破自己了", "今天很感動，覺得有很感動的事情發生", "今天很感動", "普通", <OtherEmotions>
  * GoalSetting
  * GoalHoning (essentially the same as "promises to self")
  * Challenge
  * Achievement: "I feel I have achieved a lot!", "I feel I have achieved something", "I feel I have not achieved as much as I wanted", "I don't feel any feeling of achievement"
  * Getting stuck (checkboxes): "I was not stuck", "I was stuck but persisted", "I was stuck and got distracted"
  * Guidance: "I have received enough guidance", "I want more guidance", "Guidance was Ok", "There was no guidance, but I did not need any", "I don't care"
  * ActivityList, for each Activity:
    * Related to project...
    * ActivityTemplate
      * Productive
        * Discussion
        * Scheduled meeting
        * Focused learning/work
        * Consumption vs. Creation?
      * Unproductive, recharge batteries
  * Time between timeslot + record createdAt
  * Mentor/coach double checks in next meeting (or in class?), queries + records the source of "strong emotions", so as to give learner a chance to share their feeling of success (+ prevent false positives)
* Project
  * need to simplify
* Meeting
  * Can be with individual or project team
  * Can issue feedback to individual or project team
    * When with projects, need to check who participated
  * GM (or all?) can see list of recent meetings and who participated
    * list of all learners and their most recent meeting
  * reminder when someone didn't have a meeting in too long (e.g. 2 weeks)
  * SOP #1:
    * Go through goals
      * What were your goals?
      * What did you actually finish
      * Content discussion
    * Go through previous Feedback, Promises + TimeUse, and wrap them up
    * Give Feedback
    * next Goals + Promises
* ReflectionChecklist (Question)
* LearningObservation
  * Templates, e.g.: 卡住而分心, 連開始都沒開始, 一開始先休息, 幾乎都在休息
* List of LearnerSuccess/LearnerStuck/LearnerFail
  

#### Feature: Learning Structures - Concepts
  * Mostly used between GM/learner
    * (can be used between non-mentor stake holders; but requires at least one of the two participants to insist on it and use it for further value?)
  * Can convert feedback/hint/question to promise
  * Once a day, offer to check/monitor yourself
  * Check goal vs. strategy/implementation alignment
  * Allow "supporters"/mentors/coaches to record their observations of learners
  * Allow learners to keep a learner/reflection journal
  * Building your own learning structures (with or without software support) requires at least one strong leader and simple SOPs for mentors to help learners build up the scaffolding and habit formation

Feature: Promises
* Can make a promise to others (or self)
* Promise status: Done, Failed, Active
* Priority
  * According to who? Target or creator?
* Needs target or other (privileged) collaborator to counter check
  * Done, Failed, Cancelled
* UI
  * Notification: Promise
  * List promises by me
  * List promises for me
  * Sort promises by createdAt / updatedAt / priority?
  * Filter: Active/Archived
  * Paging for promises


Feature: Hints
* Can give hint to others
* Hint status: New, Useful, 

Feature: Promises (Advanced)
* Can make a promise as a group
* Can make a promise toward a group

### More Features

Feature: LFG
* 

Feature: Project Invitations

Feature: Proper mission lists + editing
* 

Feature: React Performance
* basic performance optimizations


Feature: Skills, Rubrics + Evaluation
* 

Feature: Data middleware
* Data model: higher level data structures within the data model?
* Data model data structure: StagePath


#### Motivation
`rrf v2.0` does not use `immutable` anymore, so `reselect` won't be of any help with data caching.


#### Solution
  1. During `render` call, use pre-compiled `getPath` helper function to access any data
  1. Wrap the `getPath` method to remember the set of all accessed data paths of **this and any child components**.
  1. Use `reselect` to produce the getters?
  1. Override `shouldComponentUpdate` to return true if and only if: (data at any of the given paths have changed (shallow comparison)) `or` (initially, when it has not rendered at least once)).

[Work in progress example](https://codepen.io/Domiii/pen/wrMGeN?editors=0010)


#### Remaining questions
