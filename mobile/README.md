# Well Care Hospital Mobile App (React Native Expo)

This directory contains the mobile version of the Well Care Hospital Patient Monitoring System built using **React Native & Expo**. It connects to the exact same Firebase Authentication and Firestore database backend, enabling doctors and nurses to track metrics, inspect patient census, and receive critical push notifications on iOS and Android devices.

## Features Mapped
- **Multi-Tenant Login**: Authenticate with email/password, matching hospital tenants.
- **Real-Time Dashboards**: Sync patients stats and list live open alert incidents.
- **Patient Directory**: List clinical records and display active status indicators.
- **Expo Push Notifications**: Hooks ready to register devices and fetch notification payloads.

---

## Installation & Running

1. **Pre-requisites**: Ensure Node.js and the Expo Go app (on your iOS/Android device) are installed.
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Start Dev Server**:
   ```bash
   npx expo start
   ```
4. **Scan QR Code**: Scan the terminal QR code using the Camera app (iOS) or Expo Go app (Android) to test the app live on your phone.

---

## Production Build & Play Store Readiness

To bundle and deploy the app to the Google Play Store or Apple App Store:

1. **Install EAS CLI globally**:
   ```bash
   npm install -g eas-cli
   ```
2. **Log in to Expo account**:
   ```bash
   eas login
   ```
3. **Configure Project Build settings**:
   ```bash
   eas build:configure
   ```
4. **Run production build for Android**:
   ```bash
   eas build --platform android --profile production
   ```
   This generates an AAB (Android App Bundle) which can be directly uploaded to your Google Play Console!
