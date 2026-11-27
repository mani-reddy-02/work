import java.io.FileInputStream
import java.util.Properties

plugins {
  alias(libs.plugins.android.application)
}

val keystorePropertiesFile = rootProject.file("keystore.properties")
val keystoreProperties = Properties()
if (keystorePropertiesFile.exists()) {
  FileInputStream(keystorePropertiesFile).use { keystoreProperties.load(it) }
}

android {
  namespace = "in.mediquee.app"
  compileSdk = 36

  defaultConfig {
    applicationId = "in.mediquee.app"
    minSdk = 24
    targetSdk = 36
    versionCode = 1
    versionName = "1.0.0"

    manifestPlaceholders["fileProviderAuthority"] = "in.mediquee.app.fileprovider"
  }

  signingConfigs {
    create("release") {
      if (keystorePropertiesFile.exists()) {
        storeFile = rootProject.file(keystoreProperties.getProperty("storeFile"))
        storePassword = keystoreProperties.getProperty("storePassword")
        keyAlias = keystoreProperties.getProperty("keyAlias")
        keyPassword = keystoreProperties.getProperty("keyPassword")
      }
    }
  }

  buildTypes {
    release {
      isMinifyEnabled = true
      isShrinkResources = true
      proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
      if (keystorePropertiesFile.exists()) {
        signingConfig = signingConfigs.getByName("release")
      }
    }
  }

  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
  }

  buildFeatures {
    aidl = false
    buildConfig = false
    shaders = false
  }

  packaging {
    resources {
      excludes += "/META-INF/{AL2.0,LGPL2.1}"
    }
  }
}

dependencies {
  implementation(libs.androidx.core.ktx)
  implementation(libs.androidbrowserhelper)
  testImplementation(libs.junit)
}
