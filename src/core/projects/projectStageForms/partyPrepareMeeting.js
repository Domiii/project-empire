const partyPrepareMeeting = {
  title: '',
  description: '',
  type: 'object',
  required: [
    'satisfaction',
    '',

  ],
  properties: {
    // TODO: not sufficiently distinct (see metOwnExpectations)
    // 'overallSatisfaction': {
    //   type: 'number',
    //   title: '目前為止，你在做這個任務的心情狀態是？（1 = 很糟不開心，4 = ）',
    //   minimum: 1,
    //   maximum: 4,
    //   multipleOf: 1
    // },
    'goalHoning': {
      type: 'number',
      title: '這禮拜做任務：追求目標',
      enum: [1, 2, 3],
      enumNames: [
        '我有目標，而且我感覺到我這個禮拜有進展',
        '我有目標，但這個禮拜好像不大有進展',
        '我沒有目標可追求，不知道要追求什麼'
      ]
    },
    'metOwnExpectations': {
      type: 'number',
      title: '這裡擺做任務：有沒有滿足自己對任務的期望？',
      description: '你為甚麼會選這個任務？ [可以協助自己了解這個任務的初衷。可以幫助自己判斷自己要不要做下去這個任務。]',
      // TODO
    },
    'focusHoning': {
      type: 'number',
      title: '這禮拜做任務：分心狀態',
      enum: [1, 2],
      enumNames: [
        '在做任務的時候，每幾分鐘讓就分心一次',
        '在做任務的時候，可以專注超過 20 分鐘，都不會分心想休息'
      ]
    },
    'breakFrequency': {
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
    'breakMode': {
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

    // TODO: only show these if team.length > 1
    'givePropsToTeam': {
      type: 'string',
      title: '有任務夥伴的你，可以講講你的夥伴在這個任務中，有沒有做出哪一些讓你影響深刻的事情嗎？ *'
    },

    '': {
      type: 'string',
      title: '你覺得你在團隊任務中的貢獻是什麼？'
    },

    'updatedAt': {
    },
    'createdAt': {
    }
  }
};


export default {
  partyPrepareMeeting
};