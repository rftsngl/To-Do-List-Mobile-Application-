/**
 * Tasks repository - Görev yönetimi
 */

import { DatabaseManager } from '../db';
import { Task, TaskStatus, TaskPriority, PagingOptions, AgendaRange, TaskWithLabels } from '../types';
import { generateId, now } from '../id';

export class TasksRepository {

  /**
   * Varsayılan sıralama SQL'i
   * Status: todo -> in_progress -> blocked -> done
   * Priority: 3 -> 2 -> 1 -> 0 (yüksek öncelik üstte)
   * Due date: en yakın tarih üstte (NULLS LAST)
   * Updated: en son güncellenen üstte
   */
  private static getDefaultOrderBy(): string {
    return `
      ORDER BY 
        CASE status 
          WHEN 'todo' THEN 1
          WHEN 'in_progress' THEN 2  
          WHEN 'blocked' THEN 3
          WHEN 'done' THEN 4
        END,
        priority DESC,
        CASE WHEN due_date IS NULL THEN 1 ELSE 0 END,
        due_date ASC,
        updated_at DESC
    `;
  }

  /**
   * Yeni görev oluştur
   */
  static async create(data: {
    list_id: string | null;
    title: string;
    description?: string | null;
    status?: TaskStatus;
    priority?: TaskPriority;
    start_date?: number | null;
    due_date?: number | null;
    sort_order?: number | null;
  }): Promise<Task> {
    const id = generateId();
    const timestamp = now();

    const sql = `
      INSERT INTO tasks (
        id, list_id, title, description, status, priority, 
        start_date, due_date, sort_order, created_at, updated_at, version, dirty
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1)
    `;

    try {
      await DatabaseManager.execute(sql, [
        id,
        data.list_id,
        data.title,
        data.description || null,
        data.status || 'todo',
        data.priority || 1,
        data.start_date || null,
        data.due_date || null,
        data.sort_order || null,
        timestamp,
        timestamp
      ]);

      return (await this.getById(id))!;
    } catch (error) {
      throw new Error(`Görev oluşturma hatası: ${error}`);
    }
  }

