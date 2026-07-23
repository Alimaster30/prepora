import "server-only";

import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const HASH_BYTES = 64;
const PASSWORD_FORMAT = "scrypt-v1";

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = (await scrypt(password, salt, HASH_BYTES)) as Buffer;
  return [
    PASSWORD_FORMAT,
    salt.toString("base64url"),
    derivedKey.toString("base64url"),
  ].join("$");
}

export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  const [format, encodedSalt, encodedHash] = storedHash.split("$");
  if (format !== PASSWORD_FORMAT || !encodedSalt || !encodedHash) return false;

  try {
    const salt = Buffer.from(encodedSalt, "base64url");
    const expected = Buffer.from(encodedHash, "base64url");
    if (expected.length !== HASH_BYTES) return false;

    const actual = (await scrypt(password, salt, expected.length)) as Buffer;
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
