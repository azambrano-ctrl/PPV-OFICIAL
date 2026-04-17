# Add project specific ProGuard rules here.
# By default, the flags in this file are applied to all build variants.

# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# react-native-video
-keep class com.brentvatne.** { *; }
-dontwarn com.brentvatne.**

# react-native-orientation-locker
-keep class com.github.yamill.orientation.** { *; }

# Keep the app package
-keep class com.arenafightpass.** { *; }

# General Android rules
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
