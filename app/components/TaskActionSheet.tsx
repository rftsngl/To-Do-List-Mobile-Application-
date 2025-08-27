/**
 * TaskActionSheet - Görev için alttan açılan action menüsü
 * Düzenle, Sil, Tamamla, Öncelik değiştir gibi seçenekler
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import { Sheet } from './Sheet';
import { lightTheme } from '../theme/theme';
import type { Task } from '../../src/database/types';

const { height: screenHeight } = Dimensions.get('window');

export interface TaskActionSheetProps {
  isVisible: boolean;
  onClose: () => void;
  task: Task | null;
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onToggleComplete?: (taskId: string) => void;
  onDuplicate?: (taskId: string) => void;
  onShare?: (taskId: string) => void;
}

interface ActionItem {
  id: string;
  title: string;
  icon: string;
  color?: string;
  destructive?: boolean;
  onPress: () => void;
}

export const TaskActionSheet: React.FC<TaskActionSheetProps> = ({
  isVisible,
  onClose,
  task,
  onEdit,
  onDelete,
  onToggleComplete,
  onDuplicate,
  onShare,
}) => {
  if (!task) {
    return (
      <Sheet
        isVisible={isVisible}
        onClose={onClose}
        height={screenHeight * 0.3}
        closeOnBackdrop={true}
      >
        <View style={styles.container}>
          <Text style={styles.taskTitle}>Görev bulunamadı</Text>
        </View>
      </Sheet>
    );
  }

  const isCompleted = task.status === 'done';

  const handleEdit = () => {
    onClose();
    onEdit?.(task.id);
  };

  const handleDelete = () => {
    onClose();
    Alert.alert(
      'Görevi Sil',
      `"${task.title}" görevi silinsin mi?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => onDelete?.(task.id),
        },
      ]
    );
  };

  const handleToggleComplete = () => {
    onClose();
    onToggleComplete?.(task.id);
  };

  const handleDuplicate = () => {
    onClose();
    onDuplicate?.(task.id);
  };

  const handleShare = () => {
    onClose();
    onShare?.(task.id);
  };

  const actions: ActionItem[] = [
    {
      id: 'edit',
      title: 'Düzenle',
      icon: '✏️',
      color: lightTheme.colors.primary,
      onPress: handleEdit,
    },
    {
      id: 'toggle',
      title: isCompleted ? 'Geri Al' : 'Tamamla',
      icon: isCompleted ? '↩️' : '✅',
      color: isCompleted ? lightTheme.colors.warning : lightTheme.colors.success,
      onPress: handleToggleComplete,
    },
    {
      id: 'duplicate',
      title: 'Kopyala',
      icon: '📋',
      color: lightTheme.colors.secondary,
      onPress: handleDuplicate,
    },
    {
      id: 'share',
      title: 'Paylaş',
      icon: '📤',
      color: lightTheme.colors.accent,
      onPress: handleShare,
    },
    {
      id: 'delete',
      title: 'Sil',
      icon: '🗑️',
      color: lightTheme.colors.error,
      destructive: true,
      onPress: handleDelete,
    },
  ];

  return (
    <Sheet
      isVisible={isVisible}
      onClose={onClose}
      height={screenHeight * 0.45}
      closeOnBackdrop={true}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.taskTitle} numberOfLines={2}>
            {task.title}
          </Text>
          {task.description && (
            <Text style={styles.taskDescription} numberOfLines={1}>
              {task.description}
            </Text>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={[
                styles.actionItem,
                action.destructive && styles.actionItemDestructive,
              ]}
              onPress={action.onPress}
              activeOpacity={0.6}
              accessibilityRole="button"
              accessibilityLabel={action.title}
            >
              <View style={styles.actionContent}>
                <View style={[
                  styles.iconContainer,
                  { backgroundColor: action.color + '15' }
                ]}>
                  <Text style={styles.actionIcon}>{action.icon}</Text>
                </View>
                <View style={styles.actionTextContainer}>
                  <Text
                    style={[
                      styles.actionTitle,
                      { color: action.color || lightTheme.colors.text },
                    ]}
                  >
                    {action.title}
                  </Text>
                </View>
                <Text style={[
                  styles.actionChevron,
                  { color: action.color + '60' }
                ]}>›</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Sheet>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: lightTheme.spacing.sm,
  },
  header: {
    paddingBottom: lightTheme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.border,
    marginBottom: lightTheme.spacing.md,
  },
  taskTitle: {
    ...lightTheme.typography.h4,
    color: lightTheme.colors.text,
    marginBottom: lightTheme.spacing.xs,
    fontWeight: '600',
  },
  taskDescription: {
    ...lightTheme.typography.bodySmall,
    color: lightTheme.colors.textSecondary,
  },
  actions: {
    paddingBottom: lightTheme.spacing.md,
    gap: lightTheme.spacing.sm,
  },
  actionItem: {
    backgroundColor: lightTheme.colors.surface,
    borderRadius: lightTheme.ui.borderRadius.lg,
    marginBottom: lightTheme.spacing.sm,
    paddingVertical: lightTheme.spacing.md,
    paddingHorizontal: lightTheme.spacing.md,
    ...lightTheme.ui.shadow.sm,
  },
  actionItemDestructive: {
    backgroundColor: lightTheme.colors.error + '08',
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: lightTheme.ui.minTouchTarget,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: lightTheme.spacing.md,
  },
  actionIcon: {
    fontSize: 22,
    textAlign: 'center',
  },
  actionTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  actionTitle: {
    ...lightTheme.typography.body,
    fontWeight: '600',
    fontSize: 16,
  },
  actionChevron: {
    fontSize: 20,
    fontWeight: '300',
    marginLeft: lightTheme.spacing.sm,
  },
});
