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
- [Geliştirme Yol Haritası](#-geliştirme-yol-haritası)

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

Bu uygulama, mevcut kodu bozmadan kademeli iyileştirme süreci planlanan bir projedir. Her aşama bağımsız değer üretecek şekilde tasarlanmıştır.

### 🔧 **Altyapı ve Temel Geliştirmeler**

#### 📋 Proje Altyapısı

- **Git İş Akışı**: Korumalı dallar ve code review süreci
- **Otomatizasyon**: TypeScript strict mode, ESLint, CI/CD pipeline
- **Geliştirici Araçları**: Path aliases, Metro resolver optimizasyonu
- **Kod Kalitesi**: Enhanced linting rules ve formatting standartları

#### 🏗️ Mimari İyileştirmeler

- **Durum Yönetimi**: Zustand ile merkezi state management
- **Hata Yönetimi**: Error boundaries ve user-friendly error handling
- **Yükleme Durumları**: Loading states, skeleton screens, empty state patterns
- **Klasör Yapısı**: Feature-based organization ve modül ayrımı

### 🚀 **Performans ve Kullanıcı Deneyimi**

#### 🧭 Navigasyon Geliştirmeleri

- **Tip Güvenliği**: Type-safe routing ve parametre yönetimi
- **Derin Bağlantılar**: URI-based navigation desteği
- **Animasyonlar**: Smooth transitions ve modal geçişleri
- **State Management**: Navigation state merkezi yönetimi

#### ⚡ Performans Optimizasyonları

- **Liste Optimizasyonu**: Virtualization ve lazy loading
- **Veritabanı**: Batch operations, indexing, query optimization
- **Bundle**: Tree-shaking, code splitting, asset compression
- **Bellek Yönetimi**: Memory leak prevention ve render optimization

### 🧪 **Kalite ve Test Altyapısı**

#### Test Sistemleri

- **Birim Testleri**: Jest setup, utility functions, custom hooks
- **Entegrasyon Testleri**: React Native Testing Library
- **Uçtan Uca Testler**: Temel smoke test senaryoları
- **Otomatizasyon**: CI/CD test pipeline entegrasyonu

#### Geliştirici Araçları

- **Dokümantasyon**: Architecture decision records, contributor guide
- **Commit Standartları**: Conventional commits ve automated changelog
- **Kod Kalitesi**: Advanced linting, formatting, type checking

## 📊 Geliştirme Yol Haritası

### 🎯 Proje Hedefleri

**TodoMobile için Öncelikli Alanlar:**

- 📝 **Görev Yönetimi**: Alt görevler, etiketler, kategoriler
- 🔄 **Senkronizasyon**: Offline-first yaklaşımı
- 🎨 **Kullanıcı Deneyimi**: Smooth animasyonlar, gesture support
- 📊 **Veri Görselleştirme**: Progress tracking, istatistikler
- 🔍 **Arama ve Filtreleme**: Gelişmiş arama özellikleri

### 📈 Kalite Metrikleri

**Takip Edilecek Ölçümler:**

- 🧪 **Test Kapsamı**: Minimum %80 test coverage
- 📱 **Uygulama Boyutu**: APK/IPA boyut optimizasyonu
- ⚡ **Performans**: 60 FPS liste scrolling
- 🐛 **Hata Oranı**: Crash-free sessions %99+
- 👤 **Kod Kalitesi**: TypeScript strict mode compliance

### 🔐 Risk Yönetimi

**TodoMobile Özel Riskler:**

- 💾 **Veri Kaybı**: SQLite backup stratejileri
- 🔄 **Migration**: Veritabanı şema değişiklikleri  
- 📱 **Platform Uyumluluğu**: iOS/Android parity
- 🔧 **Dependency Updates**: React Native version upgrades
- 👥 **Code Maintainability**: Documentation ve code organization

### 🎯 Hedeflenen Sonuç

**Proje Tamamlandığında:**

- ✅ **Modüler Mimari**: Feature-based organization
- ✅ **Offline Support**: Tam offline kullanılabilirlik
- ✅ **Modern UI/UX**: Material Design 3 / iOS Human Interface
- ✅ **Test Coverage**: Kapsamlı test suite
- ✅ **Developer Experience**: Hot reload, debugging tools
- ✅ **Production Ready**: Store deployment hazır

### 🚀 Katkıda Bulunma

Proje açık kaynak ve katkılara açıktır. Yeni özellik önerileri ve hata raporları için GitHub Issues kullanabilirsiniz.
