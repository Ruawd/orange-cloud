//
//  MainTabView.swift
//  Orange Cloud
//
//  iPhone 底部 Tab，iPad 自动侧边栏（sidebarAdaptable，iOS 18+）；iOS 17 回退经典 TabView。
//  iOS 26 自动 Liquid Glass TabBar。
//

import SwiftUI

struct MainTabView: View {

    @Environment(SessionStore.self) private var session
    @Environment(AuthManager.self) private var auth
    @State private var selectedTab: AppTab = .dashboard
    private let router = AppRouter.shared

    var body: some View {
        tabContainer
            .task {
                consumePendingRoute()
                await session.ensureAccounts()
            }
            .onChange(of: router.pendingModule) {
                consumePendingRoute()
            }
    }

    @ViewBuilder
    private var tabContainer: some View {
        if #available(iOS 18.0, *) {
            // iOS 18+：值式 Tab + 侧边栏自适应（iPad 自动侧边栏）
            TabView(selection: $selectedTab) {
                Tab("概览", systemImage: "square.grid.2x2", value: AppTab.dashboard) {
                    dashboardTab
                }
                Tab("域名", systemImage: "globe", value: AppTab.zones) {
                    zonesTab
                }
                Tab("开发者", systemImage: "chevron.left.forwardslash.chevron.right", value: AppTab.developer) {
                    developerTab
                }
                Tab("存储", systemImage: "externaldrive", value: AppTab.storage) {
                    storageTab
                }
                Tab("设置", systemImage: "gear", value: AppTab.settings) {
                    settingsTab
                }
            }
            .tabViewStyle(.sidebarAdaptable)
        } else {
            // iOS 17：经典 TabView（底部 Tab；iPad 不走侧边栏自适应）
            TabView(selection: $selectedTab) {
                dashboardTab
                    .tabItem { Label("概览", systemImage: "square.grid.2x2") }
                    .tag(AppTab.dashboard)
                zonesTab
                    .tabItem { Label("域名", systemImage: "globe") }
                    .tag(AppTab.zones)
                developerTab
                    .tabItem { Label("开发者", systemImage: "chevron.left.forwardslash.chevron.right") }
                    .tag(AppTab.developer)
                storageTab
                    .tabItem { Label("存储", systemImage: "externaldrive") }
                    .tag(AppTab.storage)
                settingsTab
                    .tabItem { Label("设置", systemImage: "gear") }
                    .tag(AppTab.settings)
            }
        }
    }

    // MARK: - Tab 内容（两套 TabView 写法共用）

    // 各资源 Tab 用 .id(selectedAccount) 绑定当前账号：账号切换时整页重建，
    // 让按账号过滤的 @Query 谓词刷新、列表数据重新拉取（资源跟着选中账号走）。

    @ViewBuilder private var dashboardTab: some View {
        // 账号维度的重建（.id）在 DashboardView 内部、NavigationStack 之内完成——
        // 在这里加 .id 会把可见导航栏连栈一起重建，iOS 17.0.x 必崩（详见 DashboardView 注释）。
        DashboardView(session: session)
    }

    @ViewBuilder private var zonesTab: some View {
        ZoneListView(session: session)
            .id(session.selectedAccount?.id)
    }

    @ViewBuilder private var developerTab: some View {
        // 开发者平台聚合入口：Workers / Queues / Durable Objects / Hyperdrive / Workers AI / AI Gateway
        DeveloperHubView(session: session)
            .id(session.selectedAccount?.id)
    }

    @ViewBuilder private var storageTab: some View {
        StorageView(session: session)
            .id(session.selectedAccount?.id)
    }

    @ViewBuilder private var settingsTab: some View {
        SettingsView()
    }

    /// App Intent（Siri/快捷指令/Spotlight）发起的跳转
    private func consumePendingRoute() {
        guard let module = router.pendingModule else { return }
        router.pendingModule = nil
        selectedTab = switch module {
        case .dashboard: .dashboard
        case .zones:     .zones
        case .workers:   .developer    // Workers 现归入「开发者」聚合 Tab
        case .storage:   .storage
        case .settings:  .settings
        }
    }

    enum AppTab: Hashable {
        case dashboard, zones, developer, storage, settings
    }
}
