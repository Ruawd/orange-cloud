//
//  GuideArticleView.swift
//  Orange Cloud
//
//  指南正文：官网 feed 返回结构化块，这里原生渲染（不是 WebView），
//  因此可以把每一段交给机内翻译（Core/Guides/GuideTranslation，iOS 18+）。
//  网页上的 SVG 示意图在这里以它的无障碍描述呈现，需要看图可跳官网。
//

import SwiftUI

struct GuideArticleView: View {

    @State private var viewModel: GuideArticleViewModel
    @Environment(\.openURL) private var openURL

    init(summary: GuideSummary, locale: String) {
        _viewModel = State(initialValue: GuideArticleViewModel(summary: summary, locale: locale))
    }

    private var articleURL: URL? { URL(string: viewModel.summary.url) }

    var body: some View {
        Group {
            if viewModel.blocks.isEmpty, viewModel.isLoading {
                skeleton
            } else if viewModel.blocks.isEmpty, let error = viewModel.error {
                ContentUnavailableView {
                    Label("加载失败", systemImage: "wifi.exclamationmark")
                } description: {
                    Text(error)
                } actions: {
                    Button("重试") { Task { await viewModel.load() } }
                        .buttonStyle(.borderedProminent)
                        .tint(Color.ocOrangePressed)
                        .fontWeight(.bold)
                }
            } else {
                article
            }
        }
        .background { SkyBackground() }
        .navigationTitle("指南")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar { toolbar }
        .task { await viewModel.load() }
        .guideTranslation(
            request: viewModel.translationRequest,
            onResult: { viewModel.applyTranslation($0) },
            onFailure: { viewModel.translationFailed($0) }
        )
        .alert("翻译未完成", isPresented: translationErrorBinding) {
            Button("好") { viewModel.translationError = nil }
        } message: {
            Text(viewModel.translationError ?? "")
        }
    }

    private var translationErrorBinding: Binding<Bool> {
        Binding(get: { viewModel.translationError != nil }, set: { if !$0 { viewModel.translationError = nil } })
    }

    // MARK: - 正文

    private var article: some View {
        ScrollView {
            // 非 lazy：正文块里有横向滚动的表格，嵌套在懒加载容器里容易失效
            VStack(alignment: .leading, spacing: 14) {
                header
                if viewModel.showsTranslation { translationNotice }
                ForEach(Array(viewModel.blocks.enumerated()), id: \.offset) { _, block in
                    blockView(block)
                }
                footer
            }
            .padding(.horizontal, OCLayout.pagePadding)
            .padding(.bottom, 36)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(viewModel.title)
                .font(.title2.weight(.bold))
                .fixedSize(horizontal: false, vertical: true)
            Text(verbatim: "\(viewModel.summary.updated) · \(viewModel.summary.readingTime)")
                .font(.caption)
                .foregroundStyle(.secondary)
            HorizonArc()
                .frame(height: 34)
        }
        .padding(.top, 6)
    }

    private var translationNotice: some View {
        Label {
            Text("由设备上的翻译生成，仅供参考。")
        } icon: {
            Image(systemName: "character.bubble")
        }
        .font(.caption)
        .foregroundStyle(.secondary)
        .padding(.vertical, 2)
    }

    private var footer: some View {
        VStack(alignment: .leading, spacing: 10) {
            Divider()
            Text("本文来自 Orange Cloud 官网。网页版含示意图与延伸阅读。")
                .font(.caption)
                .foregroundStyle(.secondary)
            if let articleURL {
                Button {
                    openURL(articleURL)
                } label: {
                    Label("在浏览器中打开", systemImage: "safari")
                        .font(.callout.weight(.medium))
                }
                .tint(Color.ocOrangeText)
            }
        }
        .padding(.top, 12)
    }

    // MARK: - 块

