# project-empire


* Users can group up and go on projects (after picking from a vast list of missions)
* Each project is completed in one or more sprints
  * ![sprint](http://www.dgc.co.uk/wp-content/uploads/2012/11/agile-sprint.jpg)
* At the end of each sprint, there is a "Demo & Feedback" meeting 『團隊鑑定』

* 準備/上課 SOP: https://docs.google.com/presentation/d/1PEDof6WXYTD4ejQWoBBlglemhnPD9OAx_4yTjyRLcBw/edit#slide=id.g1feab3d031_0_9
* 團隊鑑定 SOP + Karma 值算法： https://docs.google.com/spreadsheets/d/1JebRfwpLtFrlJBeuXrlGCvpzy5l8G_k5iha_WghgGsU/edit#gid=845971887
  * https://docs.google.com/presentation/d/1PEDof6WXYTD4ejQWoBBlglemhnPD9OAx_4yTjyRLcBw/edit#slide=id.g1ff0478143_0_7


## 系統目標：輔助彈性學習環境的架構

* 搞清楚自己的目標、把雙手弄髒、從自己的 action 明顯感受到成就感、平時反省
* 陪養做 Project 的好習慣
* 進行一個好的與 Mentor Meeting、檢討方式
* Promise (學習能力差 = 答應的事情容易會忘記，我們要想辦法紀錄)
* Inspiration, Sharing, Exploration, Curiosity
* Feedback (了解說人家給我們的 feedback，我們怎麼要轉換成 action？)


## TODO


### Fundamentals
* mission editor
* import all missions
* 每個人可以開始執行任務
* 每個人可以觀察自己的任務狀態
* 每個人可以放棄自己在做的任務
* 每個人可以提交任務的結果到自己的任務裡面去
* 公會長、守門人、GM 可以給回饋 comment
* 公會長、守門人、GM 可以幫忙把更多人加到 任務團隊
* 公會長、守門人、GM 可以按一個按鈕：『任務完成了，可以分享』
* 公會長、守門人、GM： 『開始分享』
* GM 有 button：可以 check 任務每個 checkpoint
* GM 有 button：可以讓任務過
* GM 有 button：『團隊檢定沒過』
* GM 有 button：『上台沒過』

### Next
* 公會長應該要看到自己的人的狀況
* ActiveProjectsPage vs. FinishedProjectsPage
* event system: keep track of all important events
* disable unnecessary features
* Unity: game feature list
* Unity: 學習地圖

### Learner Record
* 

### 學習地圖
* Unity/Scratch 50 個遊戲功能清單

### Next big goal(s)
* Learner KB editing
  * edit multiple choices
  * categories + tags
* LearnerStatus forms
* complete Meeting SOP + Meeting forms
* complete Project SOP
* Complete LearnerOverview
* simple Place editing

### Feature: Building student learner profiles

#### LearnerStatusList
* 

#### LearnerEntryList
* query: uid
* 
#### learner profile META

* 針對每一項：
  * 額外 comment
  * 夠不夠完整？ 
  

#### 每日推薦的小活動

* Talk to someone about your project (with some depth, not just superficially)
* Ask someone else at least one meaningful question related to their project
* Ask someone else at least one meaningful question related to their personal life
* Before deciding to take a break, at least work for 10 minutes (keep going if you feel like it)
* 找更多東西加到靈感庫
* [Advanced]
  * Remind someone if they are distracted (including yourself?); ask them why
  * Get in the mood (actively; figure out together how to "get in the mood")
  * Ask yourself at least one meaningful question related to your project
  * Ask yourself at least one meaningful question related to your personal life
* `CustomSDLActivities`

* ActivityList, for each Activity:
  * Related to project...
  * ActivityTemplate
    * Productive
      * Discussion
      * Scheduled meeting
      * Focused learning/work
      * Consumption vs. Creation?
    * Unproductive, recharge batteries, take break


### Feature: Learning structures

* Overview
  * Actions:
    * (all) Project List, give Feedback, make Promise
    * Help team, offer to write for them: DailyReflection, Promise, Feedback
  * currently active meeting
  * DailyReflection status
  * Active Projects + status
    * Start Meeting
  * Active Feedback (to me) + Promises (by me)
  * Active Feedback (by me) + Promises (to me)
  * Archive (Projects, DailyReflection, Feedback (rcv) + Promises (snd), Feedback (snd) + Promises (rcv))
  * TODO: My Stats / Overall Stats
* Project
  * Project type: PersonalGoal + PersonalInterests (?)
    * 參與別人的過程 (問他們做什麼，多多了解他們的東西 or 問他們提出一個跟某個主題有關的問題)
    * Explore （探索）
    * Ask questions, be curious （問問題，啟發好奇心）
    * Try things out （體驗）
    * Inspiration compilation（靈感庫）
    * Rapid Prototyping: 每個禮拜至少做出一（兩）個迷你作品
      * 包含： “Model then modify”
  * Project type: Mission
  * Project type: 大專案？
  * Project type: 自主學習／共學？
* Meeting
  * reminder when a project didn't have a meeting in too long (e.g. 1 week (yellow) 2+ weeks (red))
  * list of all learners and their most recent meeting
* DailyReflection - In reaction to given timeslot T:
  * Motivation:
    * GM 如果要幫你個人化你自己的學習的話，那他們就需要更清楚知道你的狀況才有辦法的
    * 你不想要別人批評你，評鑑你的話，就需要開始學會自己評自己才有辦法提升解決問題與自主人生能力
  * Method:
    * learner 平時自動提醒要填
      * learner 至少一個禮拜一次（四）
      * learner 可以自己決定要不要填自主學習時間的 feedback
    * learner 看到自己反思的紀錄 與　最近的紀錄狀況（有沒有認真做）
    * learner 可以看到最新關於 reflection 的 feedback
    * learner 先看清楚目前的狀態 (project status, personal goals(?), feedbacks, promises) 再填
    * Reviewer + GM
      * 可以看到其他人的紀錄
      * 針對 DailyReflection 給 feedback
  * Data:
    * GoalSetting
    * GoalHoning (essentially the same as "promises to self")
    * SDL Strategies
      * Get in the mood (actively)
      * Talk to someone about your project (with some depth, not just superficially)
      * Ask yourself at least one meaningful question related to your project
      * Ask someone else at least one meaningful question related to their project
      * Remind someone if they are distracted (including yourself?); ask them why
      * At least persist for 10 minutes (keep going if you feel like it)
      * `CustomSDLStrategies`
    * Achievement: "I feel I have achieved a lot!", "I feel I have achieved something", "I feel I have not achieved as much as I wanted", "I don't feel any feeling of achievement"
    * Getting stuck (checkboxes): "I was not stuck", "I was stuck but persisted", "I was stuck and got distracted"
    * Did you overcome something particularly difficult?
    * Guidance: "I have received enough guidance", "I want more guidance", "Guidance was Ok", "There was no guidance, but I did not need any", "I don't care"
    * Ask at least one meaningful question related to what you did today or your emotions today.
    * ActivityList, for each Activity:
      * Related to project...
      * ActivityTemplate
        * Productive
          * Discussion
          * Scheduled meeting
          * Focused learning/work
          * Consumption vs. Creation?
        * Unproductive, recharge batteries, take break
  * TODO: Different people might have different priorities for their reflections
  * Mentor/coach double checks in next meeting (or in class?), queries + records the source of "strong emotions", so as to give learner a chance to share their feeling of success (+ prevent false positives)
    * "Evaluation of reflection" (e.g.:  what is the purpose of your reflection? is it a good reflection? what makes a good reflection? etc...)
  * Analyze:
    * Time between timeslot + record createdAt
* Feedback/hint
* Promise
  * Can make promises to individuals or project teams
  * <ProjectTemplates>
  * Promiser can change status: InProgress -> Done, GiveUp
  * receiver of promise gets to evaluate fulfillment of promise
    * Fulfilled, Cancelled, Failed
* Sharing, Inspiration, Curiosity + Exploration
* Improving Productivity
  

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
