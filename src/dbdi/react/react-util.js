import React, { Component, Children } from 'react';
import isFunction from 'lodash/isFunction';


export function injectIntoClass(Clazz, methodName, methodWrapper) {
  Object.defineProperty(Clazz.prototype, methodName,
    {
      value: methodWrapper(Clazz.prototype[methodName])
    }
  );
}

/**
 * Note: This might behave differently for stateful and stateless components.
 * For stateless functions, pay attention to account for props and context 
 * in the `argsOrFunc` definition.
 * 
 * @see https://codepen.io/Domiii/pen/XejwKy?editors=0010
 * 
 * @param {*} Comp 
 * @param {*} argsOrFunc 
 * @returns {Function} The modified component
 */
export function injectRenderArgs(Comp, argsOrFunc) {
  const isComponent = Comp && Comp.prototype instanceof Component;

  // there is no good working heuristic to figure out if it's a function representing a component :(
  const isComponentFunction = isFunction(Comp);

  if (!isComponentFunction && !isComponent) {
    throw new Error('Tried to decorate object that is neither pure function nor component: ' + Comp);
  }

  function renderWrapper(origRender) {
    return function __wrappedRender(...origArgs) {
      const props = this && this.props || origArgs[0];
      const context = this && this.context || origArgs[1];
      const newArgs = isFunction(argsOrFunc) ? argsOrFunc(props, context) : argsOrFunc;
      //console.log('wrapped render: ' + props.name + `(${JSON.stringify(origArgs)}) → (${JSON.stringify(newArgs)})`);
      try {
        return origRender.call(this, ...newArgs);
      }
      catch (err) {
        console.error('[Component render ERROR]', err.stack);
        return (<pre style={{color: 'red'}}>[Component render ERROR] {err.stack}</pre>);
      }
    };
  }

  let ResultComp;
  if (isComponent) {
    // override render method
    injectIntoClass(Comp, 'render', renderWrapper);
    ResultComp = Comp;
  }
  else {
    // just wrap the function as-is
    ResultComp = renderWrapper(Comp);
  }

  return ResultComp;
}
