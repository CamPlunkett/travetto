import { AllSuitesResult, TestResult } from '../../model';
import { Listener, ListenEvent } from './listener';
import { Collector, CollectionComplete } from './collector';

export class TapListener implements CollectionComplete {
  private count = 0;

  constructor(private stream: NodeJS.WriteStream = process.stdout) {
    this.log('TAP version 13');
  }

  private log(message: string) {
    this.stream.write(message + '\n')
  }

  onEvent(e: ListenEvent) {
    if (e.type === 'test' && e.phase === 'after') {
      let { test } = e;
      let message = `ok ${++this.count} ${test.suiteName} - ${test.method}`;
      if (test.description) {
        message += `: ${test.description}`;
      }
      if (test.status === 'skipped') {
        message += ' # SKIP';
      } else if (test.status === 'failed') {
        message = 'not ' + message;
      }
      this.log(message);
      if (test.status === 'failed') {
        this.log(`---
  message: ${test.error}
...`)
      }
      if (test.output) {
        for (let key of ['log', 'info', 'error', 'debug', 'warn']) {
          if (test.output[key]) {
            this.log(`---
  ${key}:
    ${test.output[key]}
...`)
          }
        }
      }
    }
  }

  onComplete(collector: Collector) {
    this.log(`1..${collector.allSuites.total}`);
  }
}