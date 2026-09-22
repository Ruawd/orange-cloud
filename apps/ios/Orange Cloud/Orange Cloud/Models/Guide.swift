//
//  Guide.swift
//  Orange Cloud
//
//  官网指南（o-c.do/guides）在 App 内的数据模型。
//
//  正文由官网 `/api/guides/{locale}/{slug}` 返回结构化块（服务端解析已渲染的文章 HTML），
//  App 原生渲染而不是塞 WebView——原生块才能逐段喂给系统翻译（见 Core/Guides）。
//  行内格式是极小的 markdown 子集：`**粗**` / `*斜*` / `` `代码` `` / `[文字](链接)`。
//

import Foundation

// MARK: - 清单

nonisolated struct GuideIndex: Codable, Sendable {
    let version: Int
    let locales: [String: GuideCollection]
}

nonisolated struct GuideCollection: Codable, Sendable {
    let title: String
    let description: String
    let url: String
    let guides: [GuideSummary]
}

nonisolated struct GuideSummary: Codable, Sendable, Hashable, Identifiable {
    let slug: String
    let title: String
    let blurb: String
    let description: String
    let updated: String
    let readingTime: String
    let url: String

    var id: String { slug }
}

// MARK: - 正文

nonisolated struct GuideArticle: Codable, Sendable {
    let locale: String
    let slug: String
    let title: String
    let description: String
    let updated: String
    let readingTime: String
    let url: String
    let blocks: [GuideBlock]
}

nonisolated enum GuideBlock: Codable, Sendable, Hashable {
    case heading(level: Int, text: String)
    case paragraph(md: String)
    /// 正文里的提示岛（文章开头那句「答案摘要」多为此形态）
    case note(items: [String])
    case list(ordered: Bool, items: [String])
    case code(text: String)
    case quote(md: String)
    /// 网页上是内联 SVG 示意图，App 端取它的无障碍描述（本身就是完整一句话）
    case figure(alt: String)
    case table(headers: [String], rows: [[String]])

    private enum CodingKeys: String, CodingKey {
        case type, level, text, md, items, ordered, headers, rows, alt
    }

    init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        switch try c.decode(String.self, forKey: .type) {
        case "heading":
            self = .heading(level: try c.decodeIfPresent(Int.self, forKey: .level) ?? 2,
                            text: try c.decode(String.self, forKey: .text))
        case "paragraph":
            self = .paragraph(md: try c.decode(String.self, forKey: .md))
        case "note":
            self = .note(items: try c.decode([String].self, forKey: .items))
        case "list":
            self = .list(ordered: try c.decodeIfPresent(Bool.self, forKey: .ordered) ?? false,
                         items: try c.decode([String].self, forKey: .items))
        case "code":
            self = .code(text: try c.decode(String.self, forKey: .text))
        case "quote":
            self = .quote(md: try c.decode(String.self, forKey: .md))
        case "figure":
            self = .figure(alt: try c.decode(String.self, forKey: .alt))
        case "table":
            self = .table(headers: try c.decodeIfPresent([String].self, forKey: .headers) ?? [],
                          rows: try c.decodeIfPresent([[String]].self, forKey: .rows) ?? [])
        case let other:
            // 官网将来新增块类型时，老版本 App 忽略而不是整篇解码失败
            throw DecodingError.dataCorruptedError(forKey: .type, in: c,
                                                   debugDescription: "未知块类型 \(other)")
        }
    }

    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        switch self {
        case let .heading(level, text):
            try c.encode("heading", forKey: .type)
            try c.encode(level, forKey: .level)
            try c.encode(text, forKey: .text)
        case let .paragraph(md):
            try c.encode("paragraph", forKey: .type)
            try c.encode(md, forKey: .md)
        case let .note(items):
            try c.encode("note", forKey: .type)
            try c.encode(items, forKey: .items)
        case let .list(ordered, items):
            try c.encode("list", forKey: .type)
            try c.encode(ordered, forKey: .ordered)
            try c.encode(items, forKey: .items)
        case let .code(text):
            try c.encode("code", forKey: .type)
            try c.encode(text, forKey: .text)
        case let .quote(md):
            try c.encode("quote", forKey: .type)
            try c.encode(md, forKey: .md)
        case let .figure(alt):
            try c.encode("figure", forKey: .type)
            try c.encode(alt, forKey: .alt)
        case let .table(headers, rows):
            try c.encode("table", forKey: .type)
            try c.encode(headers, forKey: .headers)
            try c.encode(rows, forKey: .rows)
        }
    }
}

// MARK: - 翻译单元

extension GuideBlock {

    /// 送去翻译的纯文本（去掉 markdown 记号）。代码块不翻译，故为空。
    var translationUnits: [String] {
        switch self {
        case let .heading(_, text):     [text]
        case let .paragraph(md):        [GuideMarkdown.plain(md)]
        case let .note(items):          items.map(GuideMarkdown.plain)
        case let .list(_, items):       items.map(GuideMarkdown.plain)
        case .code:                     []
        case let .quote(md):            [GuideMarkdown.plain(md)]
        case let .figure(alt):          [alt]
        case let .table(headers, rows): headers + rows.flatMap { $0 }
        }
    }

    /// 用译文按 `translationUnits` 的顺序回填。译文是纯文本，需转义后才安全地走 markdown 渲染。
    func applying(_ next: () -> String?) -> GuideBlock {
        func take() -> String? { next().map(GuideMarkdown.escaped) }

        switch self {
        case let .heading(level, text):
            return .heading(level: level, text: next() ?? text)
        case let .paragraph(md):
            return .paragraph(md: take() ?? md)
        case let .note(items):
            return .note(items: items.map { take() ?? $0 })
        case let .list(ordered, items):
            return .list(ordered: ordered, items: items.map { take() ?? $0 })
        case .code:
            return self
        case let .quote(md):
            return .quote(md: take() ?? md)
        case let .figure(alt):
            return .figure(alt: next() ?? alt)
        case let .table(headers, rows):
            return .table(headers: headers.map { take() ?? $0 },
                          rows: rows.map { row in row.map { take() ?? $0 } })
        }
    }
}

// MARK: - 行内 markdown

nonisolated enum GuideMarkdown {

    /// 行内子集渲染（保留链接 / 粗体 / 斜体 / 行内代码）
    static func attributed(_ md: String) -> AttributedString {
        let options = AttributedString.MarkdownParsingOptions(
            interpretedSyntax: .inlineOnlyPreservingWhitespace
        )
        return (try? AttributedString(markdown: md, options: options)) ?? AttributedString(md)
    }

    /// 去掉记号后的纯文本（翻译输入）
    static func plain(_ md: String) -> String {
        String(attributed(md).characters)
    }

    /// 纯文本转义成 markdown 字面量（译文回填后仍走同一套渲染）
    static func escaped(_ text: String) -> String {
        var out = ""
        out.reserveCapacity(text.count)
        for character in text {
            if "\\*_[]`".contains(character) { out.append("\\") }
            out.append(character)
        }
        return out
    }
}
