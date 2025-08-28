/**
 * SubtasksPanel - Alt görevler yönetim paneli
 * Görüntüle, ekle, yeniden adlandır, tamamla/geri al, sil, sırala
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Animated,
  StyleSheet,
  AccessibilityInfo,
} from 'react-native';

import { SubtasksRepository, type Subtask } from '../../../../src/database';
import { lightTheme } from '../../../theme/theme';

interface SubtasksPanelProps {
  taskId: string;
  onStatsUpdate?: (stats: { total: number; done: number }) => void;
}

interface SubtaskItemProps {
  subtask: Subtask;
  isReorderMode: boolean;
  isFirst: boolean;
  isLast: boolean;
  onToggleDone: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
}

// Alt görev satırı bileşeni
const SubtaskItem = React.memo<SubtaskItemProps>(({
  subtask,
  isReorderMode,
  isFirst,
  isLast,
  onToggleDone,
  onRename,
  onDelete,
  onMoveUp,
  onMoveDown,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(subtask.title);
  const editInputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleStartEdit = () => {
    setEditTitle(subtask.title);
    setIsEditing(true);
    setTimeout(() => editInputRef.current?.focus(), 100);
  };

  const handleCancelEdit = () => {
    setEditTitle(subtask.title);
    setIsEditing(false);
  };

  const handleSubmitEdit = () => {
    const trimmedTitle = editTitle.trim();
    if (trimmedTitle && trimmedTitle !== subtask.title) {
      onRename(subtask.id, trimmedTitle);
    }
    setIsEditing(false);
  };

  const handleLongPress = () => {
    if (!isReorderMode && !isEditing) {
      handleStartEdit();
    }
  };

  const showContextMenu = () => {
    if (isEditing || isReorderMode) return;

    Alert.alert(
      'Alt Görev İşlemleri',
      `"${subtask.title}"`,
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Yeniden Adlandır', onPress: handleStartEdit },
        { text: 'Üste Taşı', onPress: () => onMoveUp(subtask.id) },
        { text: 'Alta Taşı', onPress: () => onMoveDown(subtask.id) },
        { text: 'Sil', onPress: () => onDelete(subtask.id), style: 'destructive' },
      ]
    );
  };

  // Reduced motion kontrolü
  const [reducedMotion, setReducedMotion] = useState(false);
  
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReducedMotion)
      .catch(() => setReducedMotion(false));
  }, []);

  const animateAction = (callback: () => void) => {
    if (reducedMotion) {
      callback();
      return;
    }

    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.7,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    callback();
  };

  return (
    <Animated.View style={[styles.subtaskRow, { opacity: fadeAnim }]}>
      {/* Checkbox */}
      <TouchableOpacity
        style={styles.checkbox}
        onPress={() => animateAction(() => onToggleDone(subtask.id))}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: subtask.done === 1 }}
        accessibilityLabel={`${subtask.title} ${subtask.done === 1 ? 'tamamlandı' : 'tamamlanmadı'}`}
      >
        <View style={[
          styles.checkboxInner,
          subtask.done === 1 && styles.checkboxChecked
        ]}>
          {subtask.done === 1 && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>

      {/* Başlık */}
      <View style={styles.titleContainer}>
        {isEditing ? (
          <TextInput
            ref={editInputRef}
            style={[styles.titleInput, styles.titleText]}
            value={editTitle}
            onChangeText={setEditTitle}
            onSubmitEditing={handleSubmitEdit}
            onBlur={handleCancelEdit}
            placeholder="Alt görev başlığı..."
            maxLength={200}
            selectTextOnFocus
          />
        ) : (
          <TouchableOpacity
            style={styles.titleTouchable}
            onPress={() => !isReorderMode && animateAction(() => onToggleDone(subtask.id))}
            onLongPress={handleLongPress}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.titleText,
              subtask.done === 1 && styles.titleCompleted
            ]}>
              {subtask.title}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Sağ taraf kontrolları */}
      <View style={styles.rightControls}>
        {isReorderMode ? (
          <View style={styles.reorderControls}>
            <TouchableOpacity
              style={[styles.reorderButton, isFirst && styles.reorderButtonDisabled]}
              onPress={() => !isFirst && onMoveUp(subtask.id)}
              disabled={isFirst}
            >
              <Text style={[styles.reorderButtonText, isFirst && styles.reorderButtonTextDisabled]}>▲</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.reorderButton, isLast && styles.reorderButtonDisabled]}
              onPress={() => !isLast && onMoveDown(subtask.id)}
              disabled={isLast}
            >
              <Text style={[styles.reorderButtonText, isLast && styles.reorderButtonTextDisabled]}>▼</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {!isEditing && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={handleStartEdit}
              >
                <Text style={styles.editButtonText}>✏️</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.menuButton}
              onPress={showContextMenu}
            >
              <Text style={styles.menuButtonText}>⋯</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </Animated.View>
  );
});

