// This is a very naive representation of a CSS AST, limited only to what we need to produce


export class Block {
  constructor(readonly expressions: Expression[]) {}

  toString() {
    return `{
  ${this.expressions.flatMap((exp) => exp.toString().split("\n")).join("\n  ")}
}`;
  }
}

/** Valid as the value of a Rule. */
export type Value = string | Block;

export class Rule {
  constructor(readonly name: string, readonly value: Value) {}

  toString() {
    return `${this.name}: ${this.value}${
      typeof this.value === "string" ? ";" : ""
    }`;
  }
}

export class Query {
  constructor(readonly expression: string, readonly rules: Block) {}

  toString() {
    return `${this.expression} ${this.rules}`;
  }
}

export class Comment {
  constructor(readonly value: string) {}

  toString() {
    return `/* ${this.value} */`;
  }
}

export type Expression = Rule | Query | Comment;
