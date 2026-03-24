import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 64;
const PBKDF2_ITERATIONS = 100000;

export interface Config {
  apiKey?: string;
  templateDir?: string;
  watchInterval?: number;
}

interface SecureConfig {
  encryptedApiKey?: string;
  iv?: string;
  tag?: string;
  salt?: string;
}

const CONFIG_DIR = path.join(os.homedir(), ".stitch-mcp-cli");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");
const KEY_FILE = path.join(CONFIG_DIR, ".key");

function getOrCreateKey(): Buffer {
  if (fs.existsSync(KEY_FILE)) {
    return fs.readFileSync(KEY_FILE);
  }
  const key = crypto.randomBytes(KEY_LENGTH);
  fs.writeFileSync(KEY_FILE, key, { mode: 0o600 });
  return key;
}

function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, "sha256");
}

function encrypt(text: string): { encrypted: string; iv: string; tag: string; salt: string } {
  const key = getOrCreateKey();
  const salt = crypto.randomBytes(SALT_LENGTH);
  const derivedKey = deriveKey(key.toString("base64"), salt);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
    salt: salt.toString("hex"),
  };
}

function decrypt(encrypted: string, iv: string, tag: string, salt: string): string {
  const key = getOrCreateKey();
  const derivedKey = deriveKey(key.toString("base64"), Buffer.from(salt, "hex"));

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    derivedKey,
    Buffer.from(iv, "hex")
  );
  decipher.setAuthTag(Buffer.from(tag, "hex"));

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

export function loadConfig(): Config {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
    }
  } catch {
    // Ignore errors, return empty config
  }
  return {};
}

export function loadSecureConfig(): { apiKey?: string } {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const config: SecureConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
      if (config.encryptedApiKey && config.iv && config.tag && config.salt) {
        return {
          apiKey: decrypt(config.encryptedApiKey, config.iv, config.tag, config.salt),
        };
      }
    }
  } catch {
    // Ignore errors
  }
  return {};
}

export function saveConfig(config: Config): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function saveSecureConfig(apiKey: string): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  const { encrypted, iv, tag, salt } = encrypt(apiKey);
  const config: SecureConfig = { encryptedApiKey: encrypted, iv, tag, salt };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function getConfigPath(): string {
  return CONFIG_FILE;
}

export function getConfigDir(): string {
  return CONFIG_DIR;
}
