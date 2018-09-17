import { DescribableConfig } from '../types';
import { SchemaRegistry } from '../registry';

export function Describe(config: Partial<DescribableConfig>) {
  return (target: any, property?: string, descriptor?: PropertyDescriptor) => {
    if (property) {
      SchemaRegistry.registerPendingFieldFacet(target.constructor, property!, config);
      return descriptor;
    } else {
      SchemaRegistry.register(target, config);
    }
  };
}