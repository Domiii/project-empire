const partyPrepareMeeting = {
  'title': '',
  'description': '',
  'type': 'object',
  'required': [
    'title'
  ],
  'properties': {
    'title': {
      'type': 'string',
      'title': 'Title'
    },
    'good': {
      'type': 'boolean',
      'title': 'Good'
    },
    'other': {
      'type': 'string',
      'title': 'Other'
    },
    'updatedAt': {
      'title': 'Last Updated',
      'type': 'number'
    }
  }
};


export default {
  partyPrepareMeeting
};