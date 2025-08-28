/**
 * ManageLabelsScreen - Etiket yönetimi ekranı
 * Listeleme, oluşturma, düzenleme, silme, arama işlemleri
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
  LabelsRepository,
  type Label,
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

interface LabelWithStats extends Label {
  task_count: number;
}

type EditingLabel = {
  id: string;
  name: string;
  color: string | null;
} | null;

export const ManageLabelsScreen: React.FC = () => {
  const safeAreaInsets = useSafeAreaInsets();
  const [labels, setLabels] = useState<LabelWithStats[]>([]);
  const [filteredLabels, setFilteredLabels] = useState<LabelWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLabel, setEditingLabel] = useState<EditingLabel>(null);
  const [showNewLabelModal, setShowNewLabelModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [newLabelForm, setNewLabelForm] = useState({
    name: '',
    color: COLOR_PALETTE[0],
  });

  // Etiketleri yükle
  const loadLabels = useCallback(async () => {
    try {
      setError(null);
      const labelsData = await LabelsRepository.getAllWithTaskCounts();
      setLabels(labelsData);
      setFilteredLabels(labelsData);
    } catch (err) {
      console.error('[ManageLabels] Listeleme hatası:', err);
      setError('Etiketler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLabels();
  }, [loadLabels]);

  // Arama filtresi
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredLabels(labels);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = labels.filter(label => 
        label.name.toLowerCase().includes(query)
      );
      setFilteredLabels(filtered);
    }
  }, [searchQuery, labels]);

  // Yeni etiket oluştur
  const handleCreateLabel = async () => {
    if (!newLabelForm.name.trim()) {
      Alert.alert('Hata', 'Etiket adı boş olamaz');
      return;
    }

    try {
      await LabelsRepository.create({
        name: newLabelForm.name.trim(),
        color: newLabelForm.color,
      });

      // Formu temizle
      setNewLabelForm({
        name: '',
        color: COLOR_PALETTE[0],
      });
      setShowNewLabelModal(false);
      
      // Listeyi yenile
      await loadLabels();
      
      console.log('[ManageLabels] ✅ Yeni etiket oluşturuldu');
    } catch (err) {
      console.error('[ManageLabels] Etiket oluşturma hatası:', err);
      
      // UNIQUE constraint hatası için özel mesaj
      if (err instanceof Error && err.message.includes('Bu etiket adı zaten mevcut')) {
        Alert.alert('Hata', 'Bu etiket adı zaten kullanılıyor');
      } else {
        Alert.alert('Hata', 'Etiket oluşturulurken hata oluştu');
      }
    }
  };

  // Etiket düzenle
  const handleEditLabel = async (updatedLabel: EditingLabel) => {
    if (!updatedLabel || !updatedLabel.name.trim()) {
      Alert.alert('Hata', 'Etiket adı boş olamaz');
      return;
    }

    try {
      await LabelsRepository.update(updatedLabel.id, {
        name: updatedLabel.name.trim(),
        color: updatedLabel.color,
      });

      setEditingLabel(null);
      await loadLabels();
      
      console.log('[ManageLabels] ✅ Etiket güncellendi');
    } catch (err) {
      console.error('[ManageLabels] Etiket güncelleme hatası:', err);
      
      // UNIQUE constraint hatası için özel mesaj
      if (err instanceof Error && err.message.includes('Bu etiket adı zaten mevcut')) {
        Alert.alert('Hata', 'Bu etiket adı zaten kullanılıyor');
      } else {
        Alert.alert('Hata', 'Etiket güncellenirken hata oluştu');
      }
    }
  };

  // Etiket sil
  const handleDeleteLabel = (label: LabelWithStats) => {
    const warningMessage = label.task_count > 0 
      ? `"${label.name}" etiketi ${label.task_count} görevde kullanılıyor. Etiket silindiğinde bu görevlerden de kaldırılacak.`
      : `"${label.name}" etiketini silmek istediğinizden emin misiniz?`;

    Alert.alert(
      'Etiket Sil',
      warningMessage,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => performDelete(label.id),
        },
      ]
    );
  };

  // Silme işlemini gerçekleştir
  const performDelete = async (labelId: string) => {
    try {
      await LabelsRepository.delete(labelId);
      await loadLabels();
      console.log('[ManageLabels] ✅ Etiket silindi');
    } catch (err) {
      console.error('[ManageLabels] Silme hatası:', err);
      Alert.alert('Hata', 'Etiket silinirken hata oluştu');
    }
  };

  // Etiket item'ı render et
  const renderLabelItem = ({ item }: { item: LabelWithStats }) => {
    const isEditing = editingLabel?.id === item.id;
    
    return (
      <View style={styles.labelCard}>
        {/* İçerik */}
          {isEditing ? (
            // Düzenleme modu
            <View style={styles.editForm}>
              <Text style={styles.editTitle}>Etiket Düzenle</Text>
              <TextInput
                style={styles.editNameInput}
                value={editingLabel?.name}
                onChangeText={(text) => 
                  setEditingLabel(prev => prev ? { ...prev, name: text } : null)
                }
                placeholder="Etiket adı"
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
                      editingLabel?.color === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => 
                      setEditingLabel(prev => prev ? { ...prev, color } : null)
                    }
                  />
                ))}
              </View>

              {/* Düzenleme butonları */}
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={styles.editCancelButton}
                  onPress={() => setEditingLabel(null)}
                >
                  <Text style={styles.editCancelText}>İptal</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.editSaveButton}
                  onPress={() => handleEditLabel(editingLabel)}
                >
                  <Text style={styles.editSaveText}>Kaydet</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // Normal görünüm
            <View style={styles.labelCardHeader}>
              <View style={styles.labelInfo}>
                <View style={[
                  styles.colorChip,
                  { backgroundColor: item.color || lightTheme.colors.primary }
                ]} />
                <View style={styles.labelContent}>
                  <Text style={styles.labelName}>{item.name}</Text>
                  <Text style={styles.labelStats}>
                    {item.task_count === 0 
                      ? 'Hiç görevde kullanılmıyor'
                      : `${item.task_count} görevde kullanılıyor`
                    }
                  </Text>
                </View>
              </View>
              
              <View style={styles.labelActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setEditingLabel({
                    id: item.id,
                    name: item.name,
                    color: item.color,
                  })}
                >
                  <Text style={styles.actionButtonText}>✏️</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDeleteLabel(item)}
                >
                  <Text style={styles.actionButtonText}>🗑</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        }
      </View>
    );
  };

  // Boş durum
  const renderEmpty = () => {
    const isSearching = searchQuery.trim().length > 0;
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>
          {isSearching ? '🔍' : '🏷'}
        </Text>
        <Text style={styles.emptyTitle}>
          {isSearching ? 'Etiket Bulunamadı' : 'Etiket Yok'}
        </Text>
        <Text style={styles.emptyMessage}>
          {isSearching 
            ? `"${searchQuery}" ile eşleşen etiket bulunamadı.`
            : 'Henüz hiç etiket oluşturmadınız. Sağ üstteki "+" butonuna dokunarak ilk etiketinizi oluşturun.'
          }
        </Text>
      </View>
    );
  };

  // Hata durumu
  if (error) {
    return (
      <View style={styles.container}>
        <Header 
          title="Etiketler" 
          showBackButton={true}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Bir hata oluştu</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadLabels}
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
        title="Etiketler"
        showBackButton={true}
        rightComponent={
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowNewLabelModal(true)}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        }
      />

      {/* Arama kutusu */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Etiketlerde ara..."
          placeholderTextColor={lightTheme.colors.textTertiary}
          clearButtonMode="while-editing"
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={lightTheme.colors.primary} />
          <Text style={styles.loadingText}>Etiketler yükleniyor...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredLabels}
          renderItem={renderLabelItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={[
            { paddingBottom: lightTheme.spacing.lg },
            filteredLabels.length === 0 ? styles.listEmpty : undefined
          ]}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}

      {/* Yeni Etiket Modal */}
      <Modal
        visible={showNewLabelModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowNewLabelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Yeni Etiket</Text>
            
            <TextInput
              style={styles.modalInput}
              value={newLabelForm.name}
              onChangeText={(text) => setNewLabelForm(prev => ({ ...prev, name: text }))}
              placeholder="Etiket adı"
              autoFocus
              maxLength={30}
            />

            {/* Renk seçici */}
            <Text style={styles.modalLabel}>Renk (isteğe bağlı):</Text>
            <View style={styles.modalColorPicker}>
              {COLOR_PALETTE.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.modalColorOption,
                    { backgroundColor: color },
                    newLabelForm.color === color && styles.modalColorOptionSelected,
                  ]}
                  onPress={() => setNewLabelForm(prev => ({ ...prev, color }))}
                />
              ))}
            </View>

            {/* Modal butonları */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowNewLabelModal(false);
                  setNewLabelForm({ name: '', color: COLOR_PALETTE[0] });
                }}
              >
                <Text style={styles.modalCancelText}>İptal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalCreateButton}
                onPress={handleCreateLabel}
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
  searchContainer: {
    paddingHorizontal: lightTheme.spacing.md,
    paddingVertical: lightTheme.spacing.sm,
  },
  searchInput: {
    ...lightTheme.typography.body,
    backgroundColor: lightTheme.colors.surface,
    borderWidth: 1,
    borderColor: lightTheme.colors.border,
    borderRadius: lightTheme.ui.borderRadius.md,
    paddingHorizontal: lightTheme.spacing.md,
    paddingVertical: lightTheme.spacing.md,
    minHeight: lightTheme.ui.minTouchTarget,
    color: lightTheme.colors.text,
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
  labelCard: {
    backgroundColor: lightTheme.colors.surface,
    borderRadius: lightTheme.ui.borderRadius.lg,
    marginHorizontal: lightTheme.spacing.md,
    marginVertical: lightTheme.spacing.sm,
    padding: lightTheme.spacing.md,
    ...lightTheme.ui.shadow.sm,
  },
  labelCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorChip: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: lightTheme.spacing.md,
  },
  labelContent: {
    flex: 1,
    marginRight: lightTheme.spacing.sm,
  },
  labelName: {
    ...lightTheme.typography.body,
    color: lightTheme.colors.text,
    fontWeight: '500',
    marginBottom: 2,
  },
  labelStats: {
    ...lightTheme.typography.bodySmall,
    color: lightTheme.colors.textSecondary,
  },
  labelActions: {
    flexDirection: 'row',
    gap: lightTheme.spacing.sm,
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
