//
//  CFAPIResponse.swift
//  Orange Cloud
//
//  Cloudflare API 通用响应包装 { result, success, errors, messages }
//

import Foundation

nonisolated struct CFAPIResponse<T: Codable & Sendable>: Codable, Sendable {
    let result:   T?
    let success:  Bool
    let errors:   [CFAPIError]
    let messages: [CFAPIMessage]?

    enum CodingKeys: String, CodingKey { case result, success, errors, messages }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        result   = try c.decodeIfPresent(T.self, forKey: .result)
        success  = try c.decode(Bool.self, forKey: .success)
        // 部分端点（如 workers/domains）回 errors:null，宽容降级为空数组
        errors   = (try? c.decode([CFAPIError].self, forKey: .errors)) ?? []
        messages = try c.decodeIfPresent([CFAPIMessage].self, forKey: .messages)
    }
}

nonisolated struct CFAPIResponseArray<T: Codable & Sendable>: Codable, Sendable {
    let result:     [T]?
    let success:    Bool
    let errors:     [CFAPIError]
    let resultInfo: ResultInfo?

    enum CodingKeys: String, CodingKey {
        case result, success, errors
        case resultInfo = "result_info"
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        result     = try c.decodeIfPresent([T].self, forKey: .result)
        success    = try c.decode(Bool.self, forKey: .success)
        // 部分端点回 errors:null，宽容降级为空数组
        errors     = (try? c.decode([CFAPIError].self, forKey: .errors)) ?? []
        resultInfo = try c.decodeIfPresent(ResultInfo.self, forKey: .resultInfo)
    }
}

nonisolated struct CFAPIError: Codable, Sendable {
    let code:    Int
    let message: String
    /// 2026-08-20 起 CF 在 4xx（尤其 403）的错误体里带上该端点所需角色/权限的文档地址。
    /// 老端点与旧响应可能没有，故为可选。
    let documentationURL: String?
    /// 出错字段的 JSON Pointer（如 "/body/rules/0/action"），字段级校验失败时才有。
    let source: CFAPIErrorSource?

    enum CodingKeys: String, CodingKey {
        case code, message, source
        case documentationURL = "documentation_url"
    }

    /// 两个新字段一律宽容解码：它们只是排查用的附加信息，形态不合预期时也绝不能
    /// 拖垮整条错误的解码——外层 `errors` 解不出会整体降级为空数组，把 code/message
    /// 一起丢掉，错误信息反而不如加字段之前。
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        code    = try c.decode(Int.self, forKey: .code)
        message = try c.decode(String.self, forKey: .message)
        documentationURL = try? c.decodeIfPresent(String.self, forKey: .documentationURL)
        source           = try? c.decodeIfPresent(CFAPIErrorSource.self, forKey: .source)
    }
}

nonisolated struct CFAPIErrorSource: Codable, Sendable {
    let pointer: String?
}

nonisolated struct CFAPIMessage: Codable, Sendable {
    let code:    Int
    let message: String
}

nonisolated struct ResultInfo: Codable, Sendable {
    // 页码分页（Zone/DNS 等）
    let page:       Int?
    let perPage:    Int?
    let totalPages: Int?
    let count:      Int?
    let totalCount: Int?
    // 游标分页（R2 对象、KV keys 等）
    let cursor:      String?
    // R2 list 传 delimiter 时回的「折叠前缀」（即子文件夹），key 就叫 delimited
    let delimited:   [String]?
    let isTruncated: Bool?

    enum CodingKeys: String, CodingKey {
        case page, count, cursor, delimited
        case perPage     = "per_page"
        case totalPages  = "total_pages"
        case totalCount  = "total_count"
        case isTruncated = "is_truncated"
    }
}

// 用于 DELETE 等只关心 success 的请求
nonisolated struct EmptyResponse: Codable, Sendable {}

extension CFAPIResponse {
    func toAPIError() -> APIError {
        let err = errors.first
        return .cloudflareError(code: err?.code ?? 0,
                                message: err?.message ?? String(localized: "未知错误"),
                                documentationURL: err?.documentationURL)
    }
}

extension CFAPIResponseArray {
    func toAPIError() -> APIError {
        let err = errors.first
        return .cloudflareError(code: err?.code ?? 0,
                                message: err?.message ?? String(localized: "未知错误"),
                                documentationURL: err?.documentationURL)
    }
}
