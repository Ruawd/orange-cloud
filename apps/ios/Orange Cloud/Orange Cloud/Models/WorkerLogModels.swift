//
//  WorkerLogModels.swift
//  Orange Cloud
//
//  Workers Logs（Observability）历史日志查询模型。
//
//  与 tail 的区别：tail 是 WebSocket 实时流，只播放连接期间发生的调用；
//  这里查的是 Cloudflare 持久化下来的事件（网页端 Worker → Observability → Events），
//  可以回溯。端点 POST /accounts/{id}/workers/observability/telemetry/query。
//
//  注意：Workers Logs 需要在 Worker 上开启 observability（wrangler.toml 的
//  [observability] enabled = true），没开的 Worker 查出来就是空。
//

import Foundation

// MARK: - 请求

/// telemetry/query 请求体。必填 queryId + timeframe；view=events 取逐条日志。
nonisolated struct ObservabilityQueryRequest: Codable, Sendable {
    let queryId:    String
    let timeframe:  Timeframe
    let view:       String
    let limit:      Int
    let parameters: Parameters
    /// 保持 false（与网页端一致）：dry 的语义是「执行但不持久化」，
    /// 官方未承诺 dry 下仍回结果，这里不赌
    let dry:        Bool
    let offset:     String?
    let offsetDirection: String?

    nonisolated struct Timeframe: Codable, Sendable {
        let from: Int64      // Unix 毫秒
        let to:   Int64
    }

    nonisolated struct Parameters: Codable, Sendable {
        let datasets: [String]          // 留空 = 查全部数据集
        let filters:  [Filter]
        let needle:   Needle?
    }

    nonisolated struct Filter: Codable, Sendable {
        let key:       String
        let operation: String
        let type:      String
        let value:     String
    }

    nonisolated struct Needle: Codable, Sendable {
        let value:     String
        let matchCase: Bool
    }
}

// MARK: - 响应

nonisolated struct ObservabilityQueryResult: Codable, Sendable {
    let events: EventsBlock?

    nonisolated struct EventsBlock: Codable, Sendable {
        /// 命中总数（可能大于本页返回条数）
        let count:  Double?
        let events: [TelemetryEvent]?
    }
}

/// 一条日志事件。字段几乎全在 `$metadata` 里，`$workers` 补事件类型与结果。
nonisolated struct TelemetryEvent: Codable, Sendable {
    let timestamp: Double?          // Unix 毫秒
    let metadata:  EventMetadata?
    let workers:   EventWorkersInfo?

    enum CodingKeys: String, CodingKey {
        case timestamp
        case metadata = "$metadata"
        case workers  = "$workers"
    }

    /// 事件时刻：优先 top-level timestamp，回落 $metadata.startTime
    var date: Date {
        let ms = timestamp ?? metadata?.startTime ?? 0
        return Date(timeIntervalSince1970: ms / 1000)
    }

    /// 展示正文：日志消息 / 错误 / 触发描述，按可用性回落
    var displayText: String {
        if let message = metadata?.message, !message.isEmpty { return message }
        if let error = metadata?.error, !error.isEmpty { return error }
        if let trigger = metadata?.trigger, !trigger.isEmpty { return trigger }
        if let url = metadata?.url, !url.isEmpty { return url }
        return String(localized: "（无正文）")
    }

    /// 归一化级别，与 tail 的 LevelFilter 口径一致
    var level: String {
        if let level = metadata?.level?.lowercased(), !level.isEmpty { return level }
        if metadata?.error?.isEmpty == false { return "error" }
        return "event"
    }
}

/// 容错解码：字段类型与文档有出入时降级为 nil，不让整条事件解码失败
nonisolated struct EventMetadata: Codable, Sendable {
    let id:         String?
    let level:      String?
    let message:    String?
    let error:      String?
    let service:    String?
    let trigger:    String?
    let origin:     String?
    let requestId:  String?
    let rayId:      String?
    let region:     String?
    let type:       String?
    let url:        String?
    let statusCode: Int?
    let duration:   Double?
    let startTime:  Double?

    enum CodingKeys: String, CodingKey {
        case id, level, message, error, service, trigger, origin
        case requestId, rayId, region, type, url, statusCode, duration, startTime
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id         = try? c.decode(String.self, forKey: .id)
        level      = try? c.decode(String.self, forKey: .level)
        message    = try? c.decode(String.self, forKey: .message)
        error      = try? c.decode(String.self, forKey: .error)
        service    = try? c.decode(String.self, forKey: .service)
        trigger    = try? c.decode(String.self, forKey: .trigger)
        origin     = try? c.decode(String.self, forKey: .origin)
        requestId  = try? c.decode(String.self, forKey: .requestId)
        rayId      = try? c.decode(String.self, forKey: .rayId)
        region     = try? c.decode(String.self, forKey: .region)
        type       = try? c.decode(String.self, forKey: .type)
        url        = try? c.decode(String.self, forKey: .url)
        statusCode = try? c.decode(Int.self,    forKey: .statusCode)
        duration   = try? c.decode(Double.self, forKey: .duration)
        startTime  = try? c.decode(Double.self, forKey: .startTime)
    }
}

nonisolated struct EventWorkersInfo: Codable, Sendable {
    let eventType:  String?
    let outcome:    String?
    let scriptName: String?

    enum CodingKeys: String, CodingKey {
        case eventType, outcome, scriptName
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        eventType  = try? c.decode(String.self, forKey: .eventType)
        outcome    = try? c.decode(String.self, forKey: .outcome)
        scriptName = try? c.decode(String.self, forKey: .scriptName)
    }
}

/// 列表用包装：`$metadata.id` 缺失时兜个本地 id，保证 ForEach 稳定
nonisolated struct IdentifiedLogEvent: Identifiable, Sendable {
    let id: String
    let event: TelemetryEvent

    init(event: TelemetryEvent) {
        self.id = event.metadata?.id ?? UUID().uuidString
        self.event = event
    }
}
