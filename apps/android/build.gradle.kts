// 顶层构建文件：仅声明插件，不在此 apply。
// AGP 9 的内置 Kotlin 编译自带 KGP 2.2.10；这里显式抬到与 libs.versions.toml 的
// kotlin 版本一致（compose / serialization 编译器插件与 KSP 都按该版本编译，
// 版本错配会在 IR 常量折叠阶段抛 internal compiler error）。改 kotlin 版本时同步改这里。
buildscript {
    dependencies {
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:2.3.21")
    }
}

plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.compose) apply false
    alias(libs.plugins.kotlin.serialization) apply false
    alias(libs.plugins.ksp) apply false
    alias(libs.plugins.hilt) apply false
}
