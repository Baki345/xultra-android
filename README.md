# XULTRA App (Capacitor Android)

L'app charge **https://xultra.space** (toujours a jour).

## Prerequisites
- Node.js 18+
- Android Studio (SDK + telephone en mode dev)

## Setup une fois

```bash
cd xultra-android
npm install
npx cap add android
```

### Permissions AndroidManifest.xml (avant <application>)

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
```

```bash
npx cap sync android
npx cap open android
```

Run dans Android Studio.

## APK / Play Store
Build > Generate Signed Bundle / APK

## Updates
Avec server.url = https://xultra.space : rien a rebuilder apres un deploy web.

## App ID
space.xultra.app
