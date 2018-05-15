import isString from 'lodash/isString';

export const sharedArgumentProxyProperties = {
  // need to hack this, because Proxies are transparently virtualized
  // https://stackoverflow.com/questions/36372611/how-to-test-if-an-object-is-a-proxy
  ____isWrapperProxy() { return true; },


  ____proxyGetUnderlyingTarget(target) { 
    console.assert(!target || !target.____isWrapperProxy);
    console.warn('____proxyGetUnderlyingTarget', target);
    return target;
  },

  toJSON(target) {
    if (isString(target)) {
      return JSON.parse(target);
    }
    return target;
  }
};