
/**
 * Each DataDescriptorNode provides a methods to: 1) get a path, 2) read data or 3) write data
 */
export default class DataDescriptorNode {
  _cfg;
  _knownDependencies;

  constructor(cfg) {
    this._cfg = cfg;
  }

  get name() {
    console.assert(this._cfg.name);
    return this._cfg.name;
  }

  get nodeType() {
    // TODO!
  }

  forEachNodeDFS(fn) {
    // TODO
  }

  /**
   * DescriptorNode boundCall functions have four (five) sets of arguments:
   * 
   * @param {object} namedCalls Set of all path/read calls provided to the callee. Callee decides when to make the call and with what arguments.
   * @param {object} namedCallProxy Set of all path/read calls executed right away, directly injecting the path/data to callee with no user arguments provided.
   * @param {object} args Set of user-supplied arguments.
   * @param {object} callerNode The callerNode supplies access to the DataContext, and all kinds of advanced stuff. Use with caution.
   * @param {object} writers set of required writer nodes. For writer nodes only! (Only writers can require more writers)
   * 
   * They are called from the DataContextNodeBindings which supplies the data the node requests.
   * 
   * When nodes are called upon the first time, all data read sights are
   * automatically added as dependencies and their loading initialized.
   * 
   * When a call is made:
   * 1) All injected data is automatically added to data dependencies immediately.
   * 2) descriptor arguments are NOT added immediately, only after they are called.
   * 
   * @return {object or array} Returns one or more sets of data or paths
   */
  boundCall(readersByName, readByNameProxy, args, callerNode) {
    throw new Error('DescriptorNode did not implement boundCall: ' + this.constructor.name);
  }

  toString() {
    return `[${this.constructor.name}] ${this.name}`;
  }

  getDependencies() {
    return this._knownDependencies;
  }

  /**
   * Protected method, called by descriptor nodes to indicate previously known dependencies.
   * 
   * @param {*} dependencies 
   */
  _setDependencies(dependencies) {
    this._knownDependencies = dependencies;
  }

  _wrapAccessFunction(fn) {
    return function _wrappedAccessFunction(readersByName, readByNameProxy, args, callerNode) {
      try {
        return fn(readersByName, readByNameProxy, args, callerNode);
      }
      catch (err) {
        console.error(`Failed to execute "${this.nodeType}" function at "${this.name}":`, err.stack);
        return undefined;
      }
    };
  }
}

