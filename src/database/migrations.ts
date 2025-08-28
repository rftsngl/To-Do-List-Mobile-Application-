/**
 * Veritabanı migration sistemi
 */

import SQLite from 'react-native-sqlite-storage';

export interface Migration {
  version: number;
  name: string;
  up: string[];
  down: string[];
}

/**
 * Migration v1: İlk şema oluşturma
 */
const migration_v1: Migration = {
  version: 1,
  name: 'initial_schema',
  up: [
    // Lists tablosu
    `CREATE TABLE lists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER NULL,
      version INTEGER NOT NULL DEFAULT 0,
      dirty INTEGER NOT NULL DEFAULT 1
    );`,

    // Tasks tablosu
    `CREATE TABLE tasks (
      id TEXT PRIMARY KEY,
      list_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NULL,
      status TEXT NOT NULL CHECK(status IN ('todo','in_progress','blocked','done')),
      priority INTEGER NOT NULL CHECK(priority BETWEEN 0 AND 3),
      start_date INTEGER NULL,
      due_date INTEGER NULL,
      completed_at INTEGER NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER NULL,
      version INTEGER NOT NULL DEFAULT 0,
      dirty INTEGER NOT NULL DEFAULT 1,
      sort_order REAL NULL,
      FOREIGN KEY(list_id) REFERENCES lists(id) ON DELETE CASCADE
    );`,

    // Labels tablosu
    `CREATE TABLE labels (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER NULL,
      version INTEGER NOT NULL DEFAULT 0,
      dirty INTEGER NOT NULL DEFAULT 1,
      UNIQUE(name)
    );`,

    // Task-Label ilişki tablosu
    `CREATE TABLE task_labels (
      task_id TEXT NOT NULL,
      label_id TEXT NOT NULL,
      PRIMARY KEY(task_id, label_id),
      FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY(label_id) REFERENCES labels(id) ON DELETE CASCADE
    );`,

    // Subtasks tablosu
    `CREATE TABLE subtasks (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      title TEXT NOT NULL,
      done INTEGER NOT NULL DEFAULT 0 CHECK(done IN (0,1)),
      sort_order REAL NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER NULL,
      version INTEGER NOT NULL DEFAULT 0,
      dirty INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );`,

    // İndeksler
    `CREATE INDEX idx_tasks_list_status_prio_due ON tasks(list_id, status, priority, due_date);`,
    `CREATE INDEX idx_tasks_due ON tasks(due_date);`,
    `CREATE INDEX idx_tasks_updated ON tasks(updated_at);`,
    `CREATE INDEX idx_tasks_dirty ON tasks(dirty);`,
    `CREATE INDEX idx_task_labels_label ON task_labels(label_id);`,
    `CREATE INDEX idx_task_labels_task ON task_labels(task_id);`,
    `CREATE INDEX idx_subtasks_task ON subtasks(task_id);`,

    // Trigger'lar - Lists
    `CREATE TRIGGER trg_lists_insert_timestamps
     BEFORE INSERT ON lists
     FOR EACH ROW
     WHEN NEW.created_at IS NULL OR NEW.updated_at IS NULL
     BEGIN
       SELECT CASE 
         WHEN NEW.created_at IS NULL THEN 
           RAISE(FAIL, 'created_at must be set before insert')
         WHEN NEW.updated_at IS NULL THEN 
           RAISE(FAIL, 'updated_at must be set before insert')
       END;
     END;`,

    `CREATE TRIGGER trg_lists_update_timestamps
     AFTER UPDATE ON lists
     FOR EACH ROW
     BEGIN
       UPDATE lists SET 
         updated_at = CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER),
         version = OLD.version + 1,
         dirty = 1
       WHERE id = NEW.id;
     END;`,

    // Trigger'lar - Tasks
    `CREATE TRIGGER trg_tasks_insert_timestamps
     BEFORE INSERT ON tasks
     FOR EACH ROW
     WHEN NEW.created_at IS NULL OR NEW.updated_at IS NULL
     BEGIN
       SELECT CASE 
         WHEN NEW.created_at IS NULL THEN 
           RAISE(FAIL, 'created_at must be set before insert')
         WHEN NEW.updated_at IS NULL THEN 
           RAISE(FAIL, 'updated_at must be set before insert')
       END;
     END;`,

    `CREATE TRIGGER trg_tasks_update_timestamps
     AFTER UPDATE ON tasks
     FOR EACH ROW
     BEGIN
       UPDATE tasks SET 
         updated_at = CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER),
         version = OLD.version + 1,
         dirty = 1
       WHERE id = NEW.id;
     END;`,

    // Trigger'lar - Labels
    `CREATE TRIGGER trg_labels_insert_timestamps
     BEFORE INSERT ON labels
     FOR EACH ROW
     WHEN NEW.created_at IS NULL OR NEW.updated_at IS NULL
     BEGIN
       SELECT CASE 
         WHEN NEW.created_at IS NULL THEN 
           RAISE(FAIL, 'created_at must be set before insert')
         WHEN NEW.updated_at IS NULL THEN 
           RAISE(FAIL, 'updated_at must be set before insert')
       END;
     END;`,

    `CREATE TRIGGER trg_labels_update_timestamps
     AFTER UPDATE ON labels
     FOR EACH ROW
     BEGIN
       UPDATE labels SET 
         updated_at = CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER),
         version = OLD.version + 1,
         dirty = 1
       WHERE id = NEW.id;
     END;`,

    // Trigger'lar - Subtasks
    `CREATE TRIGGER trg_subtasks_insert_timestamps
     BEFORE INSERT ON subtasks
     FOR EACH ROW
     WHEN NEW.created_at IS NULL OR NEW.updated_at IS NULL
     BEGIN
       SELECT CASE 
         WHEN NEW.created_at IS NULL THEN 
           RAISE(FAIL, 'created_at must be set before insert')
         WHEN NEW.updated_at IS NULL THEN 
           RAISE(FAIL, 'updated_at must be set before insert')
       END;
     END;`,

    `CREATE TRIGGER trg_subtasks_update_timestamps
     AFTER UPDATE ON subtasks
     FOR EACH ROW
     BEGIN
       UPDATE subtasks SET 
         updated_at = CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER),
         version = OLD.version + 1,
         dirty = 1
       WHERE id = NEW.id;
     END;`,

    // Migration sürüm tablosu
    `CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at INTEGER NOT NULL
    );`,

    // İlk migration'ı kaydet
    `INSERT INTO schema_migrations (version, applied_at) 
     VALUES (1, CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER));`
  ],
  down: [
    'DROP TABLE IF EXISTS subtasks;',
    'DROP TABLE IF EXISTS task_labels;',
    'DROP TABLE IF EXISTS labels;',
    'DROP TABLE IF EXISTS tasks;',
    'DROP TABLE IF EXISTS lists;',
    'DROP TABLE IF EXISTS schema_migrations;'
  ]
};

