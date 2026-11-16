import { describe, expect, it } from "vitest";
import { parseWhatsApp } from "../../src/lib/orders";

describe("parseWhatsApp", () => {
  it.each([
    ["082 123 4567", "+27821234567"],
    ["0721234567", "+27721234567"],
    ["(021) 123-4567", "+27211234567"],
    ["+27 82 123 4567", "+27821234567"],
    ["27821234567", "+27821234567"],
    ["+44 7700 900123", "+447700900123"],
    ["  +1 415.555.0100 ", "+14155550100"],
  ])("accepts %s as %s", (input, e164) => {
    expect(parseWhatsApp(input)).toEqual({ ok: true, e164 });
  });

  it.each([
    "082 123 456",
    "082 123 45678",
    "8212345678",
    "+0821234567",
    "+27 0 82 123 4567",
    "082-CALL-ME",
    "0821234567 ext 2",
    "++27821234567",
    "+1234567",
    "+1234567890123456",
  ])("rejects %s", (input) => {
    expect(parseWhatsApp(input).ok).toBe(false);
  });
});
