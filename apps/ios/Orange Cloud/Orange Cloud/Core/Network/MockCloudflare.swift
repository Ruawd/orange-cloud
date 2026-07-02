//
//  MockCloudflare.swift
//  Orange Cloud
//
//  诊断专用 mock（仅 DEBUG 构建 + 启动环境变量 ORANGE_MOCK=1 时生效）：
//  拦截 api.cloudflare.com 请求返回 canned 数据，让模拟器无需 OAuth 即可把
//  Dashboard / Zones 驱动到「有账号有数据」状态，用于复现线上 iOS 17.0 崩溃。
//  Release 构建不包含本文件逻辑；平时 DEBUG 运行不带环境变量也完全不生效。
//

#if DEBUG
import Foundation

nonisolated enum MockCloudflare {

    static var isRequested: Bool {
        ProcessInfo.processInfo.environment["ORANGE_MOCK"] == "1"
    }

    /// App 启动最早处调用：注册 URL 拦截 + 给身份索引里的身份塞假 token（绕过 OAuth）
    static func activateIfRequested() {
        guard isRequested else { return }
        URLProtocol.registerClass(MockCFURLProtocol.self)
        if let data = UserDefaults.standard.data(forKey: "authSessions"),
           let list = try? JSONDecoder().decode([AuthSessionMeta].self, from: data) {
            // 默认带假 refresh token（健康态）；ORANGE_MOCK_NO_REFRESH=1 时存无 refresh token 的
            // 残缺 token，复现「登录授权已失效」重授权横幅（真实事故形态，见 AuthManager 注释）。
            // expiresAt 远未来 → 永不触发真实刷新，假 refresh token 不会打到真 token 端点。
            let noRefresh = ProcessInfo.processInfo.environment["ORANGE_MOCK_NO_REFRESH"] == "1"
            for meta in list {
                TokenStore.save(
                    TokenStore.StoredToken(
                        accessToken: "mock-token",
                        refreshToken: noRefresh ? nil : "mock-refresh-token",
                        expiresAt: .distantFuture,
                        scope: meta.scopes.joined(separator: " ")
                    ),
                    sessionId: meta.id
                )
            }
        }
    }
}

/// 拦截发往 api.cloudflare.com 的请求，按路径返回 canned JSON
nonisolated final class MockCFURLProtocol: URLProtocol {

    override static func canInit(with request: URLRequest) -> Bool {
        request.url?.host == "api.cloudflare.com"
    }

    override static func canonicalRequest(for request: URLRequest) -> URLRequest {
        request
    }

    override func startLoading() {
        let path = request.url?.path ?? ""
        let body = Self.readBody(of: request)
        let json = Self.responseJSON(path: path, body: body)
        let data = Data(json.utf8)
        let response = HTTPURLResponse(
            url: request.url!,
            statusCode: 200,
            httpVersion: "HTTP/1.1",
            headerFields: ["Content-Type": "application/json"]
        )!
        client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
        client?.urlProtocol(self, didLoad: data)
        client?.urlProtocolDidFinishLoading(self)
    }

    override func stopLoading() {}

    // MARK: - 路由

    private static func responseJSON(path: String, body: String) -> String {
        if path == "/client/v4/graphql" {
            if body.contains("zoneTag_in") {
                return trafficJSON()
            }
            // 账户级数据集 → 模拟免费账号 authz（Dashboard 用量区走「无权限」卡片）
            return #"{"data":null,"errors":[{"message":"not authorized for that account","path":[],"extensions":{"code":"authz"}}]}"#
        }
        if path == "/client/v4/accounts" {
            return envelope(#"[{"id":"mockacct","name":"Mock Account","type":"standard"},{"id":"mockacct2","name":"Second Account","type":"standard"}]"#, total: 2)
        }
        if path == "/client/v4/zones" {
            return envelope(#"""
            [
             {"id":"z1","name":"example.com","status":"active","plan":{"name":"Free Website"},"name_servers":["a.ns.cloudflare.com","b.ns.cloudflare.com"]},
             {"id":"z2","name":"orange-cloud.dev","status":"active","plan":{"name":"Pro Website"},"name_servers":["a.ns.cloudflare.com","b.ns.cloudflare.com"]},
             {"id":"z3","name":"pending-site.io","status":"pending","plan":{"name":"Free Website"},"name_servers":["a.ns.cloudflare.com","b.ns.cloudflare.com"]}
            ]
            """#, total: 3)
        }
        if path.hasSuffix("/dns_records") {
            return envelope("[]", total: 12)
        }
        if path.hasSuffix("/workers/scripts") {
            return envelope(#"[{"id":"api-worker","handlers":["fetch"],"logpush":false},{"id":"cron-worker","handlers":["scheduled"],"logpush":false}]"#, total: 2)
        }
        // 其余端点：空数组成功信封（调用方多为 try? 包裹，可优雅降级）
        return envelope("[]", total: 0)
    }

    private static func envelope(_ result: String, total: Int) -> String {
        #"{"success":true,"errors":[],"messages":[],"result":\#(result),"result_info":{"page":1,"per_page":50,"count":\#(total),"total_count":\#(total),"total_pages":1}}"#
    }

    /// 三个 zone 各 24 个小时桶（datetime ISO8601），previous 窗口一条
    private static func trafficJSON() -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        let now = Date()
        func groups(scale: Int) -> String {
            (0..<24).map { i -> String in
                let dt = formatter.string(from: now.addingTimeInterval(TimeInterval(-3600 * (24 - i))))
                let requests = (300 + (i * 37) % 900) * scale
                return #"{"dimensions":{"datetime":"\#(dt)"},"sum":{"requests":\#(requests),"bytes":\#(requests * 2048),"threats":\#(i % 5),"pageViews":\#(requests / 2),"cachedRequests":\#(requests / 3),"cachedBytes":\#(requests * 1024)},"uniq":{"uniques":\#(requests / 10)}}"#
            }.joined(separator: ",")
        }
        func node(_ tag: String, scale: Int) -> String {
            #"{"zoneTag":"\#(tag)","httpRequests1hGroups":[\#(groups(scale: scale))],"previous":[{"sum":{"requests":\#(9000 * scale)}}]}"#
        }
        return #"{"data":{"viewer":{"zones":[\#(node("z1", scale: 1)),\#(node("z2", scale: 3)),\#(node("z3", scale: 0))]}},"errors":null}"#
    }

    private static func readBody(of request: URLRequest) -> String {
        if let data = request.httpBody {
            return String(decoding: data, as: UTF8.self)
        }
        guard let stream = request.httpBodyStream else { return "" }
        stream.open()
        defer { stream.close() }
        var data = Data()
        let bufferSize = 16 * 1024
        let buffer = UnsafeMutablePointer<UInt8>.allocate(capacity: bufferSize)
        defer { buffer.deallocate() }
        while stream.hasBytesAvailable {
            let read = stream.read(buffer, maxLength: bufferSize)
            guard read > 0 else { break }
            data.append(buffer, count: read)
        }
        return String(decoding: data, as: UTF8.self)
    }
}
#endif
