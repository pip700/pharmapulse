const fs = require('fs');
const path = require('path');
const os = require('os');
const child_process = require('child_process');

console.log('------------------------------------------------');
console.log('🔧 Configuring Android Environment');
console.log('------------------------------------------------');

const localPropsPath = path.join(__dirname, 'android', 'local.properties');

// 1. Check for Spaces in Path
if (process.cwd().includes(' ')) {
    console.warn('\n⚠️  WARNING: Your project path contains spaces:');
    console.warn(`   "${process.cwd()}"`);
    console.warn('   Android build tools often FAIL when the path has spaces.');
}

// 2. List of potential SDK locations (Expanded)
const candidates = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    path.join(os.homedir(), 'Android', 'Sdk'),                     // Linux/Mac Default
    path.join(os.homedir(), '.android', 'sdk'),                    // Hidden config
    path.join(os.homedir(), 'snap', 'android-studio', 'current', 'Android', 'Sdk'), // Snap package
    path.join(os.homedir(), 'AppData', 'Local', 'Android', 'Sdk'), // Windows Default
    '/usr/lib/android-sdk',                                        // Debian/Ubuntu Package
    '/usr/local/android-sdk',
    '/opt/android-sdk',                                            // Arch/Generic Linux
    '/opt/android-studio/data/sdk',
    '/Library/Android/sdk'                                         // macOS Alternative
];

// Find the first path that actually exists
let sdkPath = candidates.find(p => p && fs.existsSync(p));

if (!sdkPath) {
    console.warn('⚠️  WARNING: Auto-detection of Android SDK failed.');
    console.warn('   Falling back to default location. If build fails, install Android Studio.');
    sdkPath = path.join(os.homedir(), 'Android', 'Sdk');
} else {
    console.log(`✅ SDK found at: ${sdkPath}`);
}

// 3. Create local.properties
try {
  fs.writeFileSync(localPropsPath, `sdk.dir=${sdkPath}`);
  console.log(`✅ Created local.properties`);
} catch (err) {
  console.error('❌ Failed to create local.properties:', err);
}

// 4. ATTEMPT TO ACCEPT LICENSES
console.log('\n🔐 Checking Android Licenses...');
const licenseDir = path.join(sdkPath, 'licenses');
const licenses = {
    'android-sdk-license': '\n8933bad161af4178b1185d1a37fbf41ea5269c55\nd56f5187479451eabf01fb78af6dfcb131a6481e\n24333f8a63b6825ea9c5514f83c2829b004d1fee\n',
    'android-sdk-preview-license': '\n84831b9409646a918e30573bab4c9c91346d8abd\n',
    'intel-android-extra-license': '\nd975f751698a77b662f1254ddbeed3901e976f5a\n'
};

try {
    if (!fs.existsSync(licenseDir)) {
        try {
            fs.mkdirSync(licenseDir, { recursive: true });
        } catch (e) {}
    }

    for (const [filename, hash] of Object.entries(licenses)) {
        const filePath = path.join(licenseDir, filename);
        if (!fs.existsSync(filePath)) {
            console.log(`   Writing accepted license: ${filename}`);
            fs.writeFileSync(filePath, hash);
        }
    }
    console.log('✅ Licenses accepted successfully.');

} catch (err) {
    console.error('\n❌ ERROR: PERMISSION DENIED WRITING LICENSES');
    console.error(`   The SDK at "${sdkPath}" is likely owned by root.`);
    console.error('   Running with "sudo" might fix this, or run:');
    console.error(`   sudo yes | ${path.join(sdkPath, 'cmdline-tools/latest/bin/sdkmanager')} --licenses`);
}

// 5. UPDATE GRADLE WRAPPER (Fix for Java 21)
console.log('\n📦 Checking Gradle Version...');
const wrapperPropsPath = path.join(__dirname, 'android', 'gradle', 'wrapper', 'gradle-wrapper.properties');

if (fs.existsSync(wrapperPropsPath)) {
    let content = fs.readFileSync(wrapperPropsPath, 'utf8');
    const gradleVersionMatch = content.match(/gradle-([0-9.]+)-/);
    
    if (gradleVersionMatch) {
        const currentVersion = gradleVersionMatch[1];
        console.log(`   Current Gradle Version: ${currentVersion}`);
        
        const [major, minor] = currentVersion.split('.').map(Number);
        
        // Upgrade if version is < 8.5
        if (major < 8 || (major === 8 && minor < 5)) {
             console.log('   ⚠️  Detected Gradle version incompatible with Java 21.');
             console.log('   🚀 Upgrading Gradle Wrapper to 8.5...');
             
             // Regex Replace
             const newContent = content.replace(/gradle-[0-9.]+-all.zip/, 'gradle-8.5-all.zip');
             fs.writeFileSync(wrapperPropsPath, newContent);
             console.log('   ✅ Updated gradle-wrapper.properties');
        } else {
            console.log('   ✅ Gradle version is compatible.');
        }
    }
}

// 6. PATCH ANDROID PROJECT FILES (Fix for Java 21 + Android SDK issues)
console.log('\n🔧 Patching Android Project Config...');

const variablesPath = path.join(__dirname, 'android', 'variables.gradle');
if (fs.existsSync(variablesPath)) {
    let vars = fs.readFileSync(variablesPath, 'utf8');
    // Bump versions to 34 to ensure better compatibility with newer tools
    // Using regex to replace whatever value is there
    vars = vars.replace(/compileSdkVersion\s*=\s*[0-9]+/, 'compileSdkVersion = 34');
    vars = vars.replace(/targetSdkVersion\s*=\s*[0-9]+/, 'targetSdkVersion = 34');
    fs.writeFileSync(variablesPath, vars);
    console.log('   ✅ Updated variables.gradle (SDK 34)');
} else {
    console.warn('   ⚠️ variables.gradle not found.');
}

const buildGradlePath = path.join(__dirname, 'android', 'build.gradle');
if (fs.existsSync(buildGradlePath)) {
    let build = fs.readFileSync(buildGradlePath, 'utf8');
    // Update AGP to 8.2.1 (Compatible with Gradle 8.2+ and Java 17/21)
    const agpRegex = /classpath\s+['"]com\.android\.tools\.build:gradle:[0-9.]+['"]/;
    if (agpRegex.test(build)) {
         build = build.replace(agpRegex, "classpath 'com.android.tools.build:gradle:8.2.1'");
         console.log('   ✅ Updated build.gradle (AGP 8.2.1)');
    }
    fs.writeFileSync(buildGradlePath, build);
} else {
    console.warn('   ⚠️ build.gradle not found.');
}

console.log('------------------------------------------------');