  /**
   * Görev güncelle
   */
  static async update(id: string, data: any): Promise<Task | null> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`Görev bulunamadı: ${id}`);
    }

    const updates: string[] = [];
    const params: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (updates.length === 0) {
      return existing;
    }

    // Eğer status 'done' yapılıyorsa completed_at'i set et
    if (data.status === 'done' && existing.status !== 'done') {
      updates.push('completed_at = ?');
      params.push(now());
    } else if (data.status && data.status !== 'done' && existing.status === 'done') {
      // 'done'dan başka bir status'a geçiş
      updates.push('completed_at = NULL');
    }

    updates.push('updated_at = ?');
    params.push(now());
    params.push(id);

    const sql = `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`;

    try {
      const affectedRows = await DatabaseManager.modify(sql, params);
      if (affectedRows === 0) {
        throw new Error(`Görev güncellenemedi: ${id}`);
      }

      return await this.getById(id);
    } catch (error) {
      throw new Error(`Görev güncelleme hatası: ${error}`);
    }
  }

  /**
   * Görev soft delete
   */
  static async delete(id: string): Promise<boolean> {
    const sql = `
      UPDATE tasks 
      SET deleted_at = ?, dirty = 1, version = version + 1
      WHERE id = ? AND deleted_at IS NULL
    `;

    try {
      const affectedRows = await DatabaseManager.modify(sql, [now(), id]);
      return affectedRows > 0;
    } catch (error) {
      throw new Error(`Görev silme hatası: ${error}`);
    }
  }

  /**
   * Görevi geri yükle
   */
  static async restore(id: string): Promise<boolean> {
    const sql = `
      UPDATE tasks 
      SET deleted_at = NULL, dirty = 1, version = version + 1
      WHERE id = ? AND deleted_at IS NOT NULL
    `;

    try {
      const affectedRows = await DatabaseManager.modify(sql, [id]);
      return affectedRows > 0;
    } catch (error) {
      throw new Error(`Görev geri yükleme hatası: ${error}`);
    }
  }

  /**
   * Görevi tamamla
   */
  static async markDone(id: string): Promise<Task | null> {
    const sql = `
      UPDATE tasks 
      SET status = 'done', completed_at = ?, updated_at = ?, dirty = 1, version = version + 1
      WHERE id = ? AND deleted_at IS NULL
    `;

    try {
      const timestamp = now();
      const affectedRows = await DatabaseManager.modify(sql, [timestamp, timestamp, id]);
      
      if (affectedRows === 0) {
        throw new Error(`Görev tamamlanamadı: ${id}`);
      }

      return await this.getById(id);
    } catch (error) {
      throw new Error(`Görev tamamlama hatası: ${error}`);
    }
  }

  /**
   * ID ile görev getir
   */
  static async getById(id: string): Promise<Task | null> {
    const sql = 'SELECT * FROM tasks WHERE id = ? AND deleted_at IS NULL';
    
    try {
      return await DatabaseManager.queryFirst<Task>(sql, [id]);
    } catch (error) {
      throw new Error(`Görev getirme hatası: ${error}`);
    }
  }

  /**
   * Listeye göre görevleri getir
   */
  static async getByList(
    listId: string, 
    options?: PagingOptions & { includeCompleted?: boolean }
  ): Promise<Task[]> {
    const includeCompleted = options?.includeCompleted !== false;
    const statusFilter = includeCompleted ? '' : "AND status != 'done'";
    
    let sql = `
      SELECT * FROM tasks 
      WHERE list_id = ? AND deleted_at IS NULL ${statusFilter}
      ${this.getDefaultOrderBy()}
    `;

    const params = [listId];

    if (options?.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit.toString());
      
      if (options.offset) {
        sql += ' OFFSET ?';
        params.push(options.offset.toString());
      }
    }

    try {
      return await DatabaseManager.queryAll<Task>(sql, params);
    } catch (error) {
      throw new Error(`Liste görevleri getirme hatası: ${error}`);
    }
  }

  /**
   * Tüm görevleri getir (liste ID'si null olanlar dahil)
   */
  static async getAll(options?: PagingOptions & { includeCompleted?: boolean }): Promise<Task[]> {
    const includeCompleted = options?.includeCompleted !== false;
    const statusFilter = includeCompleted ? '' : "AND status != 'done'";
    
    let sql = `
      SELECT * FROM tasks 
      WHERE deleted_at IS NULL ${statusFilter}
      ${this.getDefaultOrderBy()}
    `;

    const params: string[] = [];

    if (options?.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit.toString());
      
      if (options.offset) {
        sql += ' OFFSET ?';
        params.push(options.offset.toString());
      }
    }

    try {
      return await DatabaseManager.queryAll<Task>(sql, params);
    } catch (error) {
      throw new Error(`Tüm görevleri getirme hatası: ${error}`);
    }
  }

  /**
   * Status'a göre görevleri getir
   */
  static async getByStatus(listId: string, status: TaskStatus): Promise<Task[]> {
    const sql = `
      SELECT * FROM tasks 
      WHERE list_id = ? AND status = ? AND deleted_at IS NULL
      ${this.getDefaultOrderBy()}
    `;

    try {
      return await DatabaseManager.queryAll<Task>(sql, [listId, status]);
    } catch (error) {
      throw new Error(`Status görevleri getirme hatası: ${error}`);
    }
  }

  /**
   * Etikete göre görevleri getir
   */
  static async getByLabel(labelId: string): Promise<Task[]> {
    const sql = `
      SELECT t.* FROM tasks t
      INNER JOIN task_labels tl ON t.id = tl.task_id
      WHERE tl.label_id = ? AND t.deleted_at IS NULL
      ${this.getDefaultOrderBy()}
    `;

    try {
      return await DatabaseManager.queryAll<Task>(sql, [labelId]);
    } catch (error) {
      throw new Error(`Etiket görevleri getirme hatası: ${error}`);
    }
  }

  /**
   * Ajanda (tarih aralığındaki görevler)
   */
  static async getAgenda(range: AgendaRange): Promise<Task[]> {
    const sql = `
      SELECT * FROM tasks 
      WHERE deleted_at IS NULL
        AND (
          (due_date >= ? AND due_date <= ?) OR
          (start_date >= ? AND start_date <= ?) OR
          (start_date <= ? AND due_date >= ?)
        )
      ${this.getDefaultOrderBy()}
    `;

    try {
      return await DatabaseManager.queryAll<Task>(sql, [
        range.start, range.end,  // due_date aralığı
        range.start, range.end,  // start_date aralığı  
        range.start, range.end   // aralığı kapsayan görevler
      ]);
    } catch (error) {
      throw new Error(`Ajanda getirme hatası: ${error}`);
    }
  }

  /**
   * Vadesi geçmiş görevler
   */
  static async getOverdue(): Promise<Task[]> {
    const now_ts = now();
    const sql = `
      SELECT * FROM tasks 
      WHERE due_date < ? AND status != 'done' AND deleted_at IS NULL
      ${this.getDefaultOrderBy()}
    `;

    try {
      return await DatabaseManager.queryAll<Task>(sql, [now_ts]);
    } catch (error) {
      throw new Error(`Vadesi geçmiş görevler getirme hatası: ${error}`);
    }
  }

  /**
   * Bu hafta vadesi dolan görevler
   */
  static async getThisWeek(): Promise<Task[]> {
    const now_ts = now();
    const weekEnd = now_ts + (7 * 24 * 60 * 60 * 1000); // 7 gün sonra

    const sql = `
      SELECT * FROM tasks 
      WHERE due_date >= ? AND due_date <= ? AND status != 'done' AND deleted_at IS NULL
      ${this.getDefaultOrderBy()}
    `;

    try {
      return await DatabaseManager.queryAll<Task>(sql, [now_ts, weekEnd]);
    } catch (error) {
      throw new Error(`Bu hafta görevleri getirme hatası: ${error}`);
    }
  }

  /**
   * Görevleri etiketleriyle birlikte getir
   */
  static async getWithLabels(taskIds: string[]): Promise<TaskWithLabels[]> {
    if (taskIds.length === 0) return [];

    const placeholders = taskIds.map(() => '?').join(',');
    const sql = `
      SELECT 
        t.*,
        GROUP_CONCAT(
          CASE WHEN l.id IS NOT NULL THEN
            json_object(
              'id', l.id,
              'name', l.name, 
              'color', l.color,
              'created_at', l.created_at,
              'updated_at', l.updated_at,
              'deleted_at', l.deleted_at,
              'version', l.version,
              'dirty', l.dirty
            )
          END
        ) as labels_json
      FROM tasks t
      LEFT JOIN task_labels tl ON t.id = tl.task_id  
      LEFT JOIN labels l ON tl.label_id = l.id AND l.deleted_at IS NULL
      WHERE t.id IN (${placeholders}) AND t.deleted_at IS NULL
      GROUP BY t.id
      ${this.getDefaultOrderBy()}
    `;

    try {
      const results = await DatabaseManager.queryAll(sql, taskIds);
      
      return results.map(row => ({
        ...row,
        labels: row.labels_json 
          ? row.labels_json.split(',').map((jsonStr: string) => JSON.parse(jsonStr))
          : []
      }));
    } catch (error) {
      throw new Error(`Etiketli görevler getirme hatası: ${error}`);
    }
  }

  /**
   * Arama
   */
  static async search(query: string, listId?: string): Promise<Task[]> {
    let sql = `
      SELECT * FROM tasks 
      WHERE (title LIKE ? OR description LIKE ?) 
        AND deleted_at IS NULL
    `;
    
    const params = [`%${query}%`, `%${query}%`];

    if (listId) {
      sql += ' AND list_id = ?';
      params.push(listId);
    }

    sql += this.getDefaultOrderBy();

    try {
      return await DatabaseManager.queryAll<Task>(sql, params);
    } catch (error) {
      throw new Error(`Görev arama hatası: ${error}`);
    }
  }

  /**
   * Kirli (senkron bekleyen) görevleri getir
   */
  static async getDirty(): Promise<Task[]> {
    const sql = `
      SELECT * FROM tasks 
      WHERE dirty = 1
      ORDER BY updated_at ASC
    `;

    try {
      return await DatabaseManager.queryAll<Task>(sql);
    } catch (error) {
      throw new Error(`Kirli görevler getirme hatası: ${error}`);
    }
  }

  /**
   * Görev temizle (senkron sonrası)
   */
  static async markClean(id: string, version?: number): Promise<boolean> {
    const updates = ['dirty = 0'];
    const params = [id];

    if (version !== undefined) {
      updates.push('version = ?');
      params.unshift(version.toString());
    }

    const sql = `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`;

    try {
      const affectedRows = await DatabaseManager.modify(sql, params);
      return affectedRows > 0;
    } catch (error) {
      throw new Error(`Görev temizleme hatası: ${error}`);
    }
  }

  /**
   * Toplam görev sayısı
   */
  static async count(listId?: string, status?: TaskStatus): Promise<number> {
    let sql = 'SELECT COUNT(*) as count FROM tasks WHERE deleted_at IS NULL';
    const params: any[] = [];

    if (listId) {
      sql += ' AND list_id = ?';
      params.push(listId);
    }

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    try {
      const result = await DatabaseManager.queryFirst<{ count: number }>(sql, params);
      return result?.count || 0;
    } catch (error) {
      throw new Error(`Görev sayısı getirme hatası: ${error}`);
    }
  }

  /**
   * Manuel sıralama güncelle
   */
  static async updateSortOrder(id: string, sortOrder: number): Promise<boolean> {
    const sql = `
      UPDATE tasks 
      SET sort_order = ?, updated_at = ?, dirty = 1, version = version + 1
      WHERE id = ? AND deleted_at IS NULL
    `;

    try {
      const affectedRows = await DatabaseManager.modify(sql, [sortOrder, now(), id]);
      return affectedRows > 0;
    } catch (error) {
      throw new Error(`Sıralama güncelleme hatası: ${error}`);
    }
  }

  /**
   * Manuel sıralama ile görevleri getir
   */
  static async getByListWithCustomOrder(listId: string): Promise<Task[]> {
    const sql = `
      SELECT * FROM tasks 
      WHERE list_id = ? AND deleted_at IS NULL
      ORDER BY 
        CASE WHEN sort_order IS NOT NULL THEN 0 ELSE 1 END,
        sort_order ASC,
        ${this.getDefaultOrderBy().replace('ORDER BY', '')}
    `;

    try {
      return await DatabaseManager.queryAll<Task>(sql, [listId]);
    } catch (error) {
      throw new Error(`Özel sıralı görevler getirme hatası: ${error}`);
    }
  }

  /**
   * Liste bazında görev sayısını getir
   */
  static async countByList(listId: string, status?: TaskStatus): Promise<number> {
    let sql = 'SELECT COUNT(*) as count FROM tasks WHERE list_id = ? AND deleted_at IS NULL';
    const params: any[] = [listId];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    try {
      const result = await DatabaseManager.queryFirst<{ count: number }>(sql, params);
      return result?.count || 0;
    } catch (error) {
      throw new Error(`Liste görev sayısı getirme hatası: ${error}`);
    }
  }

  /**
   * Tüm görevleri bir listeden diğerine taşı
   */
  static async moveAll(options: { fromListId: string; toListId: string }): Promise<void> {
    // Hedef listenin var olduğunu kontrol et
    const targetListExists = await DatabaseManager.queryFirst(
      'SELECT id FROM lists WHERE id = ? AND deleted_at IS NULL',
      [options.toListId]
    );
    
    if (!targetListExists) {
      throw new Error(`Hedef liste bulunamadı: ${options.toListId}`);
    }

    const sql = `
      UPDATE tasks 
      SET list_id = ?, updated_at = ?, dirty = 1, version = version + 1
      WHERE list_id = ? AND deleted_at IS NULL
    `;

    try {
      const timestamp = now();
      await DatabaseManager.modify(sql, [options.toListId, timestamp, options.fromListId]);
    } catch (error) {
      throw new Error(`Görev taşıma hatası: ${error}`);
    }
  }

  /**
   * Etikete göre filtrelenmiş görevleri getir (gelişmiş)
   */
  static async getByLabelAdvanced(labelId: string, options?: {
    status?: TaskStatus;
    includeCompleted?: boolean;
    dateRange?: AgendaRange;
  }): Promise<Task[]> {
    let sql = `
      SELECT t.* FROM tasks t
      INNER JOIN task_labels tl ON t.id = tl.task_id
      WHERE tl.label_id = ? AND t.deleted_at IS NULL
    `;
    const params: any[] = [labelId];

    // Status filtresi
    if (options?.status) {
      sql += ' AND t.status = ?';
      params.push(options.status);
    } else if (options?.includeCompleted === false) {
      sql += " AND t.status != 'done'";
    }

    // Tarih aralığı filtresi
    if (options?.dateRange) {
      sql += ` AND (
        (t.due_date >= ? AND t.due_date <= ?) OR
        (t.start_date >= ? AND t.start_date <= ?) OR
        (t.start_date <= ? AND t.due_date >= ?)
      )`;
      params.push(
        options.dateRange.start, options.dateRange.end,
        options.dateRange.start, options.dateRange.end,
        options.dateRange.start, options.dateRange.end
      );
    }

    sql += this.getDefaultOrderBy();

    try {
      return await DatabaseManager.queryAll<Task>(sql, params);
    } catch (error) {
      throw new Error(`Etiket filtrelenmiş görevler getirme hatası: ${error}`);
    }
  }
}
