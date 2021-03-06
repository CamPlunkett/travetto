import { State } from '../src/runner/runner';

export function prepareEnv(extra = {}) {
  Object.assign(process.env, {
    QUIET_INIT: '1',
    DEBUG: process.env.DEBUG || '0',
    PROD: '0',
    LOG_TIME: '0',
    APP_ROOTS: '0',
    WATCH: '0',
    PROFILE: 'test',
    RESOURCE_ROOTS: 'test',
    ...extra
  });
}

export async function runTests(opts: State) {
  const { StandardWorker } = await import('../src/worker/standard');
  return StandardWorker.run(opts);
}

export async function worker() {
  prepareEnv();
  const { PhaseManager } = await import('@travetto/base');
  await PhaseManager.init('bootstrap', 'compiler').run();

  const { TestChildWorker } = await import('../src/worker/child');
  return new TestChildWorker().activate();
}

export async function runTestsDirect() {
  prepareEnv({ DEBUGGER: true });

  const { PhaseManager } = await import('@travetto/base');
  await PhaseManager.run();

  return runTests(
    {
      args: process.argv.slice(2),
      format: process.env.TEST_FORMAT || 'tap',
      mode: (process.env.TEST_MODE as any) || 'single',
      concurrency: parseInt(process.env.TEST_CONCURRENCY || '1', 10)
    }
  );
}