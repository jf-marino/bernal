const test = require('ava');
const { declare, start, clear, container } = require('./index');
const { spy } = require('sinon');

// Clear the container before each test runs.
test.beforeEach(clear);

// Declarations tests
test('declaring a module should return undefined', t => {
  const res = declare('foo', [], () => 'bar');
  t.true(res === undefined);
});

test('declaring a module should fail when not providing a name, dependencies array and module closure', t => {
  const wrap = () => declare();
  t.throws(wrap);
});

test('declared modules should execute on start', async t => {
  let executedOne = false, executedTwo = false;
  declare('mod1', [], () => executedOne = true);
  declare('mod2', [], () => executedTwo = true);
  
  t.false(executedOne);
  t.false(executedTwo);

  await start();

  t.true(executedOne);
  t.true(executedTwo);
});

test('should execute modules in dependency order', async t => {
  let spyOne = spy();
  let spyTwo = spy();
  declare('mod1', [], spyOne);
  declare('mod2', ['mod1'], spyTwo);
  await start();

  t.true(spyOne.calledBefore(spyTwo));
});

test('should throw an error if there is a cyclic dependency', async t => {
  declare('mod1', ['mod3'], () => 'mod1');
  declare('mod2', ['mod1'], () => 'mod2');
  declare('mod3', ['mod2'], () => 'mod3');

  await t.throwsAsync(start);
});

test('should allow modules to be asynchronous', async t => {
  const spyMethod = spy();
  declare('mod2', ['mod1'], spyMethod);
  declare('mod1', [], () => {
    return new Promise(resolve => {
      setTimeout(() => resolve('Hello, World Module!'), 500);
    });
  });

  await start();

  t.true(spyMethod.calledWithExactly('Hello, World Module!'));
});

test('should allow new, independent, container instances', async t => {
  const mod1 = spy();
  const mod2 = spy();
  const mod3 = spy();
  
  // First declare a module in the global container
  declare('mod1', [], mod1);

  // Create an isolated container
  const [localDeclare, localStart] = container();
  localDeclare('mod2', [], mod2);
  localDeclare('mod3', ['mod2'], mod3);

  await localStart();

  // Check that the global container was not started
  t.true(mod1.notCalled);
  // And that the local one was...
  t.true(mod2.calledOnce);
  t.true(mod3.calledOnce);
});
