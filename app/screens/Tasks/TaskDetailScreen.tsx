/**
 * TaskDetailScreen - Görev detay ve düzenleme ekranı
 * Tam ekran stack ile, tüm görev bilgilerini göster ve düzenle
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Navigation
import { Header } from '../../navigation/Stack';

// Database  
import {
  TasksRepository,
  ListsRepository,
  LabelsRepository,
  SubtasksRepository,
  type Task,
  type List,
  type Label,

} from '../../../src/database';

// Utils
import { formatDateYYYYMMDD, parseDateYYYYMMDD } from '../../utils/date';
import { getAllStatuses, getAllPriorities } from '../../utils/status';

// Theme
import { lightTheme, getPriorityColor, getStatusColor } from '../../theme/theme';

// Components
import { SubtasksPanel } from './components/SubtasksPanel';

interface TaskDetailScreenProps {
  taskId: string;
  onClose: () => void;
  onTaskUpdated: () => void;
  onTaskDeleted: () => void;
}

interface TaskFormData {
  title: string;
  description: string;
  status: string;
  priority: number;
  start_date: string;
  due_date: string;
  list_id: string;
  label_ids: string[];
}

export const TaskDetailScreen: React.FC<TaskDetailScreenProps> = ({
  taskId,
  onClose,
  onTaskUpdated,
  onTaskDeleted,
}) => {
  const safeAreaInsets = useSafeAreaInsets();
  
  const [task, setTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<TaskFormData | null>(null);
  const [lists, setLists] = useState<List[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [showCompletionBanner, setShowCompletionBanner] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [subtaskStats, setSubtaskStats] = useState({ total: 0, done: 0 });

  // Veriyi yükle
  useEffect(() => {
    loadData();
  }, [taskId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Paralel veri yükleme
      const [taskData, listsData, labelsData] = await Promise.all([
        TasksRepository.getById(taskId),
        ListsRepository.getAll(),
        LabelsRepository.getAll(),
      ]);

      if (!taskData) {
        Alert.alert('Hata', 'Görev bulunamadı', [
          { text: 'Tamam', onPress: onClose }
        ]);
        return;
      }

      // Görev etiketlerini ve alt görev istatistiklerini yükle
      const [taskLabels, statsData] = await Promise.all([
        LabelsRepository.getByTask(taskId),
        SubtasksRepository.getStats(taskId),
      ]);

      setTask(taskData);
      setLists(listsData);
      setLabels(labelsData);
      setSubtaskStats(statsData);

      // Tüm alt görevler tamamlandıysa ve ana görev done değilse banner göster (dismiss edilmediyse)
      if (statsData.total > 0 && statsData.done === statsData.total && taskData.status !== 'done' && !bannerDismissed) {
        setShowCompletionBanner(true);
      } else {
        setShowCompletionBanner(false);
      }

      // Form verisini hazırla
      setFormData({
        title: taskData.title,
        description: taskData.description || '',
        status: taskData.status,
        priority: taskData.priority,
        start_date: taskData.start_date ? formatDateYYYYMMDD(taskData.start_date) : formatDateYYYYMMDD(taskData.created_at),
        due_date: taskData.due_date ? formatDateYYYYMMDD(taskData.due_date) : '',
        list_id: taskData.list_id,
        label_ids: taskLabels.map(label => label.id),
      });

    } catch (err) {
      console.error('[TaskDetail] Veri yükleme hatası:', err);
      Alert.alert('Hata', 'Görev verisi yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Form alanı güncelle
  const updateField = <K extends keyof TaskFormData>(field: K, value: TaskFormData[K]) => {
    if (!formData) return;
    
    setFormData(prev => ({
      ...prev!,
      [field]: value
    }));
    
    // Hata temizle
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Etiket toggle
  const toggleLabel = (labelId: string) => {
    if (!formData) return;
    
    const currentLabels = formData.label_ids;
    const newLabels = currentLabels.includes(labelId)
      ? currentLabels.filter(id => id !== labelId)
      : [...currentLabels, labelId];
    
    updateField('label_ids', newLabels);
  };

  // Ana görevi tamamlandı olarak işaretle
  const handleMarkTaskDone = async () => {
    if (!task) return;

    try {
      await TasksRepository.update(task.id, { status: 'done' });
      setShowCompletionBanner(false);
      setBannerDismissed(false); // Reset dismiss state
      
      // Task'ı güncelle
      const updatedTask = await TasksRepository.getById(taskId);
      if (updatedTask) {
        setTask(updatedTask);
        setFormData(prev => prev ? { ...prev, status: 'done' } : null);
      }
      
      // Parent'a bildir
      onTaskUpdated();
      
    } catch (err) {
      console.error('[TaskDetail] Görev tamamlama hatası:', err);
      Alert.alert('Hata', 'Görev tamamlandı olarak işaretlenemedi');
    }
  };

  // Alt görev istatistikleri güncellendiğinde completion banner kontrolü
  const handleSubtasksStatsUpdate = (newStats: { total: number; done: number }) => {
    setSubtaskStats(newStats);
    
    // Banner gösterme kontrolü - sadece kullanıcı daha önce dismiss etmediyse
    if (task && newStats.total > 0 && newStats.done === newStats.total && task.status !== 'done' && !bannerDismissed) {
      setShowCompletionBanner(true);
    } else if (newStats.done < newStats.total) {
      // Alt görevler tamamlanmadıysa banner'ı kapat ve dismiss state'ini reset et
      setShowCompletionBanner(false);
      setBannerDismissed(false);
    }
  };

  // Form validasyon
  const validateForm = (): boolean => {
    if (!formData) return false;
    
    const newErrors: {[key: string]: string} = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Görev başlığı gerekli';
    }

    if (formData.start_date && !parseDateYYYYMMDD(formData.start_date)) {
      newErrors.start_date = 'Geçersiz tarih formatı';
    }

    if (formData.due_date && !parseDateYYYYMMDD(formData.due_date)) {
      newErrors.due_date = 'Geçersiz tarih formatı';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Görevi kaydet
  const handleSave = async () => {
    if (!formData || !validateForm()) return;

    setSaving(true);

    try {
      // Görevi güncelle
      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        status: formData.status as any,
        priority: formData.priority as any,
        start_date: formData.start_date ? parseDateYYYYMMDD(formData.start_date) : null,
        due_date: formData.due_date ? parseDateYYYYMMDD(formData.due_date) : null,
      };

      // Eğer liste değişmişse, liste güncelleme
      if (task && formData.list_id !== task.list_id) {
        await TasksRepository.update(taskId, {
          ...updateData,
          list_id: formData.list_id,
        });
      } else {
        await TasksRepository.update(taskId, updateData);
      }

      // Etiketleri güncelle
      await LabelsRepository.setTaskLabels(taskId, formData.label_ids);

      console.log('[TaskDetail] Görev güncellendi:', taskId);
      
      onTaskUpdated();
      onClose();

    } catch (err) {
      console.error('[TaskDetail] Görev güncelleme hatası:', err);
      Alert.alert('Hata', 'Görev güncellenirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  // Görevi sil
  const handleDelete = () => {
    Alert.alert(
      'Görevi Sil',
      'Bu görevi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await TasksRepository.delete(taskId);
              console.log('[TaskDetail] Görev silindi:', taskId);
              
              onTaskDeleted();
              onClose();
            } catch (err) {
              console.error('[TaskDetail] Görev silme hatası:', err);
              Alert.alert('Hata', 'Görev silinirken bir hata oluştu');
            }
          }
        }
      ]
    );
  };

  if (loading || !formData) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Header
        title="Görev Detayı"
        onBackPress={onClose}
        rightComponent={
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <Text style={styles.deleteButtonText}>🗑</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Temel Bilgiler Kartı */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Temel Bilgiler</Text>
          
          {/* Başlık */}
          <View style={styles.field}>
            <Text style={styles.label}>Görev Başlığı</Text>
            <TextInput
              style={[
                styles.input,
                errors.title && styles.inputError
              ]}
              value={formData.title}
              onChangeText={(value) => updateField('title', value)}
              placeholder="Görev başlığını yazın..."
              maxLength={200}
            />
            {errors.title && (
              <Text style={styles.errorText}>{errors.title}</Text>
            )}
          </View>

          {/* Açıklama */}
          <View style={styles.field}>
            <Text style={styles.label}>Açıklama</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(value) => updateField('description', value)}
              placeholder="Görev açıklaması..."
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Durum ve Öncelik Kartı */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Durum ve Öncelik</Text>
          
          {/* Durum */}
          <View style={styles.field}>
            <Text style={styles.label}>Durum</Text>
            <View style={styles.statusContainer}>
              {getAllStatuses().map((status) => (
                <TouchableOpacity
                  key={status.value}
                  style={[
                    styles.statusButton,
                    formData.status === status.value && styles.statusButtonActive,
                    {
                      borderColor: getStatusColor(status.value, lightTheme),
                      backgroundColor: formData.status === status.value
                        ? getStatusColor(status.value, lightTheme) + '20'
                        : 'transparent'
                    }
                  ]}
                  onPress={() => updateField('status', status.value)}
                >
                  <Text style={[
                    styles.statusButtonText,
                    formData.status === status.value && {
                      color: getStatusColor(status.value, lightTheme)
                    }
                  ]}>
                    {status.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Öncelik */}
          <View style={styles.field}>
            <Text style={styles.label}>Öncelik</Text>
            <View style={styles.priorityContainer}>
              {getAllPriorities().map((priority) => (
                <TouchableOpacity
                  key={priority.value}
                  style={[
                    styles.priorityButton,
                    formData.priority === priority.value && styles.priorityButtonActive,
                    {
                      borderColor: getPriorityColor(priority.value, lightTheme),
                      backgroundColor: formData.priority === priority.value
                        ? getPriorityColor(priority.value, lightTheme) + '20'
                        : 'transparent'
                    }
                  ]}
                  onPress={() => updateField('priority', priority.value)}
                >
                  <Text style={[
                    styles.priorityButtonText,
                    formData.priority === priority.value && {
                      color: getPriorityColor(priority.value, lightTheme)
                    }
                  ]}>
                    {priority.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Tarihler Kartı */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tarihler</Text>
          
          {/* Başlangıç Tarihi */}
          <View style={styles.field}>
            <Text style={styles.label}>Başlangıç Tarihi</Text>
            <TextInput
              style={[
                styles.input,
                errors.start_date && styles.inputError
              ]}
              value={formData.start_date}
              onChangeText={(value) => updateField('start_date', value)}
              placeholder="YYYY-MM-DD"
              maxLength={10}
              keyboardType="numeric"
              editable={false}
            />
            {errors.start_date && (
              <Text style={styles.errorText}>{errors.start_date}</Text>
            )}
          </View>

          {/* Bitiş Tarihi */}
          <View style={styles.field}>
            <Text style={styles.label}>Vade Tarihi</Text>
            <TextInput
              style={[
                styles.input,
                errors.due_date && styles.inputError
              ]}
              value={formData.due_date}
              onChangeText={(value) => updateField('due_date', value)}
              placeholder="YYYY-MM-DD"
              maxLength={10}
              keyboardType="numeric"
            />
            {errors.due_date && (
              <Text style={styles.errorText}>{errors.due_date}</Text>
            )}
          </View>
        </View>

        {/* Liste Seçimi */}
        {lists.length > 0 && (
          <View style={styles.field}>
            <Text style={styles.label}>Liste</Text>
            <View style={styles.listContainer}>
              {lists.map((list) => (
                <TouchableOpacity
                  key={list.id}
                  style={[
                    styles.listButton,
                    formData.list_id === list.id && styles.listButtonActive
                  ]}
                  onPress={() => updateField('list_id', list.id)}
                >
                  <View style={[
                    styles.listColorDot,
                    { backgroundColor: list.color || lightTheme.colors.primary }
                  ]} />
                  <Text style={[
                    styles.listButtonText,
                    formData.list_id === list.id && styles.listButtonTextActive
                  ]}>
                    {list.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Etiketler */}
        {labels.length > 0 && (
          <View style={styles.field}>
            <Text style={styles.label}>Etiketler</Text>
            <View style={styles.labelsContainer}>
              {labels.map((label) => {
                const isSelected = formData.label_ids.includes(label.id);
                return (
                  <TouchableOpacity
                    key={label.id}
                    style={[
                      styles.labelChip,
                      isSelected && styles.labelChipActive,
                      {
                        borderColor: label.color || lightTheme.colors.primary,
                        backgroundColor: isSelected
                          ? (label.color || lightTheme.colors.primary) + '20'
                          : 'transparent'
                      }
                    ]}
                    onPress={() => toggleLabel(label.id)}
                  >
                    <Text style={[
                      styles.labelChipText,
                      isSelected && {
                        color: label.color || lightTheme.colors.primary
                      }
                    ]}>
                      {label.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Alt Görevler Paneli */}
        <SubtasksPanel 
          taskId={taskId} 
          onStatsUpdate={handleSubtasksStatsUpdate}
        />

        {/* Kaydet Butonu */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              saving && styles.saveButtonDisabled
            ]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Tamamlama Banner'ı */}
      {showCompletionBanner && (
        <View style={styles.completionBanner}>
          <Text style={styles.completionBannerText}>
            Tüm alt görevler tamamlandı. Görevi Done yap?
          </Text>
          <View style={styles.completionBannerActions}>
            <TouchableOpacity
              style={styles.completionBannerButton}
              onPress={() => {
                setShowCompletionBanner(false);
                setBannerDismissed(true);
              }}
            >
              <Text style={styles.completionBannerButtonText}>Hayır</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.completionBannerButton, styles.completionBannerButtonPrimary]}
              onPress={handleMarkTaskDone}
            >
              <Text style={[styles.completionBannerButtonText, styles.completionBannerButtonTextPrimary]}>
                Evet
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

// Stilleri
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.backgroundSecondary,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...lightTheme.typography.body,
    color: lightTheme.colors.textSecondary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: lightTheme.spacing.md,
    paddingBottom: lightTheme.spacing.xxl,
  },
  card: {
    backgroundColor: lightTheme.colors.surface,
    borderRadius: lightTheme.ui.borderRadius.lg,
    padding: lightTheme.spacing.md,
    marginBottom: lightTheme.spacing.md,
    ...lightTheme.ui.shadow.sm,
  },
  cardTitle: {
    ...lightTheme.typography.h4,
    color: lightTheme.colors.text,
    marginBottom: lightTheme.spacing.md,
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    width: lightTheme.ui.minTouchTarget,
    height: lightTheme.ui.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 18,
  },
  field: {
    marginBottom: lightTheme.spacing.lg,
  },
  label: {
    ...lightTheme.typography.label,
    color: lightTheme.colors.text,
    marginBottom: lightTheme.spacing.sm,
  },
  input: {
    ...lightTheme.typography.body,
    backgroundColor: lightTheme.colors.surface,
    borderWidth: 1,
    borderColor: lightTheme.colors.border,
    borderRadius: lightTheme.ui.borderRadius.md,
    paddingHorizontal: lightTheme.spacing.sm,
    paddingVertical: lightTheme.spacing.sm,
    minHeight: lightTheme.ui.minTouchTarget,
    color: lightTheme.colors.text,
  },
  inputError: {
    borderColor: lightTheme.colors.error,
  },
  textArea: {
    minHeight: 100,
    maxHeight: 150,
  },
  errorText: {
    ...lightTheme.typography.bodySmall,
    color: lightTheme.colors.error,
    marginTop: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: lightTheme.spacing.sm,
  },
  statusButton: {
    paddingVertical: lightTheme.spacing.sm,
    paddingHorizontal: lightTheme.spacing.md,
    borderWidth: 1,
    borderRadius: lightTheme.ui.borderRadius.md,
    minHeight: lightTheme.ui.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusButtonActive: {
    // Dinamik stil
  },
  statusButtonText: {
    ...lightTheme.typography.label,
    color: lightTheme.colors.textSecondary,
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: lightTheme.spacing.sm,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: lightTheme.spacing.sm,
    paddingHorizontal: lightTheme.spacing.sm,
    borderWidth: 1,
    borderRadius: lightTheme.ui.borderRadius.md,
    alignItems: 'center',
    minHeight: lightTheme.ui.minTouchTarget,
    justifyContent: 'center',
  },
  priorityButtonActive: {
    // Dinamik stil
  },
  priorityButtonText: {
    ...lightTheme.typography.label,
    color: lightTheme.colors.textSecondary,
  },
  listContainer: {
    gap: lightTheme.spacing.sm,
  },
  listButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: lightTheme.spacing.sm,
    paddingHorizontal: lightTheme.spacing.sm,
    borderWidth: 1,
    borderColor: lightTheme.colors.border,
    borderRadius: lightTheme.ui.borderRadius.md,
    backgroundColor: lightTheme.colors.surface,
    minHeight: lightTheme.ui.minTouchTarget,
  },
  listButtonActive: {
    borderColor: lightTheme.colors.primary,
    backgroundColor: lightTheme.colors.primary + '10',
  },
  listColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: lightTheme.spacing.sm,
  },
  listButtonText: {
    ...lightTheme.typography.body,
    color: lightTheme.colors.text,
  },
  listButtonTextActive: {
    color: lightTheme.colors.primary,
    fontWeight: '600',
  },
  labelsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: lightTheme.spacing.sm,
  },
  labelChip: {
    paddingVertical: 6,
    paddingHorizontal: lightTheme.spacing.sm,
    borderWidth: 1,
    borderRadius: lightTheme.ui.borderRadius.full,
  },
  labelChipActive: {
    // Dinamik stil
  },
  labelChipText: {
    ...lightTheme.typography.labelSmall,
    color: lightTheme.colors.textSecondary,
  },
  // Completion Banner stilleri
  completionBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: lightTheme.colors.success,
    paddingVertical: lightTheme.spacing.md,
    paddingHorizontal: lightTheme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...lightTheme.ui.shadow.lg,
  },
  completionBannerText: {
    ...lightTheme.typography.body,
    color: 'white',
    flex: 1,
    marginRight: lightTheme.spacing.md,
  },
  completionBannerActions: {
    flexDirection: 'row',
    gap: lightTheme.spacing.sm,
  },
  completionBannerButton: {
    paddingVertical: lightTheme.spacing.sm,
    paddingHorizontal: lightTheme.spacing.md,
    borderRadius: lightTheme.ui.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    minHeight: lightTheme.ui.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  completionBannerButtonPrimary: {
    backgroundColor: 'white',
  },
  completionBannerButtonText: {
    ...lightTheme.typography.label,
    color: 'white',
  },
  completionBannerButtonTextPrimary: {
    color: lightTheme.colors.success,
  },
  actions: {
    marginTop: lightTheme.spacing.xl,
  },
  saveButton: {
    backgroundColor: lightTheme.colors.primary,
    paddingVertical: lightTheme.spacing.md,
    paddingHorizontal: lightTheme.spacing.lg,
    borderRadius: lightTheme.ui.borderRadius.md,
    alignItems: 'center',
    minHeight: lightTheme.ui.minTouchTarget,
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: lightTheme.colors.textDisabled,
  },
  saveButtonText: {
    ...lightTheme.typography.button,
    color: lightTheme.colors.surface,
  },
});
