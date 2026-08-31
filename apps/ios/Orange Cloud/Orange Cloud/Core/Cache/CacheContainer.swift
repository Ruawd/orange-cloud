//
//  CacheContainer.swift
//  Orange Cloud
//
//  全局共享的 SwiftData 容器：App 主界面与 App Intents 共用同一存储。
//

import Foundation
import SwiftData

nonisolated enum CacheContainer {

    /// 容器可在启动自检后被就地替换（见 warmUp），故为 var。
    /// 只在主线程、且在 SwiftUI 取用 `shared` 之前替换，替换后全程只读。
    @MainActor private static var container: ModelContainer = makeContainer()

    @MainActor static var shared: ModelContainer { container }

    private static var schema: Schema {
        Schema([
            CachedZone.self,
            CachedDNSRecord.self,
            CachedWorkerScript.self,
        ])
    }

    // cloudKitDatabase 必须显式 .none：App 带 iCloud entitlement 时 .automatic 会
    // 强制开启 CloudKit 同步，而 CloudKit 不允许非可选属性和 @Attribute(.unique)。
    // 缓存数据本就按账号实时拉取，无需跨设备同步。
    private static var diskConfiguration: ModelConfiguration {
        ModelConfiguration(schema: schema, isStoredInMemoryOnly: false, cloudKitDatabase: .none)
    }

    private static var memoryConfiguration: ModelConfiguration {
        ModelConfiguration(schema: schema, isStoredInMemoryOnly: true, cloudKitDatabase: .none)
    }

    @MainActor
    private static func makeContainer() -> ModelContainer {
        let configuration = diskConfiguration
        // 旧版本（≤2.1.0）会给下次启动留清库标记，此处照旧消费一次，避免老装机被搁浅。
        if UserDefaults.standard.bool(forKey: legacyRebuildFlagKey) {
            AppLog.app.notice("消费旧版清库标记，启动前清库重建")
            destroyStoreFiles(at: configuration.url)
            UserDefaults.standard.removeObject(forKey: legacyRebuildFlagKey)
            UserDefaults.standard.removeObject(forKey: legacyExceptionCountKey)
        }
        do {
            return try ModelContainer(for: schema, configurations: [configuration])
        } catch {
            // 缓存是可随时按账号从 API 重拉的非关键数据，绝不让它的损坏 / 不兼容把 App 在
            // 启动瞬间崩掉（旧写法在此 fatalError）。先清掉磁盘存储重建；仍失败则退到内存
            // 容器（本次不落盘），保证一定能启动。
            AppLog.app.error("ModelContainer 创建失败，尝试清库重建：\(error.localizedDescription)")
            destroyStoreFiles(at: configuration.url)
            if let rebuilt = try? ModelContainer(for: schema, configurations: [configuration]) {
                return rebuilt
            }
            AppLog.app.error("清库后仍失败，回退内存容器（缓存本次不落盘）")
            return try! ModelContainer(for: schema, configurations: [memoryConfiguration])
        }
    }

    // MARK: - 启动自检与就地修复

    /// 启动早期做一次实体解析自检，坏了就当场把容器换掉。
    ///
    /// Sentry APPLE-IOS-1（1.9.2~2.1.0，iOS 17.0 为主）：某些设备上 ModelContainer 创建
    /// 「成功」了，但它的实体描述整个不可用——同一会话里 warmUp 的空谓词 fetch、syncZones、
    /// syncWorkers、dnsRecordCount 回写全部抛
    /// `could not locate an NSEntityDescription for entity name '…'`，次数一比一对应。
    /// 坏的是模型注册而非 store 文件，所以旧的「标记 → 下次启动删库」既治不好，又让这批
    /// 用户每次启动都丢一次缓存。改为当场重建，且**先不动磁盘数据**：
    ///   ① 换一个新容器（多为本次进程的注册问题，磁盘数据是好的，用户缓存不丢）
    ///   ② 仍坏才清库重建（这时才是 store 真损坏）
    ///   ③ 再坏退内存容器（本次不落盘，但 App 全程可用）
    /// 必须在 SwiftUI 取用 `shared` 之前调用（App.init 里），换容器才能同时惠及 @Query。
    @MainActor
    static func warmUp() {
        guard !SafeCache.probe(container) else { return }
        AppLog.app.error("缓存库启动自检失败（实体描述不可用），就地重建容器")
        repairContainer()
    }

    /// 运行中连续异常时的兜底修复（每进程至多一次）。启动自检已覆盖绝大多数情况，
    /// 这里只处理「启动时是好的、跑着跑着坏掉」的残余场景；已被 SwiftUI 持有的 @Query
    /// 仍绑在旧容器上，故只求让命令式读写恢复，不追求全量生效。
    @MainActor
    static func repairIfNeeded() {
        guard !hasRepairedThisLaunch, !SafeCache.probe(container) else { return }
        AppLog.app.error("缓存库运行中失效，尝试就地重建容器")
        repairContainer()
    }

    @MainActor private static var hasRepairedThisLaunch = false

    @MainActor
    private static func repairContainer() {
        hasRepairedThisLaunch = true
        let configuration = diskConfiguration

        if let rebuilt = try? ModelContainer(for: schema, configurations: [configuration]),
           SafeCache.probe(rebuilt) {
            container = rebuilt
            AppLog.app.notice("缓存容器重建成功（磁盘数据保留）")
            return
        }

        destroyStoreFiles(at: configuration.url)
        if let rebuilt = try? ModelContainer(for: schema, configurations: [configuration]),
           SafeCache.probe(rebuilt) {
            container = rebuilt
            AppLog.app.notice("缓存清库重建成功")
            return
        }

        if let memory = try? ModelContainer(for: schema, configurations: [memoryConfiguration]),
           SafeCache.probe(memory) {
            container = memory
            AppLog.app.error("缓存退回内存容器（本次不落盘）")
            return
        }
        // 三条路都不通：保持原容器，所有读写继续被 SafeCache 兜成「无缓存」，App 照常可用。
        AppLog.app.error("缓存容器重建失败，本次运行按无缓存降级")
    }

    // MARK: - 旧版遗留键（只读取清理，不再写入）

    private static let legacyRebuildFlagKey = "ocCacheStoreNeedsRebuild"
    private static let legacyExceptionCountKey = "ocCacheFetchExceptionCount"

    /// 删除磁盘上的 SwiftData 存储文件（含 -wal / -shm 旁文件），供损坏后清库重建。
    private static func destroyStoreFiles(at storeURL: URL) {
        let fm = FileManager.default
        let dir = storeURL.deletingLastPathComponent()
        let name = storeURL.lastPathComponent          // 默认为 "default.store"
        for suffix in ["", "-wal", "-shm"] {
            try? fm.removeItem(at: dir.appendingPathComponent(name + suffix))
        }
    }
}
