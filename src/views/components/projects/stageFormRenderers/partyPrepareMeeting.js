import schemaTemplate from 'src/core/projects/projectStageForms/partyPrepareMeeting';

import React from 'react';

const uiSchema = {
  individualBasics: {
    complaints: {
      'ui:widget': 'textarea',
      'ui:options': {
        rows: 3,
      }
    }
  },
  advanced: {
    whatHaveILearned: {
      'ui:widget': 'textarea',
      'ui:options': {
        rows: 3,
      }
    }
  }
};

const fields = {
};

export default {
  settings: {
    schemaTemplate,
    //schema,
    uiSchema,
    fields
  },

  // render: function partyPrepareMeeting() {

  // }
};