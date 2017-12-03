

const PromiseResponseStatus = {
  
};

// TODO: Collaborative promises?

export default {
  allPromises: {
    path: 'promises',
    children: {
      promise: {
        path: 'promise',
        children: {
          ownerUid: 'ownerUid',
          creatorUid: 'creatorUid',
          targetUid: 'targetUid',
          updatedAt: 'updatedAt',
          createdAt: 'createdAt'
        }
      }
    }
  }
};

const learnerResponses = {
  path: 'learnerResponses',
  children: {
    learnerResponse: {
      path: 'learnerResponse',
      children: {
        
      }
    }
  }
};