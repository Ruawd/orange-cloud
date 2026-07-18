//
//  D1QueryView.swift
//  Orange Cloud
//
//  D1 SQL 查询控制台：表入口（→ D1TableView 浏览/编辑）+ SQL 编辑器 + 结果卡片。
//  入口：StorageView 的 D1 段。
//

import SwiftUI

/// 待删除表的 sheet 载荷（String 非 Identifiable，包一层用于 .sheet(item:)）
private struct DropTarget: Identifiable {
    let id = UUID()
    let name: String
}

// MARK: - SQL 查询控制台

struct D1QueryView: View {

    let database: D1Database
    let session: SessionStore

    @Environment(AuthManager.self) private var auth
    @State private var viewModel: D1QueryViewModel
    @State private var showLimitReminder = false
    @State private var tableToDrop: DropTarget?
    @FocusState private var sqlFocused: Bool

    init(database: D1Database, session: SessionStore) {
        self.database = database
        self.session = session
        _viewModel = State(initialValue: D1QueryViewModel(
            service: session.d1Service,
            accountId: session.selectedAccount?.id ?? "",
            databaseId: database.uuid
        ))
    }

    private var canWrite: Bool { auth.hasScope("d1.write") }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                tablesIsland

                sqlEditor

                if let error = viewModel.error {
                    Text(error)
                        .font(.footnote)
                        .foregroundStyle(.red)
                        .padding(.horizontal, 4)
                }

                ForEach(Array(viewModel.results.enumerated()), id: \.offset) { index, result in
                    D1ResultCard(
                        result: result,
                        index: index,
                        total: viewModel.results.count,
                        originalRowCount: viewModel.originalRowCounts.indices.contains(index)
                            ? viewModel.originalRowCounts[index]
                            : (result.results?.count ?? 0)
                    )
                }
            }
            .padding()
        }
        .background { SkyBackground() }
        .navigationTitle(database.name)
        .navigationBarTitleDisplayMode(.inline)
        .task { await viewModel.loadTables() }
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    sqlFocused = false
                    // 不带 LIMIT 的 SELECT 在大表上会整包返回：先提醒，确认后再执行
                    if viewModel.needsLimitReminder {
                        showLimitReminder = true
                    } else {
                        Task { await viewModel.run() }
                    }
                } label: {
                    if viewModel.isRunning {
                        ProgressView()
                    } else {
                        Label("执行", systemImage: "play.fill")
                    }
                }
                .disabled(viewModel.isRunning)
            }
        }
        .sensoryFeedback(.success, trigger: viewModel.didRun)
        .confirmationDialog("查询未带 LIMIT", isPresented: $showLimitReminder, titleVisibility: .visible) {
            Button("仍要执行") {
                Task { await viewModel.run() }
            }
            Button("取消", role: .cancel) {}
        } message: {
            Text("大表可能返回大量行，造成等待和内存占用。建议加 LIMIT 后执行。")
        }
        .sheet(item: $tableToDrop) { target in
            D1DropTableConfirmView(tableName: target.name, viewModel: viewModel)
        }
    }

    /// 表入口：玻璃岛列表，点按进入 D1TableView 浏览/编辑行
    @ViewBuilder
    private var tablesIsland: some View {
        if !viewModel.tablesLoaded || !viewModel.tables.isEmpty {
            VStack(alignment: .leading, spacing: 8) {
                Label("表", systemImage: "tablecells")
                    .font(.footnote.bold())
                    .foregroundStyle(.secondary)
                if !viewModel.tablesLoaded {
                    SkeletonIslandRows(rows: 3, icon: .rounded(width: 22, height: 18), showsSubtitle: false)
                } else {
                    VStack(spacing: 0) {
                        ForEach(viewModel.tables, id: \.self) { table in
                            NavigationLink {
                                D1TableView(database: database, tableName: table, session: session)
                            } label: {
                                HStack(spacing: 10) {
                                    Image(systemName: "tablecells")
                                        .font(.footnote)
                                        .foregroundStyle(.secondary)
                                        .frame(width: 22)
                                    Text(table)
                                        .font(.callout.monospaced())
                                        .foregroundStyle(.primary)
                                        .lineLimit(1)
                                        .truncationMode(.middle)
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption2.weight(.semibold))
                                        .foregroundStyle(.tertiary)
                                }
                                .padding(.horizontal, OCLayout.islandPadding)
                                .padding(.vertical, 11)
                                .contentShape(Rectangle())
                            }
                            .buttonStyle(.plain)
                            .contextMenu {
                                if canWrite {
                                    Button(role: .destructive) {
                                        tableToDrop = DropTarget(name: table)
                                    } label: {
                                        Label("删除表", systemImage: "trash")
                                    }
                                }
                            }

                            if table != viewModel.tables.last {
                                Divider()
                                    .padding(.leading, 46)
                            }
                        }
                    }
                    .glassIsland(cornerRadius: OCLayout.chipRadius)
                }
            }
        }
    }

    private var sqlEditor: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("SQL", systemImage: "terminal")
                .font(.footnote.bold())
                .foregroundStyle(.secondary)
            TextEditor(text: Binding(
                get: { viewModel.sql },
                set: { viewModel.sql = $0 }
            ))
            .font(.callout.monospaced())
            .textInputAutocapitalization(.never)
            .autocorrectionDisabled()
            .focused($sqlFocused)
            .frame(minHeight: 100, maxHeight: 180)
            .scrollContentBackground(.hidden)
            .padding(8)
            .glassIsland(cornerRadius: OCLayout.chipRadius)
            // SQL 始终 LTR，避免在 RTL 语言下镜像
            .environment(\.layoutDirection, .leftToRight)

            if !canWrite {
                Label("当前授权为只读（d1.read），写入语句会被 Cloudflare 拒绝", systemImage: "lock")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }
}

