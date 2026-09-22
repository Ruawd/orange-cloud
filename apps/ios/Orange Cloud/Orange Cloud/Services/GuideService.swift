//
//  GuideService.swift
//  Orange Cloud
//
//  官网指南 feed（o-c.do/api/guides）。公开只读接口，不需要 CF 账号，不走 CFAPIClient。
//  每次成功的响应都落一份磁盘副本：断网 / 接口抖动时仍能读已看过的文章。
//

import Foundation

nonisolated struct GuideService {

    static let siteURL = URL(string: "https://o-c.do")!

    private let session = URLSession.shared
    private let cache = GuideCache()

    /// feed 根地址。DEBUG 下可用 `ORANGE_GUIDES_BASE=http://127.0.0.1:3000` 指向本地 Next 开发服务器联调。
    private var base: URL {
        #if DEBUG
        if let override = ProcessInfo.processInfo.environment["ORANGE_GUIDES_BASE"],
           let url = URL(string: override.hasSuffix("/api/guides") ? override : override + "/api/guides") {
            return url
        }
        #endif
        return URL(string: "https://o-c.do/api/guides")!
    }

    /// 两语清单（en / zh-Hans 各一套，互不翻译）
    func index() async throws -> GuideIndex {
        try await fetch(base, cacheKey: "index")
    }

    /// 单篇正文（结构化块）
    func article(locale: String, slug: String) async throws -> GuideArticle {
        let url = base.appendingPathComponent(locale).appendingPathComponent(slug)
        return try await fetch(url, cacheKey: "\(locale)_\(slug)")
    }

    /// 缓存里已有的正文（离线可读；无缓存返回 nil）
    func cachedArticle(locale: String, slug: String) -> GuideArticle? {
        cache.load("\(locale)_\(slug)").flatMap { try? JSONDecoder().decode(GuideArticle.self, from: $0) }
    }

    private func fetch<T: Decodable & Sendable>(_ url: URL, cacheKey: String) async throws -> T {
        do {
            var request = URLRequest(url: url)
            request.setValue("application/json", forHTTPHeaderField: "Accept")
            request.timeoutInterval = 20
            // feed 带 max-age=1800，默认策略会让下拉刷新拿到旧副本；改成每次回源校验（多为 304）
            request.cachePolicy = .reloadRevalidatingCacheData

            let (data, response) = try await session.data(for: request)
            guard let http = response as? HTTPURLResponse else {
                throw APIError.networkError(URLError(.badServerResponse))
            }
            guard (200...299).contains(http.statusCode) else {
                throw APIError.serverError(statusCode: http.statusCode)
            }
            let decoded: T
            do {
                decoded = try JSONDecoder().decode(T.self, from: data)
            } catch {
                AppLog.network.error("指南 feed 解码失败 \(url.path): \(error)")
                throw APIError.decodingError(error)
            }
            cache.save(data, for: cacheKey)
            return decoded
        } catch {
            // 网络失败先兜底磁盘副本，让离线也能读；没有副本才把错误抛给 ViewModel
            if let cached = cache.load(cacheKey), let decoded = try? JSONDecoder().decode(T.self, from: cached) {
                AppLog.network.info("指南 feed 走磁盘缓存 \(url.path)")
                return decoded
            }
            throw error
        }
    }
}

// MARK: - 磁盘缓存（Caches 目录，系统可回收）

private nonisolated struct GuideCache {

    private let directory: URL? = {
        guard let base = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first else { return nil }
        let dir = base.appendingPathComponent("Guides", isDirectory: true)
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir
    }()

    func load(_ key: String) -> Data? {
        guard let url = fileURL(key) else { return nil }
        return try? Data(contentsOf: url)
    }

    func save(_ data: Data, for key: String) {
        guard let url = fileURL(key) else { return }
        try? data.write(to: url, options: .atomic)
    }

    private func fileURL(_ key: String) -> URL? {
        let safe = key.map { $0.isLetter || $0.isNumber || $0 == "_" || $0 == "-" ? $0 : "_" }
        return directory?.appendingPathComponent(String(safe) + ".json")
    }
}
