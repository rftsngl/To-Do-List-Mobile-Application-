/**
 * NewTaskSheet - Yeni görev oluşturma sheet'i
 * Form validasyon, repository entegrasyonu, etiket seçimi
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';

// Components
import { SheetWithHeader } from '../../components/Sheet';

// Database
import {
  TasksRepository,
  ListsRepository,
  LabelsRepository,
  type List,
  type Label,
} from '../../../src/database';

// Utils
import { parseDateYYYYMMDD, formatDateYYYYMMDD, now } from '../../utils/date';
import { getAllPriorities } from '../../utils/status';

// Theme
import { lightTheme, getPriorityColor } from '../../theme/theme';

// Navigation
import { Navigation } from '../../navigation/Stack';

const { height: screenHeight } = Dimensions.get('window');

interface NewTaskSheetProps {
  isVisible: boolean;
  onClose: () => void;
  onTaskCreated: () => void; // Görev oluşturulduktan sonra listeyi yenilemek için
  initialListId?: string;
}

interface FormData {
  title: string;
  description: string;
  due_date: string; // YYYY-MM-DD format
  priority: number;
  list_id: string;
  label_ids: string[];
}

export const NewTaskSheet: React.FC<NewTaskSheetProps> = ({
  isVisible,
  onClose,
  onTaskCreated,
  initialListId,
}) => {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    due_date: '',
    priority: 1,
    list_id: initialListId || '',
    label_ids: [],
  });

  const [lists, setLists] = useState<List[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(false);

  // Lists ve labels yükle
  useEffect(() => {
    if (isVisible) {
      loadData();
    }
  }, [isVisible]);

  const loadData = async () => {
    try {
      const [listsData, labelsData] = await Promise.all([
        ListsRepository.getAll(),
        LabelsRepository.getAll(),
      ]);

      setLists(listsData);
      setLabels(labelsData);

      // İlk liste seçili değilse, ilk listeyi seç
      if (!formData.list_id && listsData.length > 0) {
        setFormData(prev => ({
          ...prev,
          list_id: listsData[0].id
        }));
      }
    } catch (err) {
      console.error('[NewTaskSheet] Veri yükleme hatası:', err);
    }
  };

  // Form alanı güncelle
  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({
      ...prev,
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
    const currentLabels = formData.label_ids;
    const newLabels = currentLabels.includes(labelId)
      ? currentLabels.filter(id => id !== labelId)
      : [...currentLabels, labelId];
    
    updateField('label_ids', newLabels);
  };

  // Tarih formatı işleme (DD-MM-YYYY formatında giriş)
  const handleDateChange = (value: string) => {
    // Sadece sayı girişine izin ver
    const numbersOnly = value.replace(/[^0-9]/g, '');
    
    // Formatı otomatik ekle: DD-MM-YYYY
    let formatted = '';
    if (numbersOnly.length > 0) {
      // İlk 2 karakter: gün
      formatted = numbersOnly.substring(0, 2);
      
      if (numbersOnly.length > 2) {
        // 3-4. karakter: ay
        formatted += '-' + numbersOnly.substring(2, 4);
        
        if (numbersOnly.length > 4) {
          // 5-8. karakter: yıl
          formatted += '-' + numbersOnly.substring(4, 8);
        }
      }
    }
    
    updateField('due_date', formatted);
  };

  // DD-MM-YYYY formatını YYYY-MM-DD'ye çevir
  const convertDateFormat = (ddmmyyyy: string): string | null => {
    if (!ddmmyyyy || ddmmyyyy.length !== 10) return null;
    
    const parts = ddmmyyyy.split('-');
    if (parts.length !== 3) return null;
    
    const [day, month, year] = parts;
    
    // Basit validasyon
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    
    if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 2000) {
      return null;
    }
    
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  // Form validasyon
  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    // Başlık zorunlu
    if (!formData.title.trim()) {
      newErrors.title = 'Görev başlığı gerekli';
    }

    // Liste seçimi artık zorunlu değil
    // if (!formData.list_id) {
    //   newErrors.list_id = 'Liste seçimi gerekli';
    // }

    // Tarih formatı kontrolü (DD-MM-YYYY formatı)
    if (formData.due_date && !convertDateFormat(formData.due_date)) {
      newErrors.due_date = 'Geçersiz tarih formatı (DD-MM-YYYY)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Formu kaydet
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Görevi oluştur
      const convertedDate = formData.due_date ? convertDateFormat(formData.due_date) : null;
      const taskData = {
        list_id: formData.list_id || null, // Liste seçimi artık opsiyonel
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        priority: formData.priority as any,
        due_date: convertedDate ? parseDateYYYYMMDD(convertedDate) : null,
        status: 'todo' as const,
      };

      const newTask = await TasksRepository.create(taskData);

      // Etiketleri bağla
      if (formData.label_ids.length > 0) {
        for (const labelId of formData.label_ids) {
          await LabelsRepository.addToTask(newTask.id, labelId);
        }
      }

      console.log('[NewTaskSheet] Yeni görev oluşturuldu:', newTask.id);

      // Form temizle
      setFormData({
        title: '',
        description: '',
        due_date: '',
        priority: 1,
        list_id: initialListId || lists[0]?.id || '',
        label_ids: [],
      });

      // Sheet'i kapat ve listeyi yenile
      onClose();
      onTaskCreated();

    } catch (err) {
      console.error('[NewTaskSheet] Görev oluşturma hatası:', err);
      Alert.alert(
        'Hata',
        'Görev oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Sheet kapanırken formu temizle
  const handleClose = () => {
    if (!loading) {
      setFormData({
        title: '',
        description: '',
        due_date: '',
        priority: 1,
        list_id: initialListId || lists[0]?.id || '',
        label_ids: [],
      });
      setErrors({});
      onClose();
    }
  };

  return (
    <SheetWithHeader
      isVisible={isVisible}
      onClose={handleClose}
      title="Yeni Görev Oluştur"
      height={screenHeight * 0.74}
    >
      <ScrollView 
        style={styles.form}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Başlık */}
        <View style={styles.field}>
          <Text style={styles.label}>
            Görev Başlığı <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              errors.title && styles.inputError
            ]}
            value={formData.title}
            onChangeText={(value) => updateField('title', value)}
            placeholder="Görev başlığını yazın..."
            placeholderTextColor={lightTheme.colors.textTertiary}
            maxLength={200}
            returnKeyType="next"
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
            placeholder="Görev açıklaması (opsiyonel)..."
            placeholderTextColor={lightTheme.colors.textTertiary}
            multiline
            numberOfLines={3}
            maxLength={500}
            textAlignVertical="top"
          />
        </View>

        {/* Tarih */}
        <View style={styles.field}>
          <Text style={styles.label}>Vade Tarihi</Text>
          <TextInput
            style={[
              styles.input,
              errors.due_date && styles.inputError
            ]}
            value={formData.due_date}
            onChangeText={handleDateChange}
            placeholder="15-01-2025"
            placeholderTextColor={lightTheme.colors.textTertiary}
            maxLength={10}
            keyboardType="numeric"
          />
          {errors.due_date && (
            <Text style={styles.errorText}>{errors.due_date}</Text>
          )}
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

        {/* Liste Seçimi */}
        <View style={styles.field}>
          <View style={styles.fieldHeader}>
            <Text style={styles.label}>
              Liste
            </Text>
            <TouchableOpacity style={styles.addButton} onPress={() => {
              onClose();
              setTimeout(() => Navigation.push({ name: 'ManageLists' }), 300);
            }}>
              <Text style={styles.addButtonText}>+ Liste Ekle</Text>
            </TouchableOpacity>
          </View>
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
          {errors.list_id && (
            <Text style={styles.errorText}>{errors.list_id}</Text>
          )}
        </View>

        {/* Etiketler */}
        <View style={styles.field}>
          <View style={styles.fieldHeader}>
            <Text style={styles.label}>Etiketler</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => {
              onClose();
              setTimeout(() => Navigation.push({ name: 'ManageLabels' }), 300);
            }}>
              <Text style={styles.addButtonText}>+ Etiket Ekle</Text>
            </TouchableOpacity>
          </View>
          {labels.length > 0 && (
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
          )}
        </View>

        {/* Kaydet Butonu */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              loading && styles.saveButtonDisabled
            ]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Kaydediliyor...' : 'Görevi Kaydet'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SheetWithHeader>
  );
};

