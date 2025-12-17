# PharmaPulse - Pharmacy Management System

A comprehensive React + Electron + Capacitor application designed for pharmacy inventory management, billing, and analytics.

## 🚀 Features

- **Inventory Tracking**: Real-time stock levels, low stock alerts, and expiry tracking.
- **Smart Billing (POS)**: Quick cart management, receipt generation, and sales history.
- **Auto-Order**: Intelligent suggestions for restocking based on threshold levels.
- **Analytics**: Visual charts for revenue, profit trends, and category performance.
- **Secure Access**: PIN-based authentication for owner security.
- **Cross-Platform**: Runs on Web, Desktop (Linux/Windows/Mac), and Mobile (iOS/Android).

## ⚠️ IMPORTANT: Fix Build Error
If your iOS Build fails with `xcodebuild: error: The directory ... does not contain an Xcode project`, it means you have conflicting workflow files.

**To fix this:**
1. Open your project folder.
2. Go to `.github/workflows/`.
3. **DELETE** any file that is **NOT** named `build-ios.yml` (e.g., delete `swift.yml`, `xcode.yml`, `objective-c.yml`).
4. Commit and push again.

## 🛠 Project Setup

### Prerequisites
- Node.js (v18 or v20 recommended)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/pharmapulse.git
   cd pharmapulse
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Run Locally (Web)**
   ```bash
   npm run dev
   ```

## 📱 Building for Mobile (iOS)

This project uses **GitHub Actions** to build the iOS `.ipa` file automatically, so you don't need a Mac.

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Update app"
   git push origin main
   ```
   *(If you get a rejection error, try `git push -f origin main`)*

2. **Download the App**:
   - Go to your GitHub Repository -> **Actions** tab.
   - Click on the latest "Build iOS IPA" workflow run.
   - Scroll down to **Artifacts** and download `ios-app-unsigned`.

## 🖥 Building for Desktop

To build a `.deb` (Linux) or `.exe` (Windows) file:

```bash
# Linux
npm run dist:linux

# Windows
npm run dist:win
```

## 🔐 Default Login
- **PIN**: `1234`
