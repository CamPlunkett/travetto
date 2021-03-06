export interface Node<T = any> {
  value: T;
}

export class TextNode implements Node<string> {
  constructor(public value: string) {
    const ch = value.charCodeAt(0);
    if (ch === 0x22 /* dbl quote*/ || ch === 0x27 /* sngl quote */) {
      this.value = this.value.substring(1, this.value.length - 1).replace(new RegExp(`\\\\${value[0]}`, 'g'), value[0]);
    }
  }
}

export class NumberNode implements Node<number> {
  value: number;

  constructor(token: string) {
    this.value = token.includes('.') ? Number.parseFloat(token) : Number.parseInt(token, 10);
  }
}

export class BooleanNode implements Node<boolean> {
  value: boolean;

  constructor(token: string) {
    this.value = /yes|on|true/i.test(token);
  }
}

export class NullNode implements Node<null> {
  value: null = null;
}

export class JSONNode implements Node<any> {
  value: any;

  constructor(token: string) {
    this.value = JSON.parse(token);
  }
}