# Phase 3: Image Upload with Firebase Storage

## ✅ Implementasi Selesai

### 1. **Firebase Storage Setup** (`firebase.ts`)
Added Firebase Storage imports dan exports:
```typescript
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
const storage = getStorage(app);
```

### 2. **Image Service** (`services/imageService.ts`)
Layanan untuk mengelola upload dan caching gambar:

#### Features:
- **Upload Image to Firebase Storage**
  - `uploadImage(uri, userId)` - Upload gambar dan return download URL
  - Auto-generate unique filename dengan timestamp
  - Compress dan convert ke blob sebelum upload
  - Auto-cache URL ke MMKV setelah upload

- **Image URL Caching**
  - `getImageUrl(imageId, fallbackUrl)` - Get dari cache atau fallback
  - Integration dengan mmkvService untuk persistent caching

- **Delete Image** (optional)
  - `deleteImage(imageUrl)` - Hapus gambar dari Storage

### 3. **Updated Message Type** (`types/index.ts`)
```typescript
export type MessageType = {
  id: string;
  text: string;
  user: string;
  userId: string;
  createdAt: { seconds: number; nanoseconds: number } | null;
  imageUrl?: string; // ✅ New field for images
};
```

### 4. **Updated ChatScreen** (`screens/ChatScreen.tsx`)

#### New Features:
1. **Image Picker Button (📷)**
   - Circular button di sebelah kiri input
   - Launch gallery untuk pilih foto
   - Disabled saat offline atau uploading

2. **Image Upload Flow**
   ```
   User tap 📷 → Pick from gallery → Upload to Storage
   → Get download URL → Send message with imageUrl
   → Cache URL to MMKV
   ```

3. **Image Display**
   - Display images dalam message bubbles
   - 200x200 dengan border radius
   - Images cached untuk offline viewing

4. **Upload Progress**
   - Loading spinner saat upload
   - Input disabled during upload
   - Success/error alerts

#### New States:
- `isUploadingImage` - Track upload status

### 5. **Android Permissions** (`AndroidManifest.xml`)
```xml
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
<uses-permission android:name="android.permission.CAMERA" />
```

### 6. **Dependencies**
```json
{
  "react-native-image-picker": "^latest"
}
```

## 📊 Complete Flow Diagram

```
┌─────────────────────────────────────────────────┐
│          USER SENDS IMAGE                       │
├─────────────────────────────────────────────────┤
│ 1. User taps 📷 button                          │
│    └─> launchImageLibrary()                     │
│                                                 │
│ 2. User selects image from gallery              │
│    └─> Get image URI                            │
│                                                 │
│ 3. Upload to Firebase Storage                   │
│    ├─> Convert to blob                          │
│    ├─> Upload with unique filename              │
│    └─> Get download URL                         │
│                                                 │
│ 4. Cache URL to MMKV                            │
│    └─> mmkvService.cacheImageUrl()              │
│                                                 │
│ 5. Send message to Firestore                    │
│    ├─> text: caption or "📷 Foto"               │
│    └─> imageUrl: download URL                   │
│                                                 │
│ 6. Display in chat                              │
│    └─> <Image source={{ uri }} />               │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│          OFFLINE IMAGE VIEWING                  │
├─────────────────────────────────────────────────┤
│ 1. Messages loaded from MMKV cache              │
│ 2. Image URLs also cached in MMKV               │
│ 3. Images can be viewed if already loaded       │
│ 4. Upload disabled when offline                 │
└─────────────────────────────────────────────────┘
```

## 🎯 Architecture Overview

```
┌─────────────────────────────────────────┐
│         AUTHENTICATION                  │
├─────────────────────────────────────────┤
│ • Firebase Auth ✅                      │
│ • Firestore (profiles) ✅              │
│ • AsyncStorage (session) ✅             │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│         CHAT MESSAGES                   │
├─────────────────────────────────────────┤
│ PRIMARY:  Firestore ✅                  │
│ CACHE:    MMKV ✅                       │
│ OFFLINE:  Read from cache ✅            │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│         IMAGE UPLOAD                    │
├─────────────────────────────────────────┤
│ STORAGE:  Firebase Storage ✅           │
│ CACHE:    MMKV (URLs) ✅                │
│ PICKER:   react-native-image-picker ✅  │
│ DISPLAY:  React Native Image ✅         │
└─────────────────────────────────────────┘
```

## 🧪 Testing Checklist

- [ ] **Basic Upload**
  - Tap 📷 button
  - Select image from gallery
  - Wait for upload (see loading spinner)
  - See success alert
  - Image appears in chat

- [ ] **Image Display**
  - Images show in correct message bubbles
  - Images load properly
  - Text caption appears below image

- [ ] **Offline Mode**
  - Turn off internet
  - 📷 button should be disabled
  - Previously sent images still visible (if cached)

- [ ] **Error Handling**
  - Cancel image picker → no error
  - Try upload without internet → error alert

- [ ] **Performance**
  - Images compressed to max 1024x1024
  - Quality set to 0.7 for smaller file size
  - Upload progress shows properly

## 📝 Console Logs to Verify

```
📤 Starting image upload: file:///...
📦 Uploading blob, size: 123456 bytes
✅ Upload complete: chat-images/user123_1234567890.jpg
🔗 Download URL: https://firebasestorage...
💾 Cached to MMKV: user123_1234567890.jpg
```

## 🎨 UI Elements

1. **Image Button**
   - Circular (40x40)
   - Grey background (#f0f0f0)
   - 📷 emoji icon
   - Loading spinner during upload

2. **Message Image**
   - 200x200 size
   - 8px border radius
   - 8px vertical margin
   - Cover resize mode

3. **Input States**
   - Normal: All enabled
   - Offline: All disabled + orange banner
   - Uploading: Input disabled + spinner on button

## 🚀 Next Steps / Enhancements

- [ ] Add image compression before upload
- [ ] Support multiple images
- [ ] Add camera capture (not just gallery)
- [ ] Image preview before send
- [ ] Delete sent images
- [ ] Image loading placeholders
- [ ] Full-screen image view on tap

## 📦 Complete Project Structure

```
services/
├── authService.ts       ✅ Authentication
├── storageService.ts    ✅ AsyncStorage for session
├── mmkvService.ts       ✅ MMKV cache for messages & images
└── imageService.ts      ✅ Firebase Storage upload

screens/
├── LoginScreen.tsx      ✅ Email/password login
├── RegisterScreen.tsx   ✅ User registration
└── ChatScreen.tsx       ✅ Chat + Images + Offline mode

firebase.ts              ✅ Firebase config + Storage
types/index.ts           ✅ TypeScript types (+ imageUrl)
```
