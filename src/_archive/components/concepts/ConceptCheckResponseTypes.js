const ConceptCheckResponseTypes = {
  default: {
    // list of category groups of responses
    list: [
      {
        category: 'statusUpdate',
        responses: [
          {
            name: 'done',
            progress: 1,
            title_en: 'Played around with it and verified it! Got it!',
            title_zh: '我玩過且確認過！沒問題的～',
            icon: 'check',
            className: 'color-green',
            bsStyle: 'success'
          }
        ]
      },
      {
        category: 'feedback',
        responses: [
          {
            name: 'good',
            title_en: 'This helped me discover something new!',
            title_zh: '這項幫我發現新東西了！',
            icon: 'smile-o',
            bsStyle: 'primary',
          },
          {
            name: 'confusing',
            title_en: 'This is more confusing than helpful',
            title_zh: '這項讓我覺得糊塗，沒有幫助我',
            icon: 'frown-o',
            bsStyle: 'primary'
          }
        ]
      },
      {
        category: 'request',
        responses: [
          {
            name: 'helpMe',
            title_en: 'I would like some help with this.',
            title_zh: '我需要一點幫忙～',
            icon: 'ambulance',
            className: 'color-red',
            bsStyle: 'warning'
          },
          {
            name: 'reportProblem',
            title_en: 'I think, there is something wrong with this.',
            title_zh: '我覺得這項有問題',
            icon: 'exclamation-circle',
            className: 'color-yellow',
            bsStyle: 'warning'
          },
          {
            name: 'comment',
            title_en: 'I would like to give some other feedback or comment on this.',
            title_zh: '我有其他類型的意見想分享',
            icon: 'commenting-o',
            bsStyle: 'warning'
          }
        ]
      }
    ]
  }
};

_.forEach(ConceptCheckResponseTypes, (set, setName) => {
  // set category property on all response objects
  set.list.forEach(({category, responses}) => responses.forEach(response => response.category = category));

  // single array of all responses
  set.flatList = _.flatMap(set.list, cat => cat.responses);

  // index by name
  set.byName = _.zipObject(_.map(set.flatList, 'name'), set.flatList);

  // index by category
  set.byCategory = _.groupBy(set.flatList, 'category');
});

  // yesNo: {
  //   yes: {
  //     title_en: 'yes',
  //     progress: 100
  //   },
  //   no: {
  //     title_en: 'no',
  //     progress: 0
  //   }
  // },

  // checkCross: {
  //   check: {
  //     title_en: 'good',
  //     progress: 100,
  //     icon: 'check',
  //     className: 'color-green'
  //   },
  //   cross: {
  //     title_en: 'bad',
  //     progress: 0,
  //     icon: 'remove',
  //     className: 'color-red'
  //   }
  // },

export default ConceptCheckResponseTypes;