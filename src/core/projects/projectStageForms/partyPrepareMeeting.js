const partyPrepareMeeting = {
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
      id: 'individualBasics',
      title: '個人狀態',
      type: 'object',
      properties: [
        // TODO: this question item is not sufficiently distinct (see metOwnExpectations)
        // 'overallSatisfaction': {
        //   type: 'number',
        //   title: '目前為止，你在做這個任務的心情狀態是？（1 = 很糟不開心，4 = ）',
        //   minimum: 1,
        //   maximum: 4,
        //   multipleOf: 1
        // },
        {
          id: 'goalHoning',
          type: 'number',
          title: '這禮拜做任務：追求目標',
          description: '自己有目標了自主學習的時候才能有方向感～',
          enum: [1, 2, 3],
          enumNames: [
            '我有目標，而且我感覺到我這個禮拜有進展',
            '我有目標，但這個禮拜好像不大有進展',
            '我沒有目標可追求，不知道要追求什麼'
          ]
        },
        {
          id: 'feelingOfSuccess',
          type: 'number',
          title: '這禮拜做任務：有沒有成就感？有沒有滿足自己對任務的期望？',
          description: '這問題協助自己更了解：自己到底要什麼？滿足了自己的期望會不會產生成就感？自己要不要做下去這個任務？',
          enum: [1, 2, 3, 4],
          enumNames: [
            '沒什麼成就感，也不知道為甚麼',
            '沒什麼成就感，但好像知道為甚麼',
            '有成就感，是因為到達自己的目標',
            '有成就感，但不是因為到達自己的目標'
          ]
        },
        {
          id: 'focusHoning',
          type: 'number',
          title: '這禮拜做任務：分心狀態',
          enum: [1, 2],
          enumNames: [
            '這禮拜，每幾分鐘讓就分心一次',
            '這禮拜，幾乎每次都專注超過 20 分鐘，都不會分心想休息'
          ]
        },
        {
          id: 'breakFrequency',
          type: 'number',
          title: '這禮拜做任務：做事 vs. 休息（最接近於哪一個狀態？）',
          enum: [1, 2, 3, 4, 5],
          enumNames: [
            '通通耍廢，耍廢就是棒棒',
            '休息 80% 做事 20%',
            '休息 50% 做事 50%',
            '休息 20% 做事 80%',
            '沒有浪費超過一分鐘的時間'
          ]
        },
        {
          id: 'breakMode',
          type: 'number',
          title: '這禮拜做任務：休息時，是有效率的在休息嗎？',
          // https://i.imgur.com/dLO6Iqe.png
          // https://i.imgur.com/xiQCNe7.png
          // https://i.imgur.com/ECOxjfH.png
          description: '休息的時間是 mind full （心裡亂）還是 mindful（心裡自在）？休息會焦慮嗎？休息的時候，GM靠近關心你的時候會緊張想要切換螢幕嗎？\n\n' +
          '<center><img src="https://i.imgur.com/hH2PQup.png" /></center>',
          enum: [1, 2],
          enumNames: [
            'mind FULL 居多。。。 	嘆。。。',
            'mindful 居多～'
          ]
        },

        {
          id: 'complaints',
          type: 'string',
          isOptional: true,
          title: '你這禮拜有什麼想抱怨的也要討論嗎？',
          description: ''
        },

        {
          id: 'meetingTimeWish',
          type: 'number',
          title: '你要在何時進行團隊鑑定呢？',
          description: '',
          enum: [1, 2],
          enumNames: ['週三', '週五']
        },
      ]
    },

    {
      id: 'groupWork',
      title: '團隊狀態',
      type: 'object',
      if({ thisProjectId }, { projectPartySize }) {
        const projectId = thisProjectId;
        return projectPartySize({ projectId }) > 1;
      },
      properties: [
        {
          id: 'givePropsToTeam',
          type: 'string',
          title: '有任務夥伴的你，可以講講你的夥伴在這個任務中，有沒有做出哪一些讓你影響深刻的事情嗎？ *'
        },

        {
          id: 'ownContribution',
          type: 'string',
          title: '你覺得你在團隊任務中的貢獻是什麼？',
          description: '負責炒熱氣氛嗎？還是主導討論？還是提出idea？還是工具人苦幹實幹？還是做簡報？還是拍影片？還是後製？還是畫圖？還是寫企劃書？'
        }
      ]
    },

    {
      id: 'advanced',
      title: '進階',
      type: 'object',

      properties: [
        {
          id: 'pickMissionComfortZoneStrategy',
          type: 'number',
          isOptional: true,
          title: '心理學家最新研究發現：有效的學習方式跟是否願意跨出舒適圈很有關係，' +
          '你覺得這次選擇的任務的時候，是做自己擅長的，還是會挑戰自己，選擇自己不擅長的呢？',
          description: '<center><img src="https://i.imgur.com/txYBUta.png" /></center>',
          enum: [1, 2, 3, 4],
          enumNames: [
            '好像跟本沒有一個會覺得很舒服的舒適圈吧？',
            '選擇的任務就是在舒適圈內，本來就很有自信可以達成',
            '我刻意挑戰自己，選擇一個不知道能不能做到的任務了',
            '我目前還不太了解自己的舒適圈'
          ]
        },
        {
          id: 'fearOfLeavingComfortZone',
          type: 'number',
          isOptional: true,
          title: '這個像不像你？',
          description: '<center><img src="https://i.imgur.com/2bujW98.png" /></center>',
          enum: [1, 2, 3, 4],
          enumNames: [
            '很像，超級像',
            '我根本都還不清楚自己的舒適圈是什麼',
            '我根本就不想離開我的舒適圈',
            '我好像比這個人勇敢一點'
          ]
        },
        {
          id: 'whatHaveILearned',
          type: 'string',
          isOptional: true,
          title: '這一兩週做任務的過程中，你能不能具體的講出學習到什麼？'
        }
      ]
    }
  ]
};


export default partyPrepareMeeting;