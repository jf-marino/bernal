const { partition } = require('./utils');

const getStartingPartitions = (container = {}) =>
  partition(Object.keys(container), name => !container[name].dependencies.length);

/**
Creates a map like so
{
  moduleOne: [],
  moduleTwo: ['moduleOne'],
  moduleThree: ['moduleOne', 'moduleTwo']
}
The false represents the module not being resolved yet
*/
const createDependencyMap = (container) => {
  const m = {};
  
  for (let name in container) {
    m[name] = container[name].dependencies;
  }

  return m;
}

const canBeResolved = (resolved, map, name) => map[name].every(n => resolved.includes(n));

const calculatePartitions = (map, resolved = [], unresolved = []) => {
  const [canNowBeResolved, areStillUnsolvable] = partition(unresolved, name => canBeResolved(resolved, map, name));
  const newResolved = [...resolved, ...canNowBeResolved];
  return [newResolved, areStillUnsolvable];
};

const findInstantiationOrder = (container) => {
  const dependencyMap = createDependencyMap(container);
  const [initialResolved, initialUnresolved] = getStartingPartitions(container);

  let [resolved, unresolved] = calculatePartitions(dependencyMap, initialResolved, initialUnresolved);
  let done = !unresolved.length;
  let lastResolvedLength = resolved.length;
  
  while (!done) {
    let [newResolved, newUnresolved] = calculatePartitions(dependencyMap, resolved, unresolved);
    resolved = newResolved;
    unresolved = newUnresolved;

    // Check that the newResolved length is greater than the last length, otherwise the resolution order has
    // gone into a stalemate.
    const lengthChange = newResolved.length > lastResolvedLength;

    lastResolvedLength = newResolved.length;
    done = !lengthChange || !unresolved.length;
  }

  if (unresolved.length) {
    throw new Error(`Dependency order can't be calculated`);
  }

  return resolved;
};

exports.calculate = findInstantiationOrder;
