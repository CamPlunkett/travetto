import { Node } from './node';

export interface Block<T = any> extends Node<T> {
  indent: number;
  consume?(node: Node<any>, ...extra: any[]): void;
}

export class TextBlock implements Block<string> {
  static test(token: string) {
    return token.charAt(0) === '|' || token.charAt(0) === '>';
  }

  subtype: 'inline' | 'full';
  value = '';
  indent: number;

  constructor(token: string) {
    this.subtype = token === '>' ? 'inline' : 'full';
  }

  readLine(tokens: string[]) {
    if (tokens.length === 0) { // New line
      if (this.subtype === 'inline') {
        if (this.value.endsWith(' ')) {
          this.value = this.value.replace(/ $/, '\n');
        } else {
          this.value += (this.value.endsWith('\n') ? '\n' : ' ');
        }
      } else {
        this.value += '\n';
      }
    } else {
      this.value += tokens.join('').trimRight() + (this.subtype === 'full' ? '\n' : ' ');
    }
  }
}

export class ListBlock implements Block<Node[]> {
  value: Node[] = [];

  constructor(public indent: number) { }

  consume(node: Node<any>) {
    this.value.push(node.value);
  }
}

export class MapBlock implements Block<{ [key: string]: Node }> {
  value: { [key: string]: Node } = {};

  constructor(public indent: number) { }

  consume(node: Node<any>, key: string) {
    this.value[key] = node.value;
  }
}
