//
//  GuidesViewModel.swift
//  Orange Cloud
//
//  官网指南在 App 内的两个 ViewModel：清单与正文。
//  正文默认按设备语言挑一套「原文」（英文 / 简体中文各写各的），
//  其余语言由 Core/Guides 的机内翻译按段落回填。
//

import Foundation
import Observation

// MARK: - 清单

@Observable
@MainActor
final class GuidesIndexViewModel {

    private(set) var collections: [String: GuideCollection] = [:]
    /// 展示顺序固定：英文在前、简体中文在后（与官网栏目一致）
    private(set) var locales: [String] = []
    var selectedLocale: String = "en"
    private(set) var isLoading = false
    var error: String?

    private let service: GuideService
    private var hasLoaded = false

    init(service: GuideService = GuideService()) {
        self.service = service
    }

    var collection: GuideCollection? { collections[selectedLocale] }
    var guides: [GuideSummary] { collection?.guides ?? [] }

    func loadIfNeeded() async {
        guard !hasLoaded else { return }
        await load()
    }

    func load() async {
        isLoading = true
        error = nil
        do {
            let index = try await service.index()
            let ordered = ["en", "zh-Hans"].filter { index.locales[$0] != nil }
            collections = index.locales
            locales = ordered + index.locales.keys.filter { !ordered.contains($0) }.sorted()
            if !locales.contains(selectedLocale) || !hasLoaded {
                selectedLocale = Self.preferredLocale(among: locales)
            }
            hasLoaded = true
        } catch {
            self.error = error.localizedDescription
            AppLog.network.error("指南清单加载失败: \(error.localizedDescription)")
        }
        isLoading = false
    }

    /// 简体中文设备读中文那套，其余读英文那套（再按需机内翻译）
    static func preferredLocale(among locales: [String]) -> String {
        let language = GuideTranslation.deviceLanguage
        if language.languageCode?.identifier == "zh" {
            let script = language.script?.identifier
                ?? Locale.Language(identifier: language.maximalIdentifier).script?.identifier
            if script == "Hans", locales.contains("zh-Hans") { return "zh-Hans" }
        }
        return locales.contains("en") ? "en" : (locales.first ?? "en")
    }

    /// 语言选择器上的名字用各语言的自称（endonym），不随界面语言变，故不进本地化目录
    static func localeName(_ locale: String) -> String {
        switch locale {
        case "en":      "English"
        case "zh-Hans": "简体中文"
        default:        Locale.current.localizedString(forIdentifier: locale) ?? locale
        }
    }
}

// MARK: - 正文

@Observable
@MainActor
final class GuideArticleViewModel {

    let summary: GuideSummary
    let locale: String

    private(set) var article: GuideArticle?
    private(set) var isLoading = false
    var error: String?

    /// 设备语言与文章语言不同、且系统支持该语言对时才为真（iOS 18+）
    private(set) var canTranslate = false
    private(set) var isTranslating = false
    private(set) var translationRequest: GuideTranslationRequest?
    var translationError: String?
    /// 当前是否显示译文
    private(set) var showsTranslation = false

    private var translatedBlocks: [GuideBlock]?
    private var translatedTitle: String?
    private var requestCounter = 0

    private let service: GuideService

    init(summary: GuideSummary, locale: String, service: GuideService = GuideService()) {
        self.summary = summary
        self.locale = locale
        self.service = service
        self.article = service.cachedArticle(locale: locale, slug: summary.slug)
    }

    var blocks: [GuideBlock] {
        guard showsTranslation, let translatedBlocks else { return article?.blocks ?? [] }
        return translatedBlocks
    }

    var title: String {
        showsTranslation ? (translatedTitle ?? summary.title) : summary.title
    }

    var targetLanguageName: String { GuideTranslation.deviceLanguageName }

    func load() async {
        isLoading = true
        error = nil
        do {
            let loaded = try await service.article(locale: locale, slug: summary.slug)
            article = loaded
            // 换了正文，旧译文作废
            translatedBlocks = nil
            translatedTitle = nil
            showsTranslation = false
        } catch {
            // 有缓存正文时不打断阅读，只在完全空手时报错
            if article == nil { self.error = error.localizedDescription }
            AppLog.network.error("指南正文加载失败 \(locale)/\(summary.slug): \(error.localizedDescription)")
        }
        isLoading = false
        canTranslate = await GuideTranslation.canTranslate(from: locale)
        AppLog.app.info("指南翻译可用性 \(locale)→\(GuideTranslation.deviceLanguage.minimalIdentifier): \(canTranslate)")
    }

    /// 工具栏按钮：已有译文就原文/译文来回切，没有就发起一次翻译
    func toggleTranslation() {
        if translatedBlocks != nil {
            showsTranslation.toggle()
            return
        }
        startTranslation()
    }

    private func startTranslation() {
        guard let article, !isTranslating else { return }
        var units = [summary.title]
        units.append(contentsOf: article.blocks.flatMap(\.translationUnits))

        requestCounter += 1
        isTranslating = true
        translationError = nil
        translationRequest = GuideTranslationRequest(
            id: requestCounter,
            source: locale,
            target: GuideTranslation.deviceLanguage.minimalIdentifier,
            units: units
        )
    }

    /// 译文按发出的顺序回填（第一段是标题）
    func applyTranslation(_ values: [String]) {
        defer {
            isTranslating = false
            translationRequest = nil
        }
        guard let article else { return }
        var iterator = values.makeIterator()
        translatedTitle = iterator.next()
        translatedBlocks = article.blocks.map { block in block.applying { iterator.next() } }
        showsTranslation = true
    }

    func translationFailed(_ message: String) {
        isTranslating = false
        translationRequest = nil
        translationError = message
    }
}
