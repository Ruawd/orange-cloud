//
//  GuidesListView.swift
//  Orange Cloud
//
//  官网指南（o-c.do/guides）的 App 内栏目：Cloudflare 排障与科普长文，
//  无需登录即可读。清单来自官网 feed，正文见 GuideArticleView。
//
//  英文与简体中文是两套各自独立的选题（官网如此，互不翻译），
//  这里按设备语言默认选一套，用户可自行切换；其它语言靠机内翻译。
//

import SwiftUI

struct GuidesListView: View {

    @State private var viewModel = GuidesIndexViewModel()

    var body: some View {
        Group {
            if viewModel.guides.isEmpty, viewModel.isLoading {
                skeleton
            } else if viewModel.guides.isEmpty, let error = viewModel.error {
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
                list
            }
        }
        .background { SkyBackground() }
        .navigationTitle("指南")
        .navigationBarTitleDisplayMode(.inline)
        // 值式导航：eager 的 NavigationLink(destination:) 会为每一行提前建好 ViewModel（含一次磁盘缓存读）
        .navigationDestination(for: GuideSummary.self) { summary in
            GuideArticleView(summary: summary, locale: viewModel.selectedLocale)
        }
        .task { await viewModel.loadIfNeeded() }
    }

    private var list: some View {
        List {
            if viewModel.locales.count > 1 {
                Section {
                    Picker("内容语言", selection: $viewModel.selectedLocale) {
                        ForEach(viewModel.locales, id: \.self) { locale in
                            Text(GuidesIndexViewModel.localeName(locale)).tag(locale)
                        }
                    }
                    .pickerStyle(.segmented)
                    .listRowInsets(EdgeInsets(top: 10, leading: 16, bottom: 10, trailing: 16))
                } footer: {
                    Text("两种语言的指南各自选题，不是同一篇文章的互译。")
                }
                .glassRow()
            }

            Section {
                ForEach(viewModel.guides) { guide in
                    NavigationLink(value: guide) {
                        VStack(alignment: .leading, spacing: 5) {
                            Text(guide.title)
                                .font(.callout.weight(.semibold))
                                .foregroundStyle(.primary)
                            Text(guide.blurb)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                                .lineLimit(3)
                            Text(verbatim: "\(guide.updated) · \(guide.readingTime)")
                                .font(.caption2)
                                .foregroundStyle(.tertiary)
                        }
                        .padding(.vertical, 4)
                    }
                }
            } header: {
                Text(viewModel.collection?.title ?? "")
            } footer: {
                Text("内容来自 Orange Cloud 官网，随官网更新。")
            }
            .glassRow()
        }
        .daybreakList()
        .refreshable { await viewModel.load() }
    }

    private var skeleton: some View {
        List {
            Section {
                ForEach(0..<6, id: \.self) { index in
                    SkeletonRow(
                        icon: .none,
                        titleWidth: 170 + CGFloat((index * 37) % 90),
                        subtitleWidth: 220 + CGFloat((index * 53) % 60)
                    )
                }
            }
            .glassRow()
        }
        .daybreakList()
        .scrollDisabled(true)
        .skeletonPulse()
    }
}