    @ViewBuilder
    private func blockView(_ block: GuideBlock) -> some View {
        switch block {
        case let .heading(level, text):
            Text(text)
                .font(level <= 2 ? .title3.weight(.bold) : .headline)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.top, level <= 2 ? 12 : 4)

        case let .paragraph(md):
            paragraph(md)

        case let .note(items):
            VStack(alignment: .leading, spacing: 8) {
                ForEach(Array(items.enumerated()), id: \.offset) { _, item in
                    paragraph(item)
                }
            }
            .padding(OCLayout.islandPadding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .glassIsland()

        case let .list(ordered, items):
            VStack(alignment: .leading, spacing: 8) {
                ForEach(Array(items.enumerated()), id: \.offset) { index, item in
                    HStack(alignment: .firstTextBaseline, spacing: 8) {
                        Text(ordered ? "\(index + 1)." : "•")
                            .font(.body.weight(.semibold))
                            .foregroundStyle(Color.ocOrangeText)
                            .frame(minWidth: 18, alignment: .trailing)
                        paragraph(item)
                    }
                }
            }

        case let .code(text):
            ScrollView(.horizontal, showsIndicators: false) {
                Text(text)
                    .font(.system(.footnote, design: .monospaced))
                    .textSelection(.enabled)
                    .padding(OCLayout.islandPadding)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .glassIsland(cornerRadius: OCLayout.chipRadius)

        case let .quote(md):
            HStack(alignment: .top, spacing: 10) {
                Capsule()
                    .fill(Color.ocOrange)
                    .frame(width: 3)
                paragraph(md)
                    .italic()
            }
            .fixedSize(horizontal: false, vertical: true)

        case let .figure(alt):
            Label {
                Text(alt)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            } icon: {
                Image(systemName: "chart.xyaxis.line")
                    .foregroundStyle(Color.ocOrangeText)
            }
            .padding(OCLayout.islandPadding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .glassIsland(cornerRadius: OCLayout.chipRadius)

        case let .table(headers, rows):
            tableView(headers: headers, rows: rows)
        }
    }

    private func paragraph(_ md: String) -> some View {
        Text(GuideMarkdown.attributed(md))
            .font(.body)
            .lineSpacing(4)
            .tint(Color.ocOrangeText)
            .textSelection(.enabled)
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func tableView(headers: [String], rows: [[String]]) -> some View {
        let columnWidth: CGFloat = 150
        return ScrollView(.horizontal, showsIndicators: false) {
            VStack(alignment: .leading, spacing: 0) {
                if !headers.isEmpty {
                    tableRow(headers, width: columnWidth, isHeader: true)
                    Divider()
                }
                ForEach(Array(rows.enumerated()), id: \.offset) { index, row in
                    tableRow(row, width: columnWidth, isHeader: false)
                    if index < rows.count - 1 { Divider() }
                }
            }
            .padding(OCLayout.islandPadding)
        }
        .glassIsland(cornerRadius: OCLayout.chipRadius)
    }

    private func tableRow(_ cells: [String], width: CGFloat, isHeader: Bool) -> some View {
        HStack(alignment: .top, spacing: 12) {
            ForEach(Array(cells.enumerated()), id: \.offset) { _, cell in
                Text(GuideMarkdown.attributed(cell))
                    .font(isHeader ? .caption.weight(.semibold) : .caption)
                    .foregroundStyle(isHeader ? .secondary : .primary)
                    .tint(Color.ocOrangeText)
                    .frame(width: width, alignment: .leading)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(.vertical, 7)
    }

    // MARK: - 工具栏

    @ToolbarContentBuilder
    private var toolbar: some ToolbarContent {
        ToolbarItem(placement: .topBarTrailing) {
            if viewModel.canTranslate {
                Button {
                    viewModel.toggleTranslation()
                } label: {
                    if viewModel.isTranslating {
                        ProgressView()
                    } else {
                        Label(
                            viewModel.showsTranslation ? String(localized: "显示原文") : String(localized: "翻译"),
                            systemImage: viewModel.showsTranslation ? "character.bubble.fill" : "character.bubble"
                        )
                    }
                }
                .disabled(viewModel.isTranslating || viewModel.blocks.isEmpty)
                .accessibilityLabel(
                    viewModel.showsTranslation
                        ? String(localized: "显示原文")
                        : String(localized: "翻译成\(viewModel.targetLanguageName)")
                )
            }
        }
        ToolbarItem(placement: .topBarTrailing) {
            Menu {
                if let articleURL {
                    Button {
                        openURL(articleURL)
                    } label: {
                        Label("在浏览器中打开", systemImage: "safari")
                    }
                    ShareLink(item: articleURL) {
                        Label("分享", systemImage: "square.and.arrow.up")
                    }
                }
            } label: {
                Image(systemName: "ellipsis.circle")
            }
        }
    }

    private var skeleton: some View {
        VStack(alignment: .leading, spacing: 14) {
            SkeletonBlock(width: 240, height: 20)
            SkeletonBlock(width: 130, height: 11)
            ForEach(0..<7, id: \.self) { index in
                VStack(alignment: .leading, spacing: 7) {
                    SkeletonBlock(height: 11)
                    SkeletonBlock(width: 260 - CGFloat((index * 31) % 70), height: 11)
                }
                .padding(.top, 6)
            }
            Spacer()
        }
        .padding(OCLayout.pagePadding)
        .frame(maxWidth: .infinity, alignment: .leading)
        .skeletonPulse()
    }
}
