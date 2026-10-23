import { resolve } from 'node:path';
import { backupDatabase } from './backup';
const source = resolve(process.env.DATABASE_PATH ?? 'data/claw.sqlite');
const target = resolve(
  'data/backups',
  `claw-${new Date().toISOString().replace(/[:.]/g, '-')}.sqlite`,
);
backupDatabase(source, target);
console.log(`Consistent database backup: ${target}`);