/**
 * Migration v2: list_id alanını nullable yap
 */
const migration_v2: Migration = {
  version: 2,
  name: 'make_list_id_nullable',
  up: [
    // Yeni tasks tablosu oluştur (nullable list_id ile)
    `CREATE TABLE tasks_new (
      id TEXT PRIMARY KEY,
      list_id TEXT NULL,
      title TEXT NOT NULL,
      description TEXT NULL,
      status TEXT NOT NULL CHECK(status IN ('todo','in_progress','blocked','done')),
      priority INTEGER NOT NULL CHECK(priority BETWEEN 0 AND 3),
      start_date INTEGER NULL,
      due_date INTEGER NULL,
      completed_at INTEGER NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER NULL,
      version INTEGER NOT NULL DEFAULT 0,
      dirty INTEGER NOT NULL DEFAULT 1,
      sort_order REAL NULL,
      FOREIGN KEY(list_id) REFERENCES lists(id) ON DELETE SET NULL
    );`,
    
    // Verileri kopyala
    `INSERT INTO tasks_new 
     SELECT id, list_id, title, description, status, priority, start_date, due_date, 
            completed_at, created_at, updated_at, deleted_at, version, dirty, sort_order 
     FROM tasks;`,
    
    // Eski tabloyu sil
    `DROP TABLE tasks;`,
    
    // Yeni tabloyu yeniden adlandır
    `ALTER TABLE tasks_new RENAME TO tasks;`,
    
    // Migration kaydını ekle
    `INSERT INTO schema_migrations (version, applied_at) 
     VALUES (2, CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER));`
  ],
  down: [
    // Geri almak için eski schema'ya döndür (ancak null değerleri kaybedecek)
    `CREATE TABLE tasks_old (
      id TEXT PRIMARY KEY,
      list_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NULL,
      status TEXT NOT NULL CHECK(status IN ('todo','in_progress','blocked','done')),
      priority INTEGER NOT NULL CHECK(priority BETWEEN 0 AND 3),
      start_date INTEGER NULL,
      due_date INTEGER NULL,
      completed_at INTEGER NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER NULL,
      version INTEGER NOT NULL DEFAULT 0,
      dirty INTEGER NOT NULL DEFAULT 1,
      sort_order REAL NULL,
      FOREIGN KEY(list_id) REFERENCES lists(id) ON DELETE CASCADE
    );`,
    
    `INSERT INTO tasks_old 
     SELECT id, list_id, title, description, status, priority, start_date, due_date, 
            completed_at, created_at, updated_at, deleted_at, version, dirty, sort_order 
     FROM tasks WHERE list_id IS NOT NULL;`,
    
    `DROP TABLE tasks;`,
    `ALTER TABLE tasks_old RENAME TO tasks;`,
    `DELETE FROM schema_migrations WHERE version = 2;`
  ]
};

