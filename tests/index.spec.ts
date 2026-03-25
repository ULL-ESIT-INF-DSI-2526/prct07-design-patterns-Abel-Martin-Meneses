import { describe, test, expect } from "vitest";
import { add } from "../src/index";

describe("tests add", () => {
  test("add(1, 1) returns 2", () => { 
    expect(add(1, 1)).toEqual(2);
  })
})