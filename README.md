# project-empire


* 準備/上課 SOP: https://docs.google.com/presentation/d/1PEDof6WXYTD4ejQWoBBlglemhnPD9OAx_4yTjyRLcBw/edit#slide=id.g1feab3d031_0_9
* 團隊鑑定 SOP + Karma 值算法： https://docs.google.com/spreadsheets/d/1JebRfwpLtFrlJBeuXrlGCvpzy5l8G_k5iha_WghgGsU/edit#gid=845971887
  * https://docs.google.com/presentation/d/1PEDof6WXYTD4ejQWoBBlglemhnPD9OAx_4yTjyRLcBw/edit#slide=id.g1ff0478143_0_7

TODO (features)

* W2-W3
  * delete `explicitIndex` data when deleting related entries!!!
  * 個人鑑定表：
    * 加 『我準備好了』項目 （填完所有 isRequired 項目後才顯示）
  * GM 可以切換自己的身分
  * GM 可以 assign Adventure 的 reviewer
  * Properly organize the steps in Mission Control GUI
    * Adventure Overview + Status
    1. Start
      1. Register
      1. [Advanced] Prepare for mission
    1. Go:
      1. Go on mission (stateless?)
      1. Party meeting prep
      1. GM meeting prep
      1. Run meeting
        * 有沒有做完任務的基本要求？
        * 有沒有特色？超過任務的要求？令人驚訝的特點？
        * 整體投入度？
        * 合作 ＋ 溝通方式？
        * 有沒有 carry + 每個人的 *貢獻* 大概多少?
        * 他們填表有沒有認真填？有什麼看不懂的 or 誤會的 or 不贊同的？
        * 他們對我們整體過程的感覺有沒有意見？
      1. [Advanced] Post-meeting reflection + plan next steps
    1. Mission Finished
  * Properly manage, update + compute adventure status
    * 
  * Reviewer 可以看到自己被 assigned 的 Adventure
  * Reviewer 可以看到大家的　『團隊鑑定準備』　的結果
  * Reviewer 可以開始進行 『團隊鑑定』
  * Reviewer 可以做 『團隊鑑定』 的紀錄
  * Reviewer 只能用 text 來紀錄 fame, karma + gold　（隔週才能分配＋看到結果）
    * 也要記錄團隊要的分配比例
  * Reviewer 可以 end/finish adventure (『執行任務的過程』)
  * 冒險者可以看到 『團隊鑑定』 的結果
  * 冒險者可以看到各種數值（自己）
  * 每個冒險者可以看到自己團隊所有人的 ｢團隊鑑定的準備｣ status
  * Mission List: 把所有的 mission svg 檔案放上來

* W3-W4
  * checklist meta level: 
    * 『覺得沒價值』 ＋  『不知道／不懂項目』 的選項
  * 冒險者可以看到自己以前所有 archivedAdventures
  * [AdventureView] render + allow editing of guardianNotes + gmNotes + partyNotes
  * GM 可以分配 fame, karma + gold
  * 冒險者可以看到各種數值（排行板）
  * GM 可以準備團隊鑑定
  * GM 可以看到所有人的 archivedAdventures

* W4-6
  * GM 可以 archive (歸檔)　adventure (『執行任務的過程』)
  * 冒險者可以看到　｢live 團隊鑑定｣　的紀錄
  * 冒險者可以參與團隊鑑定紀錄 (給 feedback，自評，互評等等)
  * 各種紀錄的 summary
  * 冒險者可以預約 GM 團隊鑑定
  * GM 可以分配 卡片
  * GM 可以進行自己的鑑定 prep SOP (gmSubmitMeetingPrep)
  * LFG 功能 (mission wishlist) + p2p team creation

* W6-?
  * system for skills + badges
    * tags + skill overview
  * add adventure steps + details for ambitious people
    * 更多非必要的項目： 更多反思、投入度、合作、完整度等等細項
    * add "adventure prep" as first phase to help the team hit the ground running
      * 提供相關的資料，包含以前做過這個任務的成果範例
      * [進階] 反思，彼此了解互相的想法、預測目標、投入度（還有他們歷史？）


### TODO

Important:

* Mission Control -> Current Adventure:
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
    * archiving an adventure
  * 資源的紀錄

(* Game Board)

#### Pages

* Landing Page
  * 新聞 (or at least 上課簡報)
  * Activity Log?
* Mission Control
  * [*] Mission list
    * Mission editor
  * Active Adventure list
  * Game Board
    * all 冒險者 numbers in leaderboard
  * My Current Adventure
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