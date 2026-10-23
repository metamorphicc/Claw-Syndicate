import { DatabaseSync } from 'node:sqlite';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
export function backupDatabase(source: string, target: string) {
  if (!existsSync(source)) throw new Error('Database does not exist. Start the API first.');
  if (existsSync(target)) throw new Error('Backup target already exists.');
  mkdirSync(dirname(target), { recursive: true });
  const db = new DatabaseSync(source);
  try {
    db.exec('PRAGMA busy_timeout=5000');
    db.prepare('VACUUM INTO ?').run(target);
  } finally {
    db.close();
  }
}
