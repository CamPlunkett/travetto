import { Application, InjectableFactory } from '@travetto/di';
import { RestApp, RestAppProvider } from '@travetto/rest';
import { ExpressAppProvider } from '@travetto/rest-express';

@Application('sample')
export class SampleApp {

  @InjectableFactory()
  static getProvider(): RestAppProvider {
    return new ExpressAppProvider();
  }

  constructor(private app: RestApp) { }

  run() {
    this.app.run();
  }
}