// This is a very naive representation of a CSS AST, limited only to what we need to produce

export class Rule {
  constructor(readonly name: string, readonly value: string) {}

  toString() {
    return `${this.name}: ${this.value};`;
  }
}

export class Comment {
  constructor(readonly value: string) {}

  toString() {
    return `/* ${this.value} */`;
  }
}

export class Block {
  constructor(readonly name: string, readonly expressions: Expression[]) {}

  toString(): string {
    return `${this.name} {
  ${this.expressions.flatMap((exp) => exp.toString().split("\n")).join("\n  ")}
}`;
  }
}

export type Expression = Rule | Comment | Block;
