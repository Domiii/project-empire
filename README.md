# project-empire


* 準備/上課 SOP: https://docs.google.com/presentation/d/1PEDof6WXYTD4ejQWoBBlglemhnPD9OAx_4yTjyRLcBw/edit#slide=id.g1feab3d031_0_9
* 團隊鑑定 SOP + Karma 值算法： https://docs.google.com/spreadsheets/d/1JebRfwpLtFrlJBeuXrlGCvpzy5l8G_k5iha_WghgGsU/edit#gid=845971887
  * https://docs.google.com/presentation/d/1PEDof6WXYTD4ejQWoBBlglemhnPD9OAx_4yTjyRLcBw/edit#slide=id.g1ff0478143_0_7

TODO (features)

* W2
  * 每個冒險者可以準備團隊鑑定，然後可以看到　『團隊鑑定準備』 結果
  * GM 可以看到大家的　『團隊鑑定準備』　的結果
  * GM 可以開始進行 『團隊鑑定』
  * GM 可以做 『團隊鑑定』 的紀錄
  * GM 只能用 text 來紀錄 fame, karma + gold　（隔週才能分配＋看到結果）
  * GM 可以 end/finish adventure (『執行任務的過程』)
  * 冒險者可以看到所有參與過的 adventure
  * 冒險者可以看到 『團隊鑑定』 的結果
  * Mission List: 把所有的 mission svg 檔案放上來
// TODO: [AdventureView] render + allow editing of guardianNotes + gmNotes + partyNotes

* W3
  * GM 可以分配 fame, karma + gold
  * 冒險者可以看到各種數值（自己 + 排行板）
  * 冒險者 + GM 可以看到以前完畢的任務與相關紀錄
  * 每個冒險者可以看到其他人 ｢團隊鑑定的準備｣ status

* W4-6
  * GM 可以 archive (歸檔)　adventure (『執行任務的過程』)
  * 冒險者可以看到　｢live 團隊鑑定｣　的紀錄
  * 冒險者可以參與團隊鑑定紀錄 (給 feedback，自評，互評等等)
  * 各種紀錄的 summary
  * 冒險者可以預約 GM 團隊鑑定
  * GM 可以分配 卡片
  * GM 可以進行自己的鑑定 prep SOP (gmSubmitMeetingPrep)
  * LFG 功能 (mission wishlist) + p2p team creation


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