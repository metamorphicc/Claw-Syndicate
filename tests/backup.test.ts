import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../server/store';
import { backupDatabase } from '../server/backup';
test('online backup restores one consistent state and refuses overwrites', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'claw-backup-'));
  const source = join(directory, 'source.sqlite'),
    target = join(directory, 'backup.sqlite');
  const store = new Store(source);
  try {
    await store.register('backup@example.com', 'Backup owner', 'Backup-test-password', true);
    const expected = store.state();
    backupDatabase(source, target);
    assert.throws(() => backupDatabase(source, target));
    const restored = new Store(target);
    try {
      assert.deepEqual(restored.state(), expected);
      assert.equal(
        (await restored.login('backup@example.com', 'Backup-test-password')).name,
        'Backup owner',
      );
    } finally {
      restored.close();
    }
  } finally {
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
