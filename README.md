This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# ChatApp - Real-time Chat Application

Aplikasi chat real-time berbasis React Native dengan Firebase sebagai backend. Dibangun untuk tugas mata kuliah **Pengembangan Berbasis Platform (PBP)**.

## 📱 Fitur

- ✅ Autentikasi anonim menggunakan Firebase Auth
- ✅ Real-time messaging dengan Firestore
- ✅ Interface yang simple dan user-friendly
- ✅ Support untuk Android dan iOS
- ✅ Menampilkan nama pengguna pada setiap pesan
- ✅ Timestamp otomatis pada setiap pesan

## 🛠️ Teknologi yang Digunakan

- **React Native** (v0.82.1) - Framework untuk mobile app development
- **TypeScript** (v5.8.3) - Type safety dan better developer experience
- **Firebase** (v12.6.0)
  - Firebase Authentication (Anonymous Sign-in)
  - Cloud Firestore (Real-time database)
- **React Navigation** (v7.1.20) - Navigasi antar screen
- **Jest** - Unit testing

## 📋 Prerequisites

Sebelum menjalankan aplikasi, pastikan Anda sudah menginstal:

- Node.js (>= 20)
- npm atau yarn
- Android Studio (untuk Android development)
- Xcode (untuk iOS development - macOS only)
- Java Development Kit (JDK)
- React Native CLI

## 🚀 Instalasi

1. Clone repository ini
```bash
git clone <repository-url>
cd ChatApp
```

2. Install dependencies
```bash
npm install
```

3. Install iOS dependencies (macOS only)
```bash
cd ios && pod install && cd ..
```

## ▶️ Menjalankan Aplikasi

### Android
```bash
npm run android
```

### iOS (macOS only)
```bash
npm run ios
```

### Metro Bundler
Jika ingin menjalankan Metro bundler secara terpisah:
```bash
npm start
```

## 🧪 Testing

Menjalankan unit tests:
```bash
npm test
```

## 📂 Struktur Project

```
ChatApp/
├── android/              # Native Android code
├── ios/                  # Native iOS code
├── screens/              # Screen components
│   ├── LoginScreen.tsx   # Login screen untuk input nama
│   └── ChatScreen.tsx    # Main chat screen
├── __tests__/            # Test files
├── App.tsx               # Root component
├── firebase.ts           # Firebase configuration
├── package.json          # Dependencies
└── tsconfig.json         # TypeScript configuration
```

## 🔧 Konfigurasi Firebase

Aplikasi ini menggunakan Firebase untuk autentikasi dan database. Konfigurasi Firebase dapat ditemukan di file `firebase.ts`. 

Jika ingin menggunakan Firebase project sendiri:

1. Buat project baru di [Firebase Console](https://console.firebase.google.com/)
2. Enable Firebase Authentication (Anonymous Sign-in)
3. Buat Firestore Database
4. Salin konfigurasi Firebase Anda ke `firebase.ts`

## 💡 Cara Menggunakan

1. Jalankan aplikasi di emulator atau device
2. Masukkan nama Anda di halaman login
3. Klik "Masuk Chat" untuk masuk ke ruang chat
4. Ketik pesan dan klik "Kirim" untuk mengirim pesan
5. Pesan akan muncul secara real-time untuk semua pengguna

## 🎨 Screenshots

### Login Screen
Halaman untuk memasukkan nama pengguna sebelum masuk ke chat room.

### Chat Screen
Halaman utama chat dengan fitur real-time messaging. Pesan dari pengguna sendiri akan ditampilkan dengan style yang berbeda.

## 📝 Catatan Pengembangan

- Aplikasi menggunakan Firebase Anonymous Authentication untuk simplicity
- Semua pesan disimpan di Firestore collection bernama `messages`
- Pesan diurutkan berdasarkan `createdAt` timestamp
- Styling menggunakan React Native StyleSheet

## 🐛 Troubleshooting

### Build Error di Android
```bash
cd android && ./gradlew clean && cd ..
npm run android
```

### Metro Bundler Cache Issue
```bash
npm start -- --reset-cache
```

### Pod Install Error (iOS)
```bash
cd ios && pod deintegrate && pod install && cd ..
```

## 👨‍💻 Author

Tugas Mata Kuliah Pengembangan Berbasis Platform  
Semester 5

## 📄 License

This project is created for educational purposes.

---

**Note:** Pastikan untuk tidak mempublikasikan Firebase API keys di production. Gunakan environment variables dan implementasikan Firebase Security Rules yang proper.

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
