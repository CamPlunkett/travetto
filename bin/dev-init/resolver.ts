export class DepResolver {

  static PEER_DEPS = `${process.argv[2]}`.trim() !== '';
  static DEP_CACHE: { [key: string]: { regular: Set<string>, peer: Set<string> } } = {};
  static CORE_SCOPE = new Set(['dependencies', 'devDependencies']);
  static PEER_SCOPE = new Set(['peerDependencies', 'optionalExtensionDependencies']);
  static GLOBAL_PEER = new Set();
  static SCOPE = new Set();

  static init() {
    this.SCOPE = this.PEER_DEPS ? new Set([...this.CORE_SCOPE, ...this.PEER_SCOPE]) : this.CORE_SCOPE;
  }

  static resolveModule(dep: string, base: string, scope: string) {
    // If module
    if (dep.includes('@travetto')) {
      // Recurse
      const sub = this.resolve(dep.split('/')[1], base);

      // Share regular, but not peer
      return { regular: new Set([...sub.regular, dep]) };
    } else if (this.PEER_SCOPE.has(scope)) { // If dealing with peer
      if (!this.GLOBAL_PEER.has(dep)) { // Load it once
        this.GLOBAL_PEER.add(dep);
        return { peer: new Set([dep]) };
      }
    }
  }

  static resolve(mod: string, base: string) {
    // Grab from cache
    if (this.DEP_CACHE[mod]) {
      return this.DEP_CACHE[mod];
    }

    const out = {
      peer: new Set(),
      regular: new Set()
    };

    // Open package.json
    const pkg = require(`${base}/${mod}/package.json`);

    // Loop through scopes
    for (const scope of this.SCOPE) {
      if (!pkg[scope]) {
        continue;
      }
      // Loop through dependencies
      for (const dep of Object.keys(pkg[scope])) {
        const res = this.resolveModule(dep, base, scope);
        if (res && res.regular) {
          out.regular = new Set([...out.regular, ...res.regular]);
        } else if (res && res.peer) {
          out.peer = new Set([...out.peer, ...res.peer]);
        }
      }
    }

    //Store
    return this.DEP_CACHE[mod] = out;
  }
}