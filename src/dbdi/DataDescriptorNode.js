
/**
 * Each DataDescriptorNode provides a methods to: 1) get a path, 2) read data or 3) write data
 */
export default class DataDescriptorNode {
  _cfg;
  _name;
  //_knownDependencies;

  constructor(cfg, name) {
    this._cfg = cfg;
    this._name = name;
  }

  get name() {
    return this._name;
  }

  get config() {
    return this._cfg;
  }

  get nodeType() {
    throw new Error('[INTERNAL ERROR] nodeType has not been defined in DataDescriptorNode class');
  }

  forEachNodeDFS(fn) {
    // TODO
  }

  /**
   * DescriptorNode execute functions have four (five) sets of arguments:
   * 
   * @param {object} args Set of user-supplied arguments.
   * @param {object} namedCallProxy Set of all path/read calls executed right away, directly injecting the path/data to callee with no user arguments provided.
   * @param {object} namedCalls Set of all path/read calls provided to the callee. Callee decides when to make the call and with what arguments.
   * @param {object} callerNode The callerNode supplies access to the DataSource, and all kinds of advanced stuff. Use with caution.
   * @param {object} writers set of required writer nodes. For writer nodes only! (Only writers can require more writers)
   * 
   * They are called from the DataSourceNodeBindings which supplies the data the node requests.
   * 
   * When nodes are called upon the first time, all data read sights are
   * automatically added as dependencies and their loading initialized.
   * 
   * When a call is made:
   * 1) All injected data is automatically added to data dependencies immediately.
   * 2) descriptor arguments are NOT added immediately, only after they are called.
   * 
   * @returns {(string|Array.)} Returns one or more sets of data or paths
   */
  execute(args, dataInjectProxy, readerProxy, callerNode, accessTracker) {
    throw new Error('DescriptorNode did not implement execute: ' + this.constructor.name);
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
    return function _wrappedAccessFunction(...allArgs) {
      try {
        return fn(...allArgs);
      }
      catch (err) {
        throw new Error(`Failed to execute "${this.nodeType}" at node "${this.name}":\n` + err.stack);
      }
    };
  }
}

