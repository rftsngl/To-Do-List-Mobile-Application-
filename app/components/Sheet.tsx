/**
 * Sheet - Alttan açılan modal panel
 * Animated ile giriş/çıkış, klavye kaçınma, backdrop kapatma
 */

import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { lightTheme } from '../theme/theme';
import { useTheme } from '../theme/ThemeContext';

const { height: screenHeight } = Dimensions.get('window');

interface SheetProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: number | 'auto'; // Yarım ekran için screenHeight / 2, auto için content'e göre
  title?: string;
  closeOnBackdrop?: boolean;
}

export const Sheet: React.FC<SheetProps> = ({
  isVisible,
  onClose,
  children,
  height = screenHeight * 0.6, // Varsayılan: %60 ekran
  closeOnBackdrop = true,
}) => {
  const { theme } = useTheme();
  const safeAreaInsets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      // Sheet'i açma animasyonu
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Sheet'i kapatma animasyonu
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: screenHeight,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  const handleBackdropPress = () => {
    if (closeOnBackdrop) {
      onClose();
    }
  };

  const sheetHeight = height === 'auto' ? undefined : height;

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={handleBackdropPress}>
          <Animated.View style={[styles.backdrop, { opacity, backgroundColor: theme.colors.overlay }]} />
        </TouchableWithoutFeedback>

        {/* Sheet Content */}
        <Animated.View
          style={[
            styles.sheet,
            {
              height: sheetHeight,
              transform: [{ translateY }],
              paddingBottom: safeAreaInsets.bottom || theme.spacing.md,
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: theme.colors.borderSecondary }]} />

          {/* Content */}
          <View style={styles.content}>
            {height === 'auto' ? (
              <View style={styles.autoContent}>
                {children}
              </View>
            ) : (
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {children}
              </ScrollView>
            )}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// Close butonu ile Sheet
interface SheetWithHeaderProps extends SheetProps {
  title?: string;
  showCloseButton?: boolean;
}

export const SheetWithHeader: React.FC<SheetWithHeaderProps> = ({
  title,
  showCloseButton = true,
  children,
  ...props
}) => {
  const { theme } = useTheme();
  
  return (
    <Sheet {...props}>
      {(title || showCloseButton) && (
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <View style={styles.headerContent}>
            {title && (
              <View style={styles.titleContainer}>
                <Text 
                  style={[styles.headerTitle, { color: theme.colors.text }]}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {title}
                </Text>
              </View>
            )}
            {showCloseButton && (
              <TouchableOpacity
                style={styles.closeButton}
                onPress={props.onClose}
                accessibilityRole="button"
                accessibilityLabel="Kapat"
              >
                <Text style={[styles.closeButtonText, { color: theme.colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
      <View style={styles.bodyContent}>
        {children}
      </View>
    </Sheet>
  );
};

// Stilleri
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: lightTheme.colors.overlay,
  },
  sheet: {
    backgroundColor: lightTheme.colors.surface,
    borderTopLeftRadius: lightTheme.ui.borderRadius.xl,
    borderTopRightRadius: lightTheme.ui.borderRadius.xl,
    ...lightTheme.ui.shadow.lg,
    zIndex: lightTheme.ui.zIndex.sheet,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: lightTheme.colors.borderSecondary,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: lightTheme.spacing.sm,
    marginBottom: lightTheme.spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: lightTheme.spacing.md,
  },
  autoContent: {
    paddingBottom: lightTheme.spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: lightTheme.spacing.md,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.border,
    paddingBottom: lightTheme.spacing.md,
    marginBottom: lightTheme.spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: lightTheme.ui.minTouchTarget,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
    color: lightTheme.colors.text,
    textAlign: 'center',
    flexShrink: 1,
  },
  closeButton: {
    width: lightTheme.ui.minTouchTarget,
    height: lightTheme.ui.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: lightTheme.ui.borderRadius.md,
  },
  closeButtonText: {
    fontSize: 16,
    color: lightTheme.colors.textSecondary,
    fontWeight: '500',
  },
  bodyContent: {
    flex: 1,
  },
});
