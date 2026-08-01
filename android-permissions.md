# Permissions à ajouter dans android/app/src/main/AndroidManifest.xml

Dans la balise <manifest> :

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
```

Et dans <application> si besoin WebRTC :
```xml
android:usesCleartextTraffic="false"
```
