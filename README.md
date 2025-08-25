# TodoMobile - Görev Yönetim Uygulaması

[![React Native](https://img.shields.io/badge/React%20Native-0.81.0-blue.svg)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)
[![SQLite](https://img.shields.io/badge/SQLite-react--native--sqlite--storage-green.svg)](https://www.npmjs.com/package/react-native-sqlite-storage)

## 📋 İçindekiler

- [Genel Bakış](#-genel-bakış)
- [Mevcut Özellikler](#-mevcut-özellikler)
- [Teknoloji Stack](#️-teknoloji-stack)
- [Kurulum](#-kurulum)
- [Mevcut Proje Yapısı](#-mevcut-proje-yapısı)
- [Planlanan Geliştirmeler](#-planlanan-geliştirmeler)
- [Geliştirme Roadmap](#-geliştirme-roadmap)

## 🚀 Genel Bakış

TodoMobile, React Native ve TypeScript kullanılarak geliştirilmiş, offline çalışabilen görev yönetim uygulamasıdır. Clean Architecture prensiplerine uygun olarak tasarlanmış, SQLite ile güçlü yerel veri depolama sağlar.

## 🌟 Mevcut Özellikler

### ✅ Halihazırda Çalışan Özellikler

#### Görev Yönetimi

- **Görev CRUD İşlemleri**: Oluşturma, okuma, güncelleme, silme
- **Durum Yönetimi**: Todo, İşlemde, Engellendi, Tamamlandı
- **Öncelik Sistemi**: 4 seviyeli öncelik (0-3)
- **Alt Görevler**: Subtask desteği
- **Tarih Yönetimi**: Başlangıç ve bitiş tarihleri

#### Veri Katmanı

- **SQLite Entegrasyonu**: Offline veri depolama
- **Repository Pattern**: Clean data access layer
- **Migration Sistemi**: Veritabanı versiyonlama
- **Type Safety**: Comprehensive TypeScript types
- **Soft Delete**: Güvenli silme mekanizması

#### Kullanıcı Arayüzü

- **Custom Navigation**: Özel stack ve tab navigasyon
- **Tema Sistemi**: Light/dark tema desteği
- **Material Design**: 48dp minimum touch targets
- **Modal/Sheet Support**: Görev detay ve oluşturma ekranları
- **Safe Area**: iOS notch ve Android desteği

#### Teknik Altyapı

- **Clean Architecture**: Katmanlı mimari
- **Custom Components**: Yeniden kullanılabilir UI bileşenleri
- **Performance**: Optimize edilmiş queries
- **Platform Support**: iOS ve Android uyumluluğu

## 🛠️ Teknoloji Stack

### Frontend

- **React Native** 0.81.0 - Cross-platform mobil uygulama framework'ü
- **TypeScript** 5.8.3 - Type-safe JavaScript geliştirme
- **React** 19.1.0 - Kullanıcı arayüzü kütüphanesi

### Veritabanı

- **SQLite** - Yerel veri depolama
- **react-native-sqlite-storage** 6.0.1 - SQLite entegrasyonu

### Navigasyon ve UI

- **Custom Navigation** - Özel geliştirilmiş navigasyon sistemi
- **react-native-safe-area-context** - Güvenli alan yönetimi
- **Custom Components** - Özel UI bileşenleri

### Geliştirme Araçları

- **ESLint** - Kod kalitesi analizi
- **Prettier** - Kod formatlaması
- **Jest** - Unit testing framework'ü
- **Metro** - React Native bundler

### Platform Desteği

- **Android** - API 21+ (Android 5.0+)
- **iOS** - iOS 11.0+ (Xcode 14+ gerekli)
- **React Native** - 0.81.0 ve üzeri

## 📦 Kurulum

### 🔧 Sistem Gereksinimleri

- **Node.js** 18.0 veya üzeri
- **npm** veya **yarn** paket yöneticisi
- **React Native CLI** (`npm install -g @react-native-community/cli`)

#### Android Geliştirme

- **Android Studio** (API 21+ / Android 5.0+)
- **JDK** 11 veya üzeri
- **Android SDK** ve **Platform Tools**

#### iOS Geliştirme (macOS gerekli)

- **Xcode** 14+ (iOS 11.0+ desteği)
- **CocoaPods** (`sudo gem install cocoapods`)

### 🚀 Hızlı Başlangıç

1. **Projeyi klonlayın**

   ```bash
   git clone [repository-url]
   cd TodoMobile
   ```

2. **Bağımlılıkları yükleyin**

   ```bash
   # npm kullanıyorsanız
   npm install
   
   # yarn kullanıyorsanız  
   yarn install
   ```

3. **iOS için CocoaPods kurulumu** (sadece macOS)

   ```bash
   cd ios && pod install && cd ..
   ```

4. **Geliştirme ortamını başlatın**

   ```bash
   # Metro bundler'ı başlat
   npm start
   
   # Yeni terminal açıp uygulamayı çalıştırın
   npm run android  # Android için
   npm run ios      # iOS için (macOS gerekli)
   ```

### 🔍 Doğrulama

Kurulum sonrası aşağıdaki komutlarla her şeyin çalıştığından emin olun:

   ```bash
# TypeScript tip kontrolü
npx tsc --noEmit

# Linting
npm run lint

# Test çalıştırma
npm test
   ```

### Paketleme

**Android APK oluşturma:**

```bash
cd android
./gradlew assembleRelease
```

**iOS uygulaması oluşturma:**

```bash
npx react-native run-ios --configuration Release
```

## 📁 Mevcut Proje Yapısı

```text
TodoMobile/
├── app/                    # Presentation Layer
│   ├── boot/              # Uygulama başlatma
│   ├── components/        # UI bileşenleri
│   ├── navigation/        # Custom navigasyon sistemi
│   ├── screens/           # Ekranlar (Tasks, Settings)
│   ├── theme/            # Tema ve stil sistemi
│   └── utils/            # UI yardımcıları
├── src/                   # Data Layer
│   └── database/         # SQLite & Repository pattern
│       ├── repositories/ # Veri erişim katmanı
│       ├── migrations.ts # Şema versiyonlama
│       └── types.ts      # TypeScript tipleri
├── android/              # Android native
├── ios/                  # iOS native
└── __tests__/            # Test dosyaları
```

### Mevcut Mimari

- **Clean Architecture**: Katmanlı separation of concerns
- **Repository Pattern**: Data access abstraction
- **Custom Navigation**: Minimal dependencies
- **Theme System**: Design system altyapısı

## 🚀 Planlanan Geliştirmeler

### 🎯 Geliştirme Planı

Bu uygulama, mevcut kodu bozmadan kademeli refaktör, temizlik ve ölçeklenebilirlik artışı sağlayacak 6 sprint'lik bir geliştirme sürecine hazır. Her sprint sonunda çalışır bir sürüm, ölçülebilir çıktılar ve geri dönüş noktası bulunacak.

### ⚡ Kısa Vadeli İyileştirmeler (2-4 hafta)

#### 🔧 Sprint 0: Hazırlık ve Zemin (2-3 gün)

- **Git Workflow**: Protected branches (main/develop)
- **CI/CD**: TypeScript strict mode, ESLint, test automation
- **Developer Experience**: Path aliases, Metro resolver optimization
- **Kod Kalitesi**: Strict TypeScript, enhanced linting rules

#### 🎪 Sprint 1: State Management & Error Handling (1 hafta)

- **Global State**: Zustand entegrasyonu (Tasks, Settings, UI stores)
- **Error Boundaries**: Kontrollü hata yönetimi ve user-friendly error screens
- **Loading States**: Merkezi loading, skeleton screens, boş durum patterns
- **Prop Drilling**: Global state ile prop drilling elimiasyonu

#### 📁 Sprint 2: Feature-Based Architecture (1 hafta)

- **Reorganization**: Feature-based folder structure
- **Module Separation**: `app/features/{tasks,settings,labels}`
- **Shared Components**: `app/components/{common,forms,feedback}`
- **Path Optimization**: Import path sadeleştirme ve cleanup

### 🔮 Orta Vadeli Geliştirmeler (1-2 ay)

#### 🧭 Sprint 3: Enhanced Navigation (1 hafta)

- **Type-Safe Routes**: Route mapping ve parametre modelleri
- **Deep Linking**: URI-based navigation support
- **Animation System**: Modal/sheet transitions
- **Navigation State**: Merkezi navigation state yönetimi

#### ⚡ Sprint 4: Performance & Database (1 hafta)

- **List Virtualization**: Büyük liste optimizasyonu
- **Database Optimization**: Batch operations, indexing, query memoization
- **Bundle Optimization**: Tree-shaking, lazy loading, asset compression
- **Memory Management**: Render optimization ve memory leak prevention

#### 🧪 Sprint 5: Testing Infrastructure (1 hafta)

- **Unit Testing**: Jest setup, utility functions, custom hooks
- **Integration Testing**: React Native Testing Library
- **E2E Testing**: Detox ile smoke tests
- **CI Integration**: Automated test pipeline

### 🌟 Uzun Vadeli Hedefler (3+ ay)

#### 📚 Sprint 6: Developer Experience (3-4 gün)

- **Storybook**: Component isolation ve development
- **Documentation**: Architecture decision records, contributor guide
- **Conventional Commits**: Automated changelog generation
- **Code Quality**: Advanced linting, formatting standards

## 📊 Geliştirme Roadmap

### 🎯 Ölçütler ve Hedefler

**Takip Edilecek Metrikler:**

- ⚡ İlk boyama süresi (First Paint)
- 📱 JS Bundle boyutu
- 🎞️ Liste kaydırma performansı (Frame drops)
- 🎯 Test kapsam yüzdesi
- 🔍 İlk içerik süresi (First Contentful Paint)

**Risk Yönetimi:**

- 💾 Database migration stratejisi
- 🔄 Atomik refactor adımları  
- 🛡️ Feature flag desteği
- ↩️ Geri dönüş planları

**Beklenen Son Durum:**

- 🏗️ Feature-based modular architecture
- 🔄 Global state management
- 🧭 Type-safe navigation
- ⚡ Performance optimizations
- 🧪 Comprehensive testing
- 👥 Enhanced developer experience

### 🚀 Başlamaya Hazır

Her sprint bağımsız değer üretecek şekilde tasarlandı. Yeni özellik ekleme, mevcut feature/* pattern ile sadeleşecek.

---

**💡 Bu roadmap living document olarak güncellenecek ve community feedback'ine göre revize edilecektir.**