export const SubtasksPanel: React.FC<SubtasksPanelProps> = ({ taskId, onStatsUpdate }) => {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [stats, setStats] = useState({ total: 0, done: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [showError, setShowError] = useState(false);

  const addInputRef = useRef<TextInput>(null);

  // Veri yükleme
  const loadSubtasks = useCallback(async () => {
    try {
      setError(null);
      const [subtasksData, statsData] = await Promise.all([
        SubtasksRepository.listByTask(taskId),
        SubtasksRepository.getStats(taskId)
      ]);
      
      setSubtasks(subtasksData);
      setStats(statsData);
      
      // Parent'a stats güncellemesini bildir
      onStatsUpdate?.(statsData);
    } catch (err) {
      console.error('[SubtasksPanel] Yükleme hatası:', err);
      setError('Alt görevler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [taskId, onStatsUpdate]);

  useEffect(() => {
    loadSubtasks();
  }, [loadSubtasks]);

  // Alt görev ekleme
  const handleAddSubtask = async () => {
    const title = newSubtaskTitle.trim();
    if (!title) {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
      return;
    }

    try {
      setIsAddingSubtask(true);
      await SubtasksRepository.add(taskId, title);
      setNewSubtaskTitle('');
      await loadSubtasks();
    } catch (err) {
      console.error('[SubtasksPanel] Ekleme hatası:', err);
      Alert.alert('Hata', 'Alt görev eklenemedi');
    } finally {
      setIsAddingSubtask(false);
    }
  };

  // Tamamlama durumu değiştir
  const handleToggleDone = async (subtaskId: string) => {
    try {
      // Optimistic update
      setSubtasks(prev => prev.map(s => 
        s.id === subtaskId ? { ...s, done: s.done === 1 ? 0 : 1 } : s
      ));
      
      // İstatistikleri güncelle
      const updatedSubtask = subtasks.find(s => s.id === subtaskId);
      if (updatedSubtask) {
        const newDone = updatedSubtask.done === 1 ? 0 : 1;
        setStats(prev => ({
          total: prev.total,
          done: newDone === 1 ? prev.done + 1 : prev.done - 1
        }));
      }

      await SubtasksRepository.toggleDone(subtaskId);
      
      // Stats'ı tekrar yükle ve parent'a bildir
      const newStats = await SubtasksRepository.getStats(taskId);
      setStats(newStats);
      onStatsUpdate?.(newStats);
    } catch (err) {
      console.error('[SubtasksPanel] Toggle hatası:', err);
      // Hata durumunda veriyi yeniden yükle
      await loadSubtasks();
      Alert.alert('Hata', 'Alt görev durumu güncellenemedi');
    }
  };

  // Yeniden adlandırma
  const handleRename = async (subtaskId: string, newTitle: string) => {
    try {
      await SubtasksRepository.rename(subtaskId, newTitle);
      await loadSubtasks();
    } catch (err) {
      console.error('[SubtasksPanel] Yeniden adlandırma hatası:', err);
      Alert.alert('Hata', 'Alt görev yeniden adlandırılamadı');
    }
  };

  // Silme
  const handleDelete = (subtaskId: string) => {
    const subtask = subtasks.find(s => s.id === subtaskId);
    if (!subtask) return;

    Alert.alert(
      'Alt Görevi Sil',
      `"${subtask.title}" alt görevini silmek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await SubtasksRepository.remove(subtaskId);
              await loadSubtasks();
            } catch (err) {
              console.error('[SubtasksPanel] Silme hatası:', err);
              Alert.alert('Hata', 'Alt görev silinemedi');
            }
          }
        }
      ]
    );
  };

  // Yukarı taşı
  const handleMoveUp = async (subtaskId: string) => {
    const currentIndex = subtasks.findIndex(s => s.id === subtaskId);
    if (currentIndex <= 0) return;

    const targetSubtask = subtasks[currentIndex - 1];
    
    try {
      await SubtasksRepository.move({
        subtaskId,
        afterId: targetSubtask.id
      });
      await loadSubtasks();
    } catch (err) {
      console.error('[SubtasksPanel] Yukarı taşıma hatası:', err);
      Alert.alert('Hata', 'Alt görev taşınamadı');
    }
  };

  // Aşağı taşı
  const handleMoveDown = async (subtaskId: string) => {
    const currentIndex = subtasks.findIndex(s => s.id === subtaskId);
    if (currentIndex >= subtasks.length - 1) return;

    const targetSubtask = subtasks[currentIndex + 1];
    
    try {
      await SubtasksRepository.move({
        subtaskId,
        beforeId: targetSubtask.id
      });
      await loadSubtasks();
    } catch (err) {
      console.error('[SubtasksPanel] Aşağı taşıma hatası:', err);
      Alert.alert('Hata', 'Alt görev taşınamadı');
    }
  };

  // Tekrar deneme
  const handleRetry = () => {
    setLoading(true);
    loadSubtasks();
  };

  // İlerleme yüzdesi hesaplama
  const progressPercentage = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  // Yükleniyor durumu
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Alt görevler yükleniyor...</Text>
      </View>
    );
  }

  // Hata durumu
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Tekrar Dene</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Başlık satırı */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Alt Görevler</Text>
          <View style={styles.progressBadge}>
            <Text style={styles.progressText}>
              {stats.done}/{stats.total} ({progressPercentage}%)
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.editModeButton}
          onPress={() => setIsReorderMode(!isReorderMode)}
          disabled={subtasks.length === 0}
        >
          <Text style={[
            styles.editModeButtonText,
            subtasks.length === 0 && styles.editModeButtonTextDisabled
          ]}>
            {isReorderMode ? 'Bitti' : 'Düzenle'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Hata mesajı */}
      {showError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>Alt görev başlığı boş olamaz</Text>
        </View>
      )}

      {/* Alt görevler listesi */}
      {subtasks.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Hiç alt görev yok</Text>
          <Text style={styles.emptyStateSubtext}>Aşağıdan yeni alt görev ekleyebilirsiniz</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {subtasks.map((subtask, index) => (
            <SubtaskItem
              key={subtask.id}
              subtask={subtask}
              isReorderMode={isReorderMode}
              isFirst={index === 0}
              isLast={index === subtasks.length - 1}
              onToggleDone={handleToggleDone}
              onRename={handleRename}
              onDelete={handleDelete}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
            />
          ))}
        </View>
      )}

      {/* Alt görev ekleme */}
      {!isReorderMode && (
        <View style={styles.addSection}>
          <View style={styles.addInputContainer}>
            <TextInput
              ref={addInputRef}
              style={styles.addInput}
              value={newSubtaskTitle}
              onChangeText={setNewSubtaskTitle}
              onSubmitEditing={handleAddSubtask}
              placeholder="Yeni alt görev ekle..."
              maxLength={200}
              editable={!isAddingSubtask}
            />
            <TouchableOpacity
              style={[styles.addButton, isAddingSubtask && styles.addButtonDisabled]}
              onPress={handleAddSubtask}
              disabled={isAddingSubtask || !newSubtaskTitle.trim()}
            >
              <Text style={[
                styles.addButtonText,
                (!newSubtaskTitle.trim() || isAddingSubtask) && styles.addButtonTextDisabled
              ]}>
                {isAddingSubtask ? '...' : '✓'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: lightTheme.colors.surface,
    borderRadius: lightTheme.ui.borderRadius.md,
    padding: lightTheme.spacing.md,
    marginVertical: lightTheme.spacing.md,
    ...lightTheme.ui.shadow.sm,
  },
  
  // Başlık bölümü
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: lightTheme.spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    ...lightTheme.typography.h4,
    color: lightTheme.colors.text,
    marginRight: lightTheme.spacing.sm,
  },
  progressBadge: {
    backgroundColor: lightTheme.colors.backgroundSecondary,
    paddingHorizontal: lightTheme.spacing.sm,
    paddingVertical: 2,
    borderRadius: lightTheme.ui.borderRadius.sm,
  },
  progressText: {
    ...lightTheme.typography.labelSmall,
    color: lightTheme.colors.textSecondary,
  },
  editModeButton: {
    minHeight: lightTheme.ui.minTouchTarget,
    paddingHorizontal: lightTheme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editModeButtonText: {
    ...lightTheme.typography.label,
    color: lightTheme.colors.primary,
  },
  editModeButtonTextDisabled: {
    color: lightTheme.colors.textDisabled,
  },

  // Hata banner
  errorBanner: {
    backgroundColor: lightTheme.colors.error,
    paddingHorizontal: lightTheme.spacing.sm,
    paddingVertical: lightTheme.spacing.xs,
    borderRadius: lightTheme.ui.borderRadius.sm,
    marginBottom: lightTheme.spacing.sm,
  },
  errorBannerText: {
    ...lightTheme.typography.bodySmall,
    color: 'white',
    textAlign: 'center',
  },

  // Liste
  list: {
    maxHeight: 300, // Maksimum yükseklik sınırı
  },

  // Boş durum
  emptyState: {
    alignItems: 'center',
    paddingVertical: lightTheme.spacing.lg,
  },
  emptyStateText: {
    ...lightTheme.typography.body,
    color: lightTheme.colors.textSecondary,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    ...lightTheme.typography.bodySmall,
    color: lightTheme.colors.textTertiary,
    textAlign: 'center',
    marginTop: lightTheme.spacing.xs,
  },

  // Alt görev satırı
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: lightTheme.spacing.sm,
    minHeight: 56, // Minimum dokunma hedefi
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.border,
  },

  // Checkbox
  checkbox: {
    width: lightTheme.ui.minTouchTarget,
    height: lightTheme.ui.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: lightTheme.spacing.sm,
  },
  checkboxInner: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: lightTheme.colors.border,
    borderRadius: lightTheme.ui.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.surface,
  },
  checkboxChecked: {
    backgroundColor: lightTheme.colors.success,
    borderColor: lightTheme.colors.success,
  },
  checkmark: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Başlık
  titleContainer: {
    flex: 1,
    marginRight: lightTheme.spacing.sm,
  },
  titleTouchable: {
    paddingVertical: lightTheme.spacing.xs,
    paddingHorizontal: lightTheme.spacing.xs,
    minHeight: lightTheme.ui.minTouchTarget,
    justifyContent: 'center',
  },
  titleText: {
    ...lightTheme.typography.body,
    color: lightTheme.colors.text,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: lightTheme.colors.textSecondary,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: lightTheme.colors.primary,
    borderRadius: lightTheme.ui.borderRadius.sm,
    paddingHorizontal: lightTheme.spacing.sm,
    paddingVertical: lightTheme.spacing.xs,
    backgroundColor: lightTheme.colors.background,
  },

  // Sağ taraf kontroller
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    width: lightTheme.ui.minTouchTarget,
    height: lightTheme.ui.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    fontSize: 16,
  },
  menuButton: {
    width: lightTheme.ui.minTouchTarget,
    height: lightTheme.ui.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButtonText: {
    fontSize: 18,
    color: lightTheme.colors.textSecondary,
  },

  // Sıralama kontrolleri
  reorderControls: {
    flexDirection: 'row',
  },
  reorderButton: {
    width: lightTheme.ui.minTouchTarget,
    height: lightTheme.ui.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reorderButtonDisabled: {
    opacity: 0.3,
  },
  reorderButtonText: {
    fontSize: 16,
    color: lightTheme.colors.textSecondary,
  },
  reorderButtonTextDisabled: {
    color: lightTheme.colors.textDisabled,
  },

  // Ekleme bölümü
  addSection: {
    marginTop: lightTheme.spacing.md,
  },
  addInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addInput: {
    ...lightTheme.typography.body,
    flex: 1,
    backgroundColor: lightTheme.colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: lightTheme.colors.border,
    borderRadius: lightTheme.ui.borderRadius.md,
    paddingHorizontal: lightTheme.spacing.sm,
    paddingVertical: lightTheme.spacing.sm,
    minHeight: lightTheme.ui.minTouchTarget,
    color: lightTheme.colors.text,
    marginRight: lightTheme.spacing.sm,
  },
  addButton: {
    width: lightTheme.ui.minTouchTarget,
    height: lightTheme.ui.minTouchTarget,
    backgroundColor: lightTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: lightTheme.ui.borderRadius.md,
  },
  addButtonDisabled: {
    backgroundColor: lightTheme.colors.textDisabled,
  },
  addButtonText: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },
  addButtonTextDisabled: {
    color: lightTheme.colors.textTertiary,
  },

  // Durum metinleri
  loadingText: {
    ...lightTheme.typography.body,
    color: lightTheme.colors.textSecondary,
    textAlign: 'center',
    paddingVertical: lightTheme.spacing.lg,
  },
  errorText: {
    ...lightTheme.typography.body,
    color: lightTheme.colors.error,
    textAlign: 'center',
    marginBottom: lightTheme.spacing.md,
  },
  retryButton: {
    backgroundColor: lightTheme.colors.primary,
    paddingHorizontal: lightTheme.spacing.md,
    paddingVertical: lightTheme.spacing.sm,
    borderRadius: lightTheme.ui.borderRadius.md,
    alignSelf: 'center',
  },
  retryButtonText: {
    ...lightTheme.typography.button,
    color: 'white',
  },
});
