'use strict';
const { calculate } = require('./graph');

// Validate the structure of a module
const validate = ({ name, dependencies, mod } = {}) => {
  return  typeof name === 'string' &&
          dependencies instanceof Array &&
          typeof mod === 'function';
};

// Declare a new module
const declare = (container, name, dependencies, mod) => {
  if (!validate({ name, dependencies, mod })) throw new Error('Invalid module definition');

  container[name] = {
    name,
    dependencies,
    code: mod,
    instance: null
  };
};

// Start all modules.
// If <mods> is provided then only start those modules
const start = async (container, ...mods) => {
  let startOrder = calculate(container, mods);

  for (let name of startOrder) {
    const { dependencies, code } = container[name];
    const required = dependencies.map(d => container[d].instance);
    
    let result = code(...required);
    if (result instanceof Promise) {
      result = await result;
    }
    
    container[name].instance = result;
  }
};

const createContainer = () => {
  const container = {};

  const _start = async () => start(container);
  const _declare = (...args) => declare(container, ...args);
  const _clear = () => {
    for (let k in container) {
      delete container[k];
    }
  }

  return [_declare, _start, _clear];
};

const [_declare, _start, _clear] = createContainer();
exports.container = createContainer;
exports.declare = _declare;
exports.start = _start;
exports.clear = _clear;
