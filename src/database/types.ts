/**
 * Veri katmanı için TypeScript tip tanımları
 */

export type Timestamp = number;

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done';

export type TaskPriority = 0 | 1 | 2 | 3; // 0: düşük, 1: normal, 2: yüksek, 3: kritik

export interface List {
  id: string;
  name: string;
  color: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
  deleted_at: Timestamp | null;
  version: number;
  dirty: number; // 0: temiz, 1: kirli (senkron bekliyor)
}

export interface Task {
  id: string;
  list_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  start_date: Timestamp | null;
  due_date: Timestamp | null;
  completed_at: Timestamp | null;
  created_at: Timestamp;
  updated_at: Timestamp;
  deleted_at: Timestamp | null;
  version: number;
  dirty: number;
  sort_order: number | null;
}

export interface Label {
  id: string;
  name: string;
  color: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
  deleted_at: Timestamp | null;
  version: number;
  dirty: number;
}

export interface TaskLabel {
  task_id: string;
  label_id: string;
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  done: number; // 0: yapılmadı, 1: yapıldı
  sort_order: number | null;
  created_at: Timestamp;
  updated_at: Timestamp;
  deleted_at: Timestamp | null;
  version: number;
  dirty: number;
}

// Repository fonksiyonları için yardımcı tipler
export interface PagingOptions {
  limit?: number;
  offset?: number;
}

export interface AgendaRange {
  start: Timestamp;
  end: Timestamp;
}

// DTO tipleri (kullanıcı arayüzü için)
export interface TaskWithLabels extends Task {
  labels: Label[];
}

export interface TaskWithSubtasks extends Task {
  subtasks: Subtask[];
}

export interface TaskComplete extends Task {
  labels: Label[];
  subtasks: Subtask[];
  list: List | null;
}
