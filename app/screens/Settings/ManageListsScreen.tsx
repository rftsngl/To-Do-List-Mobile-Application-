/**
 * ManageListsScreen - Liste yönetimi ekranı
 * Listeleme, oluşturma, düzenleme, silme işlemleri
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Components  
import { Header } from '../../navigation/Stack';

// Database
import {
  ListsRepository,
  TasksRepository,
  type List,
} from '../../../src/database';

// Theme
import { lightTheme } from '../../theme/theme';

// Renk paleti
const COLOR_PALETTE = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6B7280', // Gray
];

interface ListWithStats extends List {
  task_count: number;
  completed_count: number;
}

type EditingList = {
  id: string;
  name: string;
  color: string | null;
} | null;

export const ManageListsScreen: React.FC = () => {
  const safeAreaInsets = useSafeAreaInsets();
  const [lists, setLists] = useState<ListWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingList, setEditingList] = useState<EditingList>(null);
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [newListForm, setNewListForm] = useState({
    name: '',
    color: COLOR_PALETTE[0],
  });

  // Listeleri yükle
  const loadLists = useCallback(async () => {
    try {
      setError(null);
      const listsData = await ListsRepository.getAllWithTaskCounts();
      setLists(listsData);
    } catch (err) {
      console.error('[ManageLists] Listeleme hatası:', err);
      setError('Listeler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  // Yeni liste oluştur
  const handleCreateList = async () => {
    if (!newListForm.name.trim()) {
      Alert.alert('Hata', 'Liste adı boş olamaz');
      return;
    }

    try {
      await ListsRepository.create({
        name: newListForm.name.trim(),
        color: newListForm.color,
      });

      // Formu temizle
      setNewListForm({
        name: '',
        color: COLOR_PALETTE[0],
      });
      setShowNewListModal(false);
      
      // Listeyi yenile
      await loadLists();
      
      console.log('[ManageLists] ✅ Yeni liste oluşturuldu');
    } catch (err) {
      console.error('[ManageLists] Liste oluşturma hatası:', err);
      Alert.alert('Hata', 'Liste oluşturulurken hata oluştu');
    }
  };

  // Liste düzenle
  const handleEditList = async (updatedList: EditingList) => {
    if (!updatedList || !updatedList.name.trim()) {
      Alert.alert('Hata', 'Liste adı boş olamaz');
      return;
    }

    try {
      await ListsRepository.update(updatedList.id, {
        name: updatedList.name.trim(),
        color: updatedList.color,
      });

      setEditingList(null);
      await loadLists();
      
      console.log('[ManageLists] ✅ Liste güncellendi');
    } catch (err) {
      console.error('[ManageLists] Liste güncelleme hatası:', err);
      Alert.alert('Hata', 'Liste güncellenirken hata oluştu');
    }
  };

  // Liste sil
  const handleDeleteList = async (list: ListWithStats) => {
    const taskCount = await TasksRepository.countByList(list.id);
    
    if (taskCount === 0) {
      // Görev yok, direkt sil
      Alert.alert(
        'Liste Sil',
        `"${list.name}" listesini silmek istediğinizden emin misiniz?`,
        [
          { text: 'İptal', style: 'cancel' },
          {
            text: 'Sil',
            style: 'destructive',
            onPress: () => performDelete(list.id),
          },
        ]
      );
    } else {
      // Görevler var, seçenek sun
      showDeleteOptionsForListWithTasks(list, taskCount);
    }
  };

  // Görevli liste için silme seçenekleri
  const showDeleteOptionsForListWithTasks = (list: ListWithStats, taskCount: number) => {
    Alert.alert(
      'Liste Görevlerle Birlikte Sil',
      `"${list.name}" listesinde ${taskCount} görev var. Ne yapmak istiyorsunuz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Görevleri Taşı',
          onPress: () => showMoveTasksOptions(list),
        },
        {
          text: 'Hepsini Sil',
          style: 'destructive',
          onPress: () => confirmDeleteWithTasks(list, taskCount),
        },
      ]
    );
  };

  // Görev taşıma seçenekleri
  const showMoveTasksOptions = (sourceList: ListWithStats) => {
    const targetLists = lists.filter(l => l.id !== sourceList.id);
    
    if (targetLists.length === 0) {
      Alert.alert('Hata', 'Görevleri taşıyacak başka liste bulunamadı');
      return;
    }

    // Basit alert ile hedef liste seç (daha advanced bir UI olabilir)
    const options = targetLists.map((list, index) => ({
      text: list.name,
      onPress: () => moveTasksAndDeleteList(sourceList.id, list.id, sourceList.name, list.name),
    }));

    Alert.alert(
      'Hedef Liste Seç',
      `"${sourceList.name}" listesindeki görevler hangi listeye taşınsın?`,
      [
        { text: 'İptal', style: 'cancel' },
        ...options,
      ]
    );
  };

  // Görevleri taşıyıp listeyi sil
  const moveTasksAndDeleteList = async (fromListId: string, toListId: string, fromListName: string, toListName: string) => {
    try {
      // Görevleri taşı
      await TasksRepository.moveAll({ fromListId, toListId });
      
      // Listeyi sil
      ListsRepository.delete(fromListId);
      
      // Listeyi yenile
      await loadLists();
      
      Alert.alert(
        'Başarılı',
        `"${fromListName}" listesindeki görevler "${toListName}" listesine taşındı ve liste silindi.`
      );
      
      console.log('[ManageLists] ✅ Liste taşıma ve silme başarılı');
    } catch (err) {
      console.error('[ManageLists] Taşıma ve silme hatası:', err);
      Alert.alert('Hata', 'İşlem sırasında hata oluştu');
    }
  };

  // Görevlerle birlikte silmeyi onayla
  const confirmDeleteWithTasks = (list: ListWithStats, taskCount: number) => {
    Alert.alert(
      'Kalıcı Silme Onayı',
      `⚠️ DİKKAT: "${list.name}" listesi ve içindeki ${taskCount} görev KALICI olarak silinecek. Bu işlem geri alınamaz!`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'SİL',
          style: 'destructive',
          onPress: () => performDelete(list.id),
        },
      ]
    );
  };

  // Silme işlemini gerçekleştir
  const performDelete = async (listId: string) => {
    try {
      await ListsRepository.delete(listId);
      await loadLists();
      console.log('[ManageLists] ✅ Liste silindi');
    } catch (err) {
      console.error('[ManageLists] Silme hatası:', err);
      Alert.alert('Hata', 'Liste silinirken hata oluştu');
    }
  };

  // Liste item'ı render et
  const renderListItem = ({ item }: { item: ListWithStats }) => {
    const isEditing = editingList?.id === item.id;
    
    return (
      <View style={styles.listCard}>
        {/* İçerik */}
          {isEditing ? (
            // Düzenleme modu
            <View style={styles.editForm}>
              <Text style={styles.editTitle}>Liste Düzenle</Text>
              <TextInput
                style={styles.editNameInput}
                value={editingList?.name}
                onChangeText={(text) => 
                  setEditingList(prev => prev ? { ...prev, name: text } : null)
                }
                placeholder="Liste adı"
                autoFocus
                selectTextOnFocus
              />
              
              {/* Renk seçici */}
              <Text style={styles.colorPickerLabel}>Renk:</Text>
              <View style={styles.colorPicker}>
                {COLOR_PALETTE.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      editingList?.color === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => 
                      setEditingList(prev => prev ? { ...prev, color } : null)
                    }
                  />
                ))}
              </View>

              {/* Düzenleme butonları */}
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={styles.editCancelButton}
                  onPress={() => setEditingList(null)}
                >
                  <Text style={styles.editCancelText}>İptal</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.editSaveButton}
                  onPress={() => handleEditList(editingList)}
                >
                  <Text style={styles.editSaveText}>Kaydet</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // Normal görünüm
            <>
              <View style={styles.listCardHeader}>
                <View style={styles.listInfo}>
                  <View style={[
                    styles.colorIndicator,
                    { backgroundColor: item.color || lightTheme.colors.primary }
                  ]} />
                  <View style={styles.listContent}>
                    <Text style={styles.listName}>{item.name}</Text>
                    <Text style={styles.listStats}>
                      {item.task_count} görev
                      {item.completed_count > 0 && ` • ${item.completed_count} tamamlandı`}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.listActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => setEditingList({
                      id: item.id,
                      name: item.name,
                      color: item.color,
                    })}
                  >
                    <Text style={styles.actionButtonText}>✏️</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteList(item)}
                  >
                    <Text style={styles.actionButtonText}>🗑</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Progress bar */}
              {item.task_count > 0 && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill,
                        { 
                          width: `${(item.completed_count / item.task_count) * 100}%`,
                          backgroundColor: item.color || lightTheme.colors.primary 
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {Math.round((item.completed_count / item.task_count) * 100)}%
                  </Text>
                </View>
              )}
            </>
          )}
        }
      </View>
    );
  };

  // Boş durum
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📝</Text>
      <Text style={styles.emptyTitle}>Liste Yok</Text>
      <Text style={styles.emptyMessage}>
        Henüz hiç liste oluşturmadınız. Sağ üstteki "+" butonuna dokunarak ilk listenizi oluşturun.
      </Text>
    </View>
  );

  // Hata durumu
  if (error) {
    return (
      <View style={styles.container}>
        <Header 
          title="Listeler" 
          showBackButton={true}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Bir hata oluştu</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadLists}
          >
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header 
        title="Listeler"
        showBackButton={true}
        rightComponent={
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowNewListModal(true)}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        }
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={lightTheme.colors.primary} />
          <Text style={styles.loadingText}>Listeler yükleniyor...</Text>
        </View>
      ) : (
        <FlatList
          data={lists}
          renderItem={renderListItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={[
            { paddingBottom: lightTheme.spacing.lg },
            lists.length === 0 ? styles.listEmpty : undefined
          ]}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Yeni Liste Modal */}
      <Modal
        visible={showNewListModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowNewListModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Yeni Liste</Text>
            
            <TextInput
              style={styles.modalInput}
              value={newListForm.name}
              onChangeText={(text) => setNewListForm(prev => ({ ...prev, name: text }))}
              placeholder="Liste adı"
              autoFocus
              maxLength={50}
            />

            {/* Renk seçici */}
            <Text style={styles.modalLabel}>Renk:</Text>
            <View style={styles.modalColorPicker}>
              {COLOR_PALETTE.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.modalColorOption,
                    { backgroundColor: color },
                    newListForm.color === color && styles.modalColorOptionSelected,
                  ]}
                  onPress={() => setNewListForm(prev => ({ ...prev, color }))}
                />
              ))}
            </View>

            {/* Modal butonları */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowNewListModal(false);
                  setNewListForm({ name: '', color: COLOR_PALETTE[0] });
                }}
              >
                <Text style={styles.modalCancelText}>İptal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalCreateButton}
                onPress={handleCreateList}
              >
                <Text style={styles.modalCreateText}>Oluştur</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Stilleri
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.backgroundSecondary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...lightTheme.typography.body,
    color: lightTheme.colors.textSecondary,
    marginTop: lightTheme.spacing.md,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: lightTheme.spacing.xl,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: lightTheme.spacing.md,
  },
  errorTitle: {
    ...lightTheme.typography.h3,
    color: lightTheme.colors.error,
    marginBottom: lightTheme.spacing.sm,
    textAlign: 'center',
  },
  errorMessage: {
    ...lightTheme.typography.body,
    color: lightTheme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: lightTheme.spacing.lg,
  },
  retryButton: {
    backgroundColor: lightTheme.colors.primary,
    paddingHorizontal: lightTheme.spacing.lg,
    paddingVertical: lightTheme.spacing.md,
    borderRadius: lightTheme.ui.borderRadius.md,
  },
  retryButtonText: {
    ...lightTheme.typography.button,
    color: lightTheme.colors.surface,
  },
  addButton: {
    width: lightTheme.ui.minTouchTarget,
    height: lightTheme.ui.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: lightTheme.ui.borderRadius.sm,
  },
  addButtonText: {
    fontSize: 24,
    color: lightTheme.colors.primary,
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: lightTheme.spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: lightTheme.spacing.md,
  },
  emptyTitle: {
    ...lightTheme.typography.h3,
    color: lightTheme.colors.textSecondary,
    marginBottom: lightTheme.spacing.sm,
    textAlign: 'center',
  },
  emptyMessage: {
    ...lightTheme.typography.body,
    color: lightTheme.colors.textTertiary,
    textAlign: 'center',
    lineHeight: 24,
  },
  listCard: {
    backgroundColor: lightTheme.colors.surface,
    borderRadius: lightTheme.ui.borderRadius.lg,
    marginHorizontal: lightTheme.spacing.md,
    marginVertical: lightTheme.spacing.sm,
    padding: lightTheme.spacing.md,
    ...lightTheme.ui.shadow.sm,
  },
  listCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: lightTheme.spacing.md,
  },
  listContent: {
    flex: 1,
    marginRight: lightTheme.spacing.sm,
  },
  listName: {
    ...lightTheme.typography.body,
    color: lightTheme.colors.text,
    fontWeight: '500',
    marginBottom: 2,
  },
  listStats: {
    ...lightTheme.typography.bodySmall,
    color: lightTheme.colors.textSecondary,
  },
  listActions: {
    flexDirection: 'row',
    gap: lightTheme.spacing.sm,
  },
  progressContainer: {
    marginTop: lightTheme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: lightTheme.spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: lightTheme.colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    ...lightTheme.typography.bodySmall,
    color: lightTheme.colors.textSecondary,
    fontWeight: '600',
    minWidth: 35,
  },
  editTitle: {
    ...lightTheme.typography.h4,
    color: lightTheme.colors.text,
    marginBottom: lightTheme.spacing.md,
    fontSize: 16,
    fontWeight: '600',
  },
  colorPickerLabel: {
    ...lightTheme.typography.label,
    color: lightTheme.colors.text,
    marginBottom: lightTheme.spacing.sm,
    marginTop: lightTheme.spacing.md,
  },
  actionButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: lightTheme.ui.borderRadius.sm,
    backgroundColor: lightTheme.colors.surfaceSecondary,
  },
  actionButtonText: {
    fontSize: 16,
  },
  
  // Düzenleme stilleri
  editForm: {
    flex: 1,
  },
  editNameInput: {
    ...lightTheme.typography.body,
    backgroundColor: lightTheme.colors.surface,
    borderWidth: 1,
    borderColor: lightTheme.colors.primary,
    borderRadius: lightTheme.ui.borderRadius.md,
    paddingHorizontal: lightTheme.spacing.sm,
    paddingVertical: lightTheme.spacing.sm,
    marginBottom: lightTheme.spacing.sm,
    color: lightTheme.colors.text,
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: lightTheme.spacing.sm,
    marginBottom: lightTheme.spacing.md,
  },
  colorOption: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: lightTheme.colors.text,
  },
  editActions: {
    flexDirection: 'row',
    gap: lightTheme.spacing.sm,
  },
  editCancelButton: {
    flex: 1,
    paddingVertical: lightTheme.spacing.sm,
    alignItems: 'center',
    borderRadius: lightTheme.ui.borderRadius.md,
    backgroundColor: lightTheme.colors.surfaceSecondary,
  },
  editCancelText: {
    ...lightTheme.typography.button,
    color: lightTheme.colors.textSecondary,
  },
  editSaveButton: {
    flex: 1,
    paddingVertical: lightTheme.spacing.sm,
    alignItems: 'center',
    borderRadius: lightTheme.ui.borderRadius.md,
    backgroundColor: lightTheme.colors.primary,
  },
  editSaveText: {
    ...lightTheme.typography.button,
    color: lightTheme.colors.surface,
  },

  // Modal stilleri
  modalOverlay: {
    flex: 1,
    backgroundColor: lightTheme.colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: lightTheme.colors.surface,
    borderRadius: lightTheme.ui.borderRadius.lg,
    paddingVertical: lightTheme.spacing.xl,
    paddingHorizontal: lightTheme.spacing.lg,
    marginHorizontal: lightTheme.spacing.lg,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    ...lightTheme.typography.h3,
    color: lightTheme.colors.text,
    textAlign: 'center',
    marginBottom: lightTheme.spacing.lg,
  },
  modalInput: {
    ...lightTheme.typography.body,
    backgroundColor: lightTheme.colors.surface,
    borderWidth: 1,
    borderColor: lightTheme.colors.border,
    borderRadius: lightTheme.ui.borderRadius.md,
    paddingHorizontal: lightTheme.spacing.sm,
    paddingVertical: lightTheme.spacing.md,
    marginBottom: lightTheme.spacing.lg,
    minHeight: lightTheme.ui.minTouchTarget,
    color: lightTheme.colors.text,
  },
  modalLabel: {
    ...lightTheme.typography.label,
    color: lightTheme.colors.text,
    marginBottom: lightTheme.spacing.sm,
  },
  modalColorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: lightTheme.spacing.md,
    marginBottom: lightTheme.spacing.xl,
  },
  modalColorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  modalColorOptionSelected: {
    borderColor: lightTheme.colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    gap: lightTheme.spacing.md,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: lightTheme.spacing.md,
    alignItems: 'center',
    borderRadius: lightTheme.ui.borderRadius.md,
    backgroundColor: lightTheme.colors.surfaceSecondary,
  },
  modalCancelText: {
    ...lightTheme.typography.button,
    color: lightTheme.colors.textSecondary,
  },
  modalCreateButton: {
    flex: 1,
    paddingVertical: lightTheme.spacing.md,
    alignItems: 'center',
    borderRadius: lightTheme.ui.borderRadius.md,
    backgroundColor: lightTheme.colors.primary,
  },
  modalCreateText: {
    ...lightTheme.typography.button,
    color: lightTheme.colors.surface,
  },
});
