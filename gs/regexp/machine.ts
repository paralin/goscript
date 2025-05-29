import * as $ from "../builtin";
import * as syntax from "./syntax";
import { lazyFlag } from "./lazyFlag.js";

export class queue {
  constructor(init?: any) {
  }

  Get(): any {
    return null;
  }
}

export class machine {
  q0: queue;
  q1: queue;
  
  constructor() {
    this.q0 = new queue({});
    this.q1 = new queue({});
  }
}

export class bitState {
  cap: number[];
  end: number;
  
  constructor() {
    this.cap = [];
    this.end = 0;
  }
  
  push(re: any, pc: number, pos: number, arg: boolean): void {
  }
}

export class onePassProg {
}

export const arrayNoInts: number[] = [];

export function freeOnePassMachine(m: any): void {
}
