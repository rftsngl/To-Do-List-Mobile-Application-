/**
 * TodoMobile App - SQLite Veritabanı ile Todo Uygulaması
 * React Native + TypeScript + Harici kütüphane yok navigasyon
 *
 * @format
 */

import React, { useState } from 'react';
import { StatusBar, StyleSheet, useColorScheme } from 'react-native';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';

// Uygulama başlangıç kapısı
import { InitGate } from './app/boot/InitGate';

// Navigasyon
import { StackNavigator, StackGlobalRef, Screen } from './app/navigation/Stack';
import { TabNavigator, TabScreen } from './app/navigation/Tabs';

// Ekranlar
import { TasksScreen } from './app/screens/Tasks/TasksScreen';
import { NewTaskSheet } from './app/screens/Tasks/NewTaskSheet';
import { TaskDetailScreen } from './app/screens/Tasks/TaskDetailScreen';
import { SettingsScreen } from './app/screens/Settings/SettingsScreen';
import { ManageListsScreen } from './app/screens/Settings/ManageListsScreen';
import { ManageLabelsScreen } from './app/screens/Settings/ManageLabelsScreen';
import { DBCheckScreen } from './app/screens/DBCheckScreen';

// Navigation helper
import { Navigation } from './app/navigation/Stack';

// Theme
import { ThemeProvider } from './app/theme/ThemeContext';

function App() {
  return (
    <SafeAreaProvider>
      <InitGate>
        <AppContent />
      </InitGate>
    </SafeAreaProvider>
  );
}

function AppContent() {
  // State yönetimi
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showDoneInAll, setShowDoneInAll] = useState(false);
  const [newTaskSheetVisible, setNewTaskSheetVisible] = useState(false);

  // Navigation handlers
  const handleTaskPress = (taskId: string) => {
    Navigation.push({ name: 'TaskDetail', params: { taskId } });
  };

  const handleTaskMenu = (taskId: string) => {
    // Task menüsü artık TasksScreen içinde yönetiliyor
    // Bu fonksiyon artık kullanılmıyor
  };

  const handleNewTask = () => {
    setNewTaskSheetVisible(true);
  };

  const handleTaskCreated = () => {
    // NewTaskSheet'ten dönen callback
    // TasksScreen otomatik yenilenecek
  };

  const handleTaskUpdated = () => {
    // TaskDetailScreen'den dönen callback
    // TasksScreen otomatik yenilenecek
  };

  const handleTaskDeleted = () => {
    // TaskDetailScreen'den dönen callback
    // TasksScreen otomatik yenilenecek
  };

  const handleDBCheckPress = () => {
    Navigation.push({ name: 'DBCheck' });
  };

  return (
    <ThemeProvider isDarkMode={isDarkMode} onThemeToggle={setIsDarkMode}>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#111827' : '#FFFFFF'}
        translucent={false}
        hidden={false}
        animated={true}
      />
      <StackNavigator initialRoute={{ name: 'Main' }}>
        <StackGlobalRef>
        {/* Ana Tab Ekranı */}
        <Screen name="Main">
          {() => (
            <TabNavigator initialTab="Tasks">
              {/* Tasks Tab */}
              <TabScreen name="Tasks">
                <TasksScreen
                  onNewTask={handleNewTask}
                  onTaskPress={handleTaskPress}
                  onTaskMenu={handleTaskMenu}
                  showDoneInAll={showDoneInAll}
                />
              </TabScreen>

              {/* Settings Tab */}
              <TabScreen name="Settings">
                <SettingsScreen
                  isDarkMode={isDarkMode}
                  onThemeToggle={setIsDarkMode}
                  showDoneInAll={showDoneInAll}
                  onShowDoneInAllToggle={setShowDoneInAll}
                  onDBCheckPress={__DEV__ ? handleDBCheckPress : undefined}
                />
              </TabScreen>
            </TabNavigator>
          )}
        </Screen>

        {/* Task Detail Screen */}
        <Screen name="TaskDetail">
          {({ route }) => (
            <TaskDetailScreen
              taskId={route.params?.taskId}
              onClose={() => Navigation.pop()}
              onTaskUpdated={handleTaskUpdated}
              onTaskDeleted={handleTaskDeleted}
            />
          )}
        </Screen>

        {/* Manage Lists Screen */}
        <Screen name="ManageLists">
          {() => <ManageListsScreen />}
        </Screen>

        {/* Manage Labels Screen */}
        <Screen name="ManageLabels">
          {() => <ManageLabelsScreen />}
        </Screen>

        {/* DB Check Screen (dev only) */}
        {__DEV__ && (
          <Screen name="DBCheck">
            {() => <DBCheckScreen />}
          </Screen>
        )}

        {/* New Task Sheet */}
        <NewTaskSheet
          isVisible={newTaskSheetVisible}
          onClose={() => setNewTaskSheetVisible(false)}
          onTaskCreated={handleTaskCreated}
        />
      </StackGlobalRef>
    </StackNavigator>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