// Stilleri
const styles = StyleSheet.create({
  form: {
    flex: 1,
  },
  field: {
    marginBottom: lightTheme.spacing.lg,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: lightTheme.spacing.sm,
  },
  addButton: {
    paddingHorizontal: lightTheme.spacing.sm,
    paddingVertical: 4,
    backgroundColor: lightTheme.colors.primary + '15',
    borderRadius: lightTheme.ui.borderRadius.sm,
    borderWidth: 1,
    borderColor: lightTheme.colors.primary + '30',
  },
  addButtonText: {
    ...lightTheme.typography.labelSmall,
    color: lightTheme.colors.primary,
    fontWeight: '500',
  },
  label: {
    ...lightTheme.typography.label,
    color: lightTheme.colors.text,
    marginBottom: lightTheme.spacing.sm,
  },
  required: {
    color: lightTheme.colors.error,
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
    minHeight: 80,
    maxHeight: 120,
  },
  errorText: {
    ...lightTheme.typography.bodySmall,
    color: lightTheme.colors.error,
    marginTop: 4,
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
    // Dinamik stil background'da verilecek
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
    // Dinamik stil background'da verilecek
  },
  labelChipText: {
    ...lightTheme.typography.labelSmall,
    color: lightTheme.colors.textSecondary,
  },
  actions: {
    marginTop: lightTheme.spacing.xl,
    marginBottom: lightTheme.spacing.xxl, // Sheet bottom padding için
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
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    color: lightTheme.colors.surface,
  },
});
