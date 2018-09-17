import { BeforeAll, AfterAll, BeforeEach } from '@travetto/test';
import { DependencyRegistry, InjectableFactory } from '@travetto/di';
import { ModelSource } from '@travetto/model';
import { SchemaRegistry } from '@travetto/schema';

import { ModelMongoSource, ModelMongoConfig } from '../';

export class Init {
  @InjectableFactory()
  static getModelSource(conf: ModelMongoConfig): ModelSource {
    return new ModelMongoSource(conf);
  }
}

export class BaseMongoTest {

  @BeforeAll()
  async before() {
    await DependencyRegistry.init();
    await SchemaRegistry.init();
  }

  @BeforeEach()
  async beforeEach() {
    const mms = (await DependencyRegistry.getInstance(ModelSource)) as ModelMongoSource;
    return await mms.resetDatabase();
  }
}