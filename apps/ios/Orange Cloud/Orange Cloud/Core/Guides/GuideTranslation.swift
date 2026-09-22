//
//  GuideTranslation.swift
//  Orange Cloud
//
//  指南的「机内翻译」：官网指南只有英文与简体中文两套（各写各的、互不翻译），
//  其余语言的用户读到的是设备本地翻译——Apple Translation 框架，模型在机内跑，
//  正文不出设备，离线（语言包下好后）也能用。
//
//  版本：会话式翻译 API 是 iOS 18+。iOS 17 上整个能力静默缺席（按钮不出现），
//  文章仍可读原文，也能跳到官网。Translation.framework 高于部署目标，
//  由链接器自动弱链接，故 17 上不会因缺框架而启动失败。
//

import SwiftUI
import Translation

// MARK: - 请求

/// 一次翻译请求。`id` 每次递增，保证同一篇文章再次请求也会触发。
nonisolated struct GuideTranslationRequest: Equatable, Sendable {
    let id: Int
    /// BCP-47，如 "en" / "zh-Hans"
    let source: String
    let target: String
    let units: [String]
}

// MARK: - 能力探测

nonisolated enum GuideTranslation {

    /// 翻译目标 = 设备首选语言。规范成最简标识（zh-Hant-TW → zh-TW、ja-JP → ja），
    /// 让「能否翻译」的探测与真正发起的会话用的是同一个语言标识。
    static var deviceLanguage: Locale.Language {
        let preferred = Locale.preferredLanguages.first.map { Locale.Language(identifier: $0) } ?? Locale.current.language
        return Locale.Language(identifier: preferred.minimalIdentifier)
    }

    /// 设备语言的展示名（按设备语言自称，如 "日本語"）
    static var deviceLanguageName: String {
        let language = deviceLanguage
        let identifier = language.minimalIdentifier
        return Locale(identifier: identifier).localizedString(forIdentifier: identifier)
            ?? Locale.current.localizedString(forIdentifier: identifier)
            ?? identifier
    }

    /// 设备语言与文章语言是否同一种（同种就没必要翻译）
    static func isSameLanguage(as source: String) -> Bool {
        let device = deviceLanguage
        let article = Locale.Language(identifier: source)
        guard device.languageCode == article.languageCode else { return false }
        // 中文要区分简繁：zh-Hant 设备读 zh-Hans 文章仍值得翻译
        let deviceScript = device.script ?? Locale.Language(identifier: device.maximalIdentifier).script
        let articleScript = article.script ?? Locale.Language(identifier: article.maximalIdentifier).script
        return deviceScript == articleScript
    }

    /// 该语言对能否翻译（iOS 18 以下恒为 false）
    static func canTranslate(from source: String) async -> Bool {
        guard !isSameLanguage(as: source) else { return false }
        guard #available(iOS 18.0, *) else { return false }
        let status = await LanguageAvailability().status(from: Locale.Language(identifier: source), to: deviceLanguage)
        switch status {
        case .installed, .supported: return true
        case .unsupported:           return false
        @unknown default:            return false
        }
    }
}

// MARK: - 挂载（View 侧）

extension View {
    /// 把翻译请求交给系统翻译会话；译文按 `units` 的顺序回传。iOS 17 上是空转。
    func guideTranslation(
        request: GuideTranslationRequest?,
        onResult: @escaping ([String]) -> Void,
        onFailure: @escaping (String) -> Void
    ) -> some View {
        modifier(GuideTranslationModifier(request: request, onResult: onResult, onFailure: onFailure))
    }
}

private struct GuideTranslationModifier: ViewModifier {

    let request: GuideTranslationRequest?
    let onResult: ([String]) -> Void
    let onFailure: (String) -> Void

    func body(content: Content) -> some View {
        if #available(iOS 18.0, *) {
            content.modifier(TranslationSessionModifier(request: request, onResult: onResult, onFailure: onFailure))
        } else {
            content
        }
    }
}

/// TranslationSession.Configuration 是 iOS 18 才有的类型，
/// 因此持有它的 @State 只能待在这个整体 @available 的结构里。
@available(iOS 18.0, *)
private struct TranslationSessionModifier: ViewModifier {

    let request: GuideTranslationRequest?
    let onResult: ([String]) -> Void
    let onFailure: (String) -> Void

    @State private var configuration: TranslationSession.Configuration?

    func body(content: Content) -> some View {
        content
            .translationTask(configuration) { session in
                guard let request else { return }
                await translate(request, with: session)
            }
            .onChange(of: request, initial: true) { _, new in
                guard let new else {
                    configuration = nil
                    return
                }
                let next = TranslationSession.Configuration(
                    source: Locale.Language(identifier: new.source),
                    target: Locale.Language(identifier: new.target)
                )
                // 语言对没变时重新赋值不会触发会话，必须显式失效（Apple 文档的既定做法）
                if configuration == next {
                    configuration?.invalidate()
                } else {
                    configuration = next
                }
            }
    }

    private func translate(_ request: GuideTranslationRequest, with session: TranslationSession) async {
        do {
            // 语言包没下载时由系统弹下载确认，用户拒绝会抛错
            try await session.prepareTranslation()

            let batch = request.units.enumerated().map {
                TranslationSession.Request(sourceText: $0.element, clientIdentifier: String($0.offset))
            }
            let responses = try await session.translations(from: batch)

            var translated = request.units
            for response in responses {
                guard let index = response.clientIdentifier.flatMap(Int.init),
                      translated.indices.contains(index) else { continue }
                translated[index] = response.targetText
            }
            AppLog.app.info("指南翻译完成 \(request.source)→\(request.target)，\(responses.count)/\(request.units.count) 段")
            onResult(translated)
        } catch {
            AppLog.app.error("指南翻译失败 \(request.source)→\(request.target): \(error.localizedDescription)")
            onFailure(error.localizedDescription)
        }
    }
}
