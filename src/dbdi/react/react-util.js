// import React, { Component, Children } from 'react';
// import isFunction from 'lodash/isFunction';


// export function injectIntoClass(Comp, methodName, methodWrapper) {
//   class InjectedComp extends Comp {
//     constructor(...args) {
//       super(...args);
//     }
//   }
//   Object.defineProperty(InjectedComp, 'name', { value: Comp.name + '_' + methodName + '_injected' });

//   // Object.defineProperty(InjectedComp.prototype, methodName,
//   //   {
//   //     value: methodWrapper(Comp.prototype[methodName])
//   //   }
//   // );

//   //Object.assign(InjectedComp.prototype, Comp.prototype);
//   InjectedComp.prototype[methodName] = methodWrapper(Comp.prototype[methodName]);

//   return InjectedComp;
// }


// /**
//  * Note: This function behaves differently for stateful and stateless components.
//  * For stateless functions, pay attention to account for props and context 
//  * in the `argsOrFunc` definition.
//  * 
//  * @see https://codepen.io/Domiii/pen/XejwKy?editors=0010
//  * 
//  * @param {*} Comp 
//  * @param {*} argsOrFunc 
//  * @returns {Function} The modified component
//  */
// export function injectRenderArgs(Comp, argsOrFunc) {
//   const isComponent = Comp && Comp.prototype instanceof Component;

//   // there is no good working heuristic to figure out if it's a function representing a component :(
//   const isComponentFunction = isFunction(Comp);

//   if (!isComponentFunction && !isComponent) {
//     throw new Error('Tried to decorate object that is neither pure function nor component: ' + Comp);
//   }

//   function renderWrapper(origRender) {
//     return function __wrappedRender(...origArgs) {
//       const props = this && this.props || origArgs[0];
//       const context = this && this.context || origArgs[1];
//       const newArgs = isFunction(argsOrFunc) ? argsOrFunc(props, context) : argsOrFunc;
//       //console.log('wrapped render: ' + props.name + `(${JSON.stringify(origArgs)}) → (${JSON.stringify(newArgs)})`);
//       return origRender.call(this, ...newArgs, ...origArgs);
//     };
//   }

//   let ResultComp;
//   if (isComponent) {
//     // override render method
//     ResultComp = injectIntoClass(Comp, 'render', renderWrapper);
//   }
//   else {
//     // just wrap the function as-is
//     ResultComp = renderWrapper(Comp);
//   }

//   return ResultComp;
// }


import React, { Component, Children } from 'react';
import isFunction from 'lodash/isFunction';



/**
 * Note: This function behaves differently for stateful and stateless components.
 * For stateless functions, pay attention to account for props and context 
 * in the `argsOrFunc` definition.
 * 
 * @see https://codepen.io/Domiii/pen/XejwKy?editors=0010
 * 
 * @param {*} Comp 
 * @param {*} injectedArgs 
 * @returns {Function} The modified component
 */
export function injectRenderArgs(Comp, injectedArgs) {
  // there is no good working heuristic to figure out if it's a function representing a component :(
  const isComponent = Comp && Comp.prototype instanceof Component;
  const isComponentFunction = isFunction(Comp);

  if (!isComponentFunction && !isComponent) {
    throw new Error('Tried to decorate object that is neither pure function nor component: ' + Comp);
  }

  let ResultComp;
  if (isComponent) {
    // override render method
    //ResultComp = injectIntoClass(Comp, 'render', renderWrapper);
    wrapStatefulRender(Comp, injectedArgs);
    ResultComp = Comp;
  }
  else {
    // just wrap the function as-is
    ResultComp = wrapFunctionalComponent(Comp, injectedArgs);
  }

  return ResultComp;
}
