# Google Play Store Deployment Guide

## Overview

DeMar Logistics is deployed to Google Play Store as a **Trusted Web Activity (TWA)** — a lightweight Android wrapper around the existing web app at `logistics.demartransportation.com`.

## Prerequisites

1. **Google Play Developer Account** ($25 one-time fee)
   - Sign up at https://play.google.com/console/signup

2. **App Icons** (PNG format, 512x512 minimum)
   - Replace placeholder SVGs in `public/icons/` with proper PNG icons
   - Run: `npm install sharp && node scripts/generate-icons.js path/to/your-logo.png`

3. **Android Signing Key**
   - Generate a keystore:
     ```bash
     keytool -genkeypair -v \
       -keystore keystore.jks \
       -keyalg RSA -keysize 2048 \
       -validity 10000 \
       -alias demar-logistics \
       -storepass YOUR_STORE_PASSWORD \
       -keypass YOUR_KEY_PASSWORD
     ```
   - Get the SHA-256 fingerprint:
     ```bash
     keytool -list -v -keystore keystore.jks -alias demar-logistics | grep SHA256
     ```
   - **Keep this keystore safe** — you need it for every update

## Setup Steps

### 1. Configure Digital Asset Links

Update `public/.well-known/assetlinks.json` with your signing key's SHA-256 fingerprint. This proves you own both the website and the Android app, enabling the TWA to run in full-screen mode without the browser bar.

### 2. Add GitHub Secrets

In your repo settings (Settings > Secrets and variables > Actions), add:

| Secret | Description |
|--------|-------------|
| `ANDROID_KEYSTORE_BASE64` | Base64-encoded keystore: `base64 -i keystore.jks` |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_PASSWORD` | Key password |

### 3. Build the Android App Bundle

1. Go to **Actions** tab in GitHub
2. Select **"Build Android TWA (Google Play Store)"**
3. Click **"Run workflow"**
4. Enter version code (integer, increment each release) and version name
5. Download the AAB artifact when the build completes

### 4. Upload to Google Play Console

1. Go to https://play.google.com/console
2. Create a new app:
   - **App name**: DeMar Logistics
   - **Category**: Business > Logistics
   - **Default language**: English (United States)
3. Complete the **Store listing**:
   - Short description: "Freight brokerage management for DeMar Transportation"
   - Full description: Describe the app's features (load management, tracking, dispatch, etc.)
   - Add screenshots (at minimum: phone and tablet)
   - Feature graphic (1024x500 PNG)
   - App icon (512x512 PNG)
4. Go to **Release > Production** (or start with Internal/Closed testing)
5. Upload the `.aab` file from the build artifacts
6. Complete **Content rating** questionnaire
7. Set **Pricing & distribution** (likely "Free" with restricted access)
8. Submit for review

## Play Store Listing Details

| Field | Value |
|-------|-------|
| Package name | `com.demartransportation.logistics` |
| Category | Business |
| Content rating | Likely "Everyone" |
| Target audience | Business users (freight brokers, carriers, shippers) |

## Updating the App

The TWA automatically serves the latest version of your web app — no app update needed for web changes. You only need to publish a new version to the Play Store if you change:
- The TWA configuration (theme, icons, package settings)
- The signing key
- Version code/name for store compliance

## Troubleshooting

### Browser bar showing instead of fullscreen
- Verify `assetlinks.json` is accessible at `https://logistics.demartransportation.com/.well-known/assetlinks.json`
- Ensure the SHA-256 fingerprint matches your signing key
- Clear Chrome data on the test device

### Build failures
- Check that all GitHub secrets are set correctly
- Ensure the keystore base64 encoding is correct: `cat keystore.jks | base64 -w 0`
