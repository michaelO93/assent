"use client";

import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { toHex, type Hex } from "viem";

// Everything personal stays on the parent's device: the signing key, the children's
// nicknames and birth years, and each child's secret used to derive per-app pseudonyms.
// In production the key would live in a passkey-backed smart account rather than localStorage.

const KEY = "assent:guardian-key";
const CHILDREN = "assent:children";

export type Child = { id: string; nickname: string; birthYear: number; secret: Hex };

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable (private mode); the session simply won't persist
  }
}

export function loadGuardianAccount() {
  const key = read<Hex | null>(KEY, null);
  return key ? privateKeyToAccount(key) : null;
}

export function createGuardianAccount() {
  const key = generatePrivateKey();
  write(KEY, key);
  return privateKeyToAccount(key);
}

export function resetGuardian() {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(CHILDREN);
  } catch {}
}

export function loadChildren(): Child[] {
  return read<Child[]>(CHILDREN, []);
}

export function addChild(nickname: string, birthYear: number): Child {
  const child: Child = {
    id: crypto.randomUUID(),
    nickname,
    birthYear,
    secret: toHex(crypto.getRandomValues(new Uint8Array(32))),
  };
  write(CHILDREN, [...loadChildren(), child]);
  return child;
}

export function removeChild(id: string) {
  write(CHILDREN, loadChildren().filter((c) => c.id !== id));
}
