/**
 * Basit Tab Navigator - 2 sekme: Tasks ve Settings
 * State ile sekme geçişi, minimum 48dp touch target
 */

import React, { useState, createContext, useContext, ReactNode } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Tab tipi
export type TabName = 'Tasks' | 'Settings';

// Tab context tipi
interface TabContextType {
  activeTab: TabName;
  setActiveTab: (tab: TabName) => void;
}

// Global tab state
let globalActiveTab: TabName = 'Tasks';

// Global helper function to set current tab
export const setGlobalActiveTab = (tab: TabName) => {
  globalActiveTab = tab;
};

// Tab context
const TabContext = createContext<TabContextType | null>(null);

// Tab hook
export function useTab(): TabContextType {
  const context = useContext(TabContext);
  if (!context) {
    throw new Error('useTab must be used within a TabNavigator');
  }
  return context;
}

// Tab Navigator bileşeni
interface TabNavigatorProps {
  initialTab?: TabName;
  children: ReactNode;
}

export const TabNavigator: React.FC<TabNavigatorProps> = ({
  initialTab = 'Tasks',
  children,
}) => {
  const [activeTab, setActiveTab] = useState<TabName>(globalActiveTab || initialTab);

  const handleSetActiveTab = (tab: TabName) => {
    globalActiveTab = tab;
    setActiveTab(tab);
  };
  const safeAreaInsets = useSafeAreaInsets();

  const tabValue: TabContextType = {
    activeTab,
    setActiveTab: handleSetActiveTab,
  };

  const tabs: { name: TabName; label: string; icon: string }[] = [
    { name: 'Tasks', label: 'Görevler', icon: '✓' },
    { name: 'Settings', label: 'Ayarlar', icon: '⚙' },
  ];

  return (
    <TabContext.Provider value={tabValue}>
      <View style={styles.container}>
        {/* Ana içerik alanı */}
        <View style={styles.content}>
          {children}
        </View>

        {/* Alt tab bar */}
        <View style={[
          styles.tabBar,
          { paddingBottom: safeAreaInsets.bottom || 16 }
        ]}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.name}
              style={[
                styles.tabButton,
                activeTab === tab.name && styles.tabButtonActive
              ]}
              onPress={() => handleSetActiveTab(tab.name)}
              activeOpacity={0.7}
            >
              <View style={styles.tabContent}>
                <Text style={[
                  styles.tabIcon,
                  activeTab === tab.name && styles.tabIconActive
                ]}>
                  {tab.icon}
                </Text>
                <Text style={[
                  styles.tabLabel,
                  activeTab === tab.name && styles.tabLabelActive
                ]}>
                  {tab.label}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </TabContext.Provider>
  );
};

// TabScreen bileşeni - Belirli tab aktifken görünür
interface TabScreenProps {
  name: TabName;
  children: ReactNode;
}

export const TabScreen: React.FC<TabScreenProps> = ({ name, children }) => {
  const { activeTab } = useTab();
  
  if (activeTab !== name) {
    return null;
  }

  return <>{children}</>;
};

// Stilleri
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    minHeight: 48, // Minimum dokunma hedefi
  },
  tabButtonActive: {
    backgroundColor: '#EBF4FF', // Light blue background
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 20,
    color: '#6B7280',
    marginBottom: 2,
  },
  tabIconActive: {
    color: '#3B82F6',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  tabLabelActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
});
