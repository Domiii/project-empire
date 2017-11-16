# project-empire


* Users can group up and go on projects (after picking from a vast list of missions)
* Each project is completed in one or more sprints
  * ![sprint](http://www.dgc.co.uk/wp-content/uploads/2012/11/agile-sprint.jpg)
* At the end of each sprint, there is a "Demo & Feedback" meeting 『團隊鑑定』

* 準備/上課 SOP: https://docs.google.com/presentation/d/1PEDof6WXYTD4ejQWoBBlglemhnPD9OAx_4yTjyRLcBw/edit#slide=id.g1feab3d031_0_9
* 團隊鑑定 SOP + Karma 值算法： https://docs.google.com/spreadsheets/d/1JebRfwpLtFrlJBeuXrlGCvpzy5l8G_k5iha_WghgGsU/edit#gid=845971887
  * https://docs.google.com/presentation/d/1PEDof6WXYTD4ejQWoBBlglemhnPD9OAx_4yTjyRLcBw/edit#slide=id.g1ff0478143_0_7



## TODO

Feature: Project Control
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

Feature: LFG
* 

Feature: Project Invitations

Feature: Proper mission lists + editing
* 

Feature: React Performance
* basic performance optimizations

Feature: Learning structures
* Feedback/Hints
* Questions
* Promises
  * Conversion from hint/feedback to promise
* Once a day, offer to check/monitor yourself
* Check goal vs. strategy/implementation alignment
* Allow "supporters"/mentors to record their observations of students

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
