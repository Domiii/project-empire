# project-empire


* Users can group up and go on projects (after picking from a vast list of missions)
* Each project is completed in one or more sprints
  * ![sprint](http://www.dgc.co.uk/wp-content/uploads/2012/11/agile-sprint.jpg)
* At the end of each sprint, there is a "Demo & Feedback" meeting 『團隊鑑定』

* 準備/上課 SOP: https://docs.google.com/presentation/d/1PEDof6WXYTD4ejQWoBBlglemhnPD9OAx_4yTjyRLcBw/edit#slide=id.g1feab3d031_0_9
* 團隊鑑定 SOP + Karma 值算法： https://docs.google.com/spreadsheets/d/1JebRfwpLtFrlJBeuXrlGCvpzy5l8G_k5iha_WghgGsU/edit#gid=845971887
  * https://docs.google.com/presentation/d/1PEDof6WXYTD4ejQWoBBlglemhnPD9OAx_4yTjyRLcBw/edit#slide=id.g1ff0478143_0_7


* W2-W3
  * Properly organize the steps in Mission Control GUI
    * Project Overview + Status
    1. [Advanced] Prepare for mission
    1. Sprint(i):
      1. Go on mission (stateless?)
      1. Party meeting prep
      1. GM meeting prep
      1. Run meeting
        * checklist: 『團隊鑑定標準』
      1. [Advanced] Post-meeting reflection + plan next steps
    1. Mission Finished

  * [Weekend]
    * 冒險者可以看到各種數值（自己）
    * GM 可以切換自己的身分
    * GM 可以 assign Project 的 reviewer
    * 個人鑑定表：
      * 每個冒險者可以看到自己團隊所有人的 ｢團隊鑑定的準備｣ status
      * 加 『我準備好了』項目 （填完所有 isRequired 項目後才顯示）
    * Reviewer 可以看到自己被 assigned 的 Project
    * Reviewer 可以開始進行 『團隊鑑定』
    * Reviewer 可以 end/finish project (『執行任務的過程』)
    * Properly manage, update + compute project status

  * [Mon]
    * Reviewer 可以看到大家的　『團隊鑑定準備』　的結果 table
    * Reviewer 可以做 『團隊鑑定』 的紀錄
      * Reviewer 只能用 text 來紀錄 fame, karma + gold　（隔週才能分配＋看到結果）
      * 也要記錄團隊想要的數值分配比例
    * delete `explicitIndex` data when deleting related entries!!!

* W3-W4
  * 紀錄使用者的所有 login (看到的資訊？)
  * 紀錄使用者的所有 重要事件
  * checklist meta level: 
    * 『覺得沒價值』 ＋  『不知道／不懂項目』 的選項
  * 冒險者可以看到自己以前所有 archivedProjects
  * [ProjectView] render + allow editing of guardianNotes + gmNotes + partyNotes
  * GM 可以分配 fame, karma + gold
  * 冒險者可以看到各種數值（排行板）
  * GM 可以準備團隊鑑定
  * GM 可以看到所有人的 archivedProjects

* W4-6
  * GM 可以 archive (歸檔)　project (『執行任務的過程』)
  * 冒險者可以看到　｢live 團隊鑑定｣　的紀錄
  * 冒險者可以參與團隊鑑定紀錄 (給 feedback，自評，互評等等)
  * 各種紀錄的 summary
  * 冒險者可以預約 GM 團隊鑑定
  * GM 可以分配 卡片
  * GM 可以進行自己的鑑定 prep SOP (gmSubmitMeetingPrep)
  * LFG 功能 (mission wishlist) + p2p team creation

* W6-?
  * 團隊一開始可以設定 "離開 penalty" (扣多少金幣要給留下來的團員)
  * system for skills + badges
    * tags + skill overview
  * add project steps + details for ambitious people
    * 更多非必要的項目： 更多反思、投入度、合作、完整度等等細項
    * add "project prep" as first phase to help the team hit the ground running
      * 提供相關的資料，包含以前做過這個任務的成果範例
      * [進階] 反思，彼此了解互相的想法、預測目標、投入度（還有他們歷史？）


### TODO

Important:

* Mission Control -> Current Project:
  * mission name + team members
  * 鑑定前：
    * 個人鑑定表, include:
      * 鑑定簡報 checklist
        * also check 準備的資料的完整度
      * more Checklists?
        * 也可以直接選　｢i don't care｣，忽略 checklist

* GMPage
  * 鑑定紀錄
    * 一堆 checklist
    * archiving an project
  * 資源的紀錄

(* Game Board)

#### Pages

* Landing Page
  * 新聞 (or at least 上課簡報)
  * Activity Log?
* Mission Control
  * [*] Mission list
    * Mission editor
  * Active Project list
  * Game Board
    * all 冒險者 numbers in leaderboard
  * My Current Project
    * [if no mission] "please register a mission with Guardian"
    * current mission info + team info
    * activity log + notes area
    * [future work] milestones?
    * 鑑定區
      * 預備
        * 預約 GM
        * 準備資料 + 個人鑑定
        * 鑑定簡報標準 + more Checklists?
      * 進行
      * 結果
* Guardian page: ｢登記任務｣
  * 建立 + edit teams
    * assign mission
* GM Page
* Help Page
  * 簡介
  * Q&A
  * Manual + Rulebook