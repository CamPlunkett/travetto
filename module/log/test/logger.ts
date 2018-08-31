import * as assert from 'assert';

import { Suite, Test, BeforeAll } from '@travetto/test';

import { Logger } from '../src/service';
import { LogEvent } from '../src/types';

@Suite('Suite')
class LoggerTest {

  @BeforeAll()
  async init() {
    Logger.removeAll();
  }

  @Test('Should Log')
  async shouldLog() {
    const events: LogEvent[] = [];
    Logger.listen((e) => {
      events.push(e);
    });
    console.log('Hello', 1, 2, 3);
    assert(events.length === 1);
    assert(events[0].message === 'Hello');
    assert.deepStrictEqual(events[0].args, [1, 2, 3]);
  }
}
