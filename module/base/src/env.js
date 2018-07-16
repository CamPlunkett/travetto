const path = require('path');

const PROD_KEY = 'prod';
const TEST_KEY = 'test';
const DEV_KEY = 'dev';

const envVal = k => process.env[k] || process.env[k.toLowerCase()] || process.env[k.toUpperCase()];
const envListVal = k => (envVal(k) || '').split(/[, ]+/g).filter(x => !!x);
const isEnvTrue = k => {
  const val = envVal(k);
  return !!val && !/(0|false|off)/i.test(val);
};

const cwd = (envVal('init_cwd') || process.cwd()).replace(/[\\]+/g, path.sep).replace(/[\/\\]+$/, '');

function checkFrameworkDev() {
  let frameworkDev = false;

  try {
    frameworkDev = require(`${cwd}/package.json`).name.startsWith('@travetto');
  } catch (e) {}

  return { frameworkDev };
}

function checkDocker() {
  let docker = !isEnvTrue('NO_DOCKER');
  if (docker) { // Check for docker existance
    try {
      const { execSync } = require('child_process');
      execSync('docker ps', { stdio: [undefined, undefined, undefined] });
    } catch (e) {
      docker = false;
    }
  }
  return { docker };
}

function checkWatch(dev) {
  const watch = (dev && !isEnvTrue('NO_WATCH')) || isEnvTrue('watch');
  return { watch };
}

function buildLogging(dev) {
  const debug = isEnvTrue('debug') || dev;
  const trace = isEnvTrue('trace');

  console.warn = (...args) => console.log('WARN', ...args);
  console.info = (...args) => console.log('INFO', ...args);
  console.debug = (...args) => console.log('DEBUG', ...args);
  console.trace = (...args) => console.log('TRACE', ...args);

  if (!trace) {
    console.trace = (...args) => {};
  }

  if (!debug) {
    console.debug = () => {}; // Suppress debug statements
  }

  function error(...args) {
    console.error(...args.map(x => x && x.stack ? x.stack : x));
  }

  return { debug, trace, error };
}

function buildProfile() {
  const cli = (process.argv.slice(2) || [])
    .filter(x => /^-P[A-Za-z0-9_\-]+/.test(x))
    .map(x => x.replace(/^-P/g, ''));

  const mapping = {
    production: PROD_KEY,
    testing: TEST_KEY,
    development: DEV_KEY
  };

  const ext = [...envListVal('node_env'), ...envListVal('env'), ...envListVal('profile'), ...cli]
    .map(x => mapping[x] || x);

  const primary =
    (ext.includes(PROD_KEY) && PROD_KEY) ||
    (ext.includes(TEST_KEY) && TEST_KEY) || DEV_KEY;

  const allSet = new Set();

  // Shift to front
  const all = ['application', primary, ...ext]
    .filter(x => {
      const isNew = !allSet.has(x);
      allSet.add(x);
      return isNew;
    });

  return {
    profiles: all,
    is: allSet.has.bind(allSet),
    prod: primary === PROD_KEY,
    test: primary === TEST_KEY,
    dev: primary === DEV_KEY
  };
}

const profile = buildProfile();

const Env = [
  { cwd },
  profile,
  buildLogging(profile.dev),
  checkWatch(profile.dev),
  checkFrameworkDev(),
  checkDocker()
].reduce((acc, el) =>
  Object.assign(acc, el));

module.exports = { Env };