export const migrations: Migration[] = [
  migration_v1,
  migration_v2
];

/**
 * Mevcut veritabanı sürümünü kontrol et
 */
export async function getCurrentVersion(db: SQLite.SQLiteDatabase): Promise<number> {
  try {
    const result = await db.executeSql('SELECT MAX(version) as version FROM schema_migrations;');
    return result[0].rows.item(0)?.version || 0;
  } catch (error) {
    // Tablo henüz yok, sürüm 0
    return 0;
  }
}

/**
 * Bekleyen migration'ları çalıştır
 */
export async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  const currentVersion = await getCurrentVersion(db);
  const pendingMigrations = migrations.filter(m => m.version > currentVersion);

  if (pendingMigrations.length === 0) {
    console.log('[Migration] Tüm migration\'lar güncel');
    return;
  }

  for (const migration of pendingMigrations) {
    console.log(`[Migration] v${migration.version} çalıştırılıyor: ${migration.name}`);
    
    try {
      await db.executeSql('BEGIN;');
      for (const sql of migration.up) {
        await db.executeSql(sql);
      }
      await db.executeSql('COMMIT;');
      
      console.log(`[Migration] v${migration.version} başarıyla tamamlandı`);
    } catch (error) {
      console.error(`[Migration] v${migration.version} hatası:`, error);
      try {
        await db.executeSql('ROLLBACK;');
      } catch (rollbackError) {
        console.error(`[Migration] Rollback hatası:`, rollbackError);
      }
      throw new Error(`Migration v${migration.version} başarısız: ${error}`);
    }
  }
}

/**
 * Veritabanını belirli sürüme geri al (geliştirme için)
 */
export async function rollbackTo(db: SQLite.SQLiteDatabase, targetVersion: number): Promise<void> {
  const currentVersion = await getCurrentVersion(db);
  
  if (targetVersion >= currentVersion) {
    console.log('[Rollback] Geri alma gerekmiyor');
    return;
  }

  const rollbackMigrations = migrations
    .filter(m => m.version > targetVersion && m.version <= currentVersion)
    .reverse(); // Ters sırada çalıştır

  for (const migration of rollbackMigrations) {
    console.log(`[Rollback] v${migration.version} geri alınıyor`);
    
    try {
      await db.executeSql('BEGIN;');
      for (const sql of migration.down) {
        await db.executeSql(sql);
      }
      
      // Migration kaydını sil
      await db.executeSql('DELETE FROM schema_migrations WHERE version = ?;', [migration.version]);
      await db.executeSql('COMMIT;');
      
      console.log(`[Rollback] v${migration.version} geri alındı`);
    } catch (error) {
      console.error(`[Rollback] v${migration.version} hatası:`, error);
      try {
        await db.executeSql('ROLLBACK;');
      } catch (rollbackError) {
        console.error(`[Rollback] Transaction rollback hatası:`, rollbackError);
      }
      throw new Error(`Rollback v${migration.version} başarısız: ${error}`);
    }
  }
}
