import { describe, expect, it } from "vitest";

import { parseBooleanEnv } from "@/config/env";

describe("parseBooleanEnv", () => {
  it("returns default value when undefined", () => {
    expect(parseBooleanEnv(undefined, false)).toBe(false);
    expect(parseBooleanEnv(undefined, true)).toBe(true);
  });

  it("parses true-like values", () => {
    expect(parseBooleanEnv("true")).toBe(true);
    expect(parseBooleanEnv("TRUE")).toBe(true);
    expect(parseBooleanEnv("1")).toBe(true);
    expect(parseBooleanEnv(" yes ")).toBe(true);
    expect(parseBooleanEnv("on")).toBe(true);
  });

  it("parses false-like values", () => {
    expect(parseBooleanEnv("false", true)).toBe(false);
    expect(parseBooleanEnv("FALSE", true)).toBe(false);
    expect(parseBooleanEnv("0", true)).toBe(false);
    expect(parseBooleanEnv(" no ", true)).toBe(false);
    expect(parseBooleanEnv("off", true)).toBe(false);
  });

  it("falls back to default for unrecognized values", () => {
    expect(parseBooleanEnv("not-a-bool", false)).toBe(false);
    expect(parseBooleanEnv("not-a-bool", true)).toBe(true);
  });

  it("can be reused for feature flags that default to false", () => {
    expect(parseBooleanEnv("true", false)).toBe(true);
    expect(parseBooleanEnv(undefined, false)).toBe(false);
  });
});