// MARK: - 结果卡片

private struct D1ResultCard: View {

    let result: D1QueryResult
    let index: Int
    let total: Int
    /// 截断前的原始行数（ViewModel 只保留前 maxStoredRows 行驻留内存）
    let originalRowCount: Int

    private static let maxRows = 100
    /// 单元格展示截断：完整大字段进 Text 会把 CoreText 排版拖上主线程
    private static let cellLimit = 256

    private var rows: [[String: JSONValue]] { result.results ?? [] }

    private var columns: [String] {
        guard let first = rows.first else { return [] }
        return first.keys.sorted()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            if total > 1 {
                Text("语句 \(index + 1)")
                    .font(.footnote.bold())
                    .foregroundStyle(.secondary)
            }

            if rows.isEmpty {
                Label(result.success ? String(localized: "执行成功，无返回行") : String(localized: "执行失败"), systemImage: result.success ? "checkmark.circle" : "xmark.circle")
                    .font(.callout)
                    .foregroundStyle(result.success ? .green : .red)
            } else {
                ScrollView(.horizontal, showsIndicators: true) {
                    Grid(alignment: .leading, horizontalSpacing: 16, verticalSpacing: 6) {
                        GridRow {
                            ForEach(columns, id: \.self) { column in
                                Text(column)
                                    .font(.caption.bold())
                                    .foregroundStyle(.secondary)
                            }
                        }
                        Divider()
                        ForEach(Array(rows.prefix(Self.maxRows).enumerated()), id: \.offset) { _, row in
                            GridRow {
                                ForEach(columns, id: \.self) { column in
                                    Text(cellDisplay(row[column]))
                                        .font(.caption.monospaced())
                                        .lineLimit(1)
                                }
                            }
                        }
                    }
                    .padding(.vertical, 4)
                }
                // 查询结果表（列名/数据值）保持 LTR 列序
                .environment(\.layoutDirection, .leftToRight)
                if originalRowCount > Self.maxRows {
                    Text("仅显示前 \(Self.maxRows) 行（共 \(originalRowCount) 行）")
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                }
            }

            if let meta = result.meta {
                HStack(spacing: 12) {
                    if let duration = meta.duration {
                        Label(String(format: "%.1f ms", duration), systemImage: "clock")
                    }
                    if let read = meta.rowsRead {
                        Label("读 \(read)", systemImage: "eye")
                    }
                    if let written = meta.rowsWritten, written > 0 {
                        Label("写 \(written)", systemImage: "pencil")
                    }
                }
                .font(.caption2)
                .foregroundStyle(.tertiary)
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .glassIsland()
    }

    private func cellDisplay(_ value: JSONValue?) -> String {
        guard let value else { return "NULL" }
        let text = value.displayText
        return text.count > Self.cellLimit ? String(text.prefix(Self.cellLimit)) + "…" : text
    }
}
