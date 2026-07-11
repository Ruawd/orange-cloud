//
//  AppNotifications.swift
//  Orange Cloud
//
//  本地通知（方案 A）：BGAppRefreshTask 给后台时间时检测变化并发本地通知。
//  时机由 iOS 调度（依用户使用习惯，延迟数分钟至数小时），是无服务器下的尽力而为。
//

import Foundation
import UserNotifications
import SwiftData

@MainActor
enum AppNotifications {

    static let masterKey = "notificationsEnabled"

    // MARK: - 授权

    static func requestAuthorization() async -> Bool {
        (try? await UNUserNotificationCenter.current()
            .requestAuthorization(options: [.alert, .sound, .badge])) ?? false
    }

    static func authorizationStatus() async -> UNAuthorizationStatus {
        await UNUserNotificationCenter.current().notificationSettings().authorizationStatus
    }

    // MARK: - 后台检测（由 BackgroundRefresh 调用）

    static func runBackgroundChecks(authManager: AuthManager) async {
        let defaults = UserDefaults.standard
        guard defaults.bool(forKey: masterKey),
              await authorizationStatus() == .authorized,
              authManager.isLoggedIn else { return }

        let client = CFAPIClient(authManager: authManager)

        if defaults.bool(forKey: "notifyZoneStatus") {
            await checkZoneStatusChanges(zoneService: ZoneService(client: client))
        }
        if defaults.bool(forKey: "notifyWorkerErrors"),
           authManager.hasScope("account-analytics.read") {
            await checkWorkerErrors(
                analyticsService: AnalyticsService(client: client),
                accountService: AccountService(client: client)
            )
        }
    }

    /// Zone 状态：与 SwiftData 缓存对比，变化即通知并回写缓存
    private static func checkZoneStatusChanges(zoneService: ZoneService) async {
        let context = ModelContext(CacheContainer.shared)
        guard let cached = SafeCache.fetch(FetchDescriptor<CachedZone>(), context: context),
              !cached.isEmpty else { return }

        var changes: [(name: String, from: String, to: String)] = []
        // 按缓存中的账户分组拉取（上限 5 个账户，控制后台时间预算）
        let accountIds = Array(Set(cached.map(\.accountId)).prefix(5))
        for accountId in accountIds {
            guard let zones = try? await zoneService.listZones(accountId: accountId) else { continue }
            let byId = Dictionary(uniqueKeysWithValues: zones.map { ($0.id, $0) })
            for entry in cached where entry.accountId == accountId {
                if let fresh = byId[entry.id], fresh.status != entry.status {
                    changes.append((entry.name, entry.status, fresh.status))
                    entry.update(from: fresh)
                }
            }
        }
        SafeCache.perform("Zone 状态回写") { try context.save() }

        guard !changes.isEmpty else { return }
        if changes.count == 1, let change = changes.first {
            notify(
                title: String(localized: "域名状态变更"),
                body: String(localized: "\(change.name) 状态从 \(change.from) 变为 \(change.to)"),
                id: "zone-status-\(change.name)"
            )
        } else {
            notify(
                title: String(localized: "域名状态变更"),
                body: String(localized: "\(changes.count) 个域名状态发生变化：\(changes.map(\.name).formatted())"),
                id: "zone-status-multi"
            )
        }
    }

    /// Worker 错误：过去 1 小时错误数 > 0 时通知（至少间隔 55 分钟，避免轰炸）
    private static func checkWorkerErrors(
        analyticsService: AnalyticsService,
        accountService: AccountService
    ) async {
        let defaults = UserDefaults.standard
        let lastNotifyKey = "lastWorkerErrorNotify"
        if let last = defaults.object(forKey: lastNotifyKey) as? Date,
           Date().timeIntervalSince(last) < 55 * 60 {
            return
        }
        guard let account = try? await accountService.listAccounts().first,
              let errors = try? await analyticsService.workersErrorsLastHour(accountId: account.id),
              errors > 0 else { return }

        defaults.set(Date(), forKey: lastNotifyKey)
        notify(
            title: String(localized: "Workers 错误"),
            body: String(localized: "过去 1 小时共 \(errors.formatted()) 次调用错误，点击查看详情"),
            id: "worker-errors"
        )
    }

    // MARK: - 发送

    private static func notify(title: String, body: String, id: String) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        let request = UNNotificationRequest(identifier: id, content: content, trigger: nil)
        UNUserNotificationCenter.current().add(request)
    }
}
