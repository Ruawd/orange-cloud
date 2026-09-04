//
//  WorkerLogsService.swift
//  Orange Cloud
//
//  Workers Logs（Observability）历史日志查询。
//  端点 POST /accounts/{id}/workers/observability/telemetry/query（scope: workers-observability.read）。
//  view=events 返回逐条日志；游标是上一页最后一条的 $metadata.id。
//

import Foundation

struct WorkerLogsService {

    private let client: CFAPIClient

    init(client: CFAPIClient) {
        self.client = client
    }

    /// 查一页历史日志。cursor 为空取首页，非空续接更早的一页。
    func events(
        accountId: String,
        scriptName: String,
        since: Date,
        until: Date,
        level: String?,
        search: String?,
        cursor: String?,
        limit: Int = 100
    ) async throws -> ObservabilityQueryResult {
        var filters: [ObservabilityQueryRequest.Filter] = [
            .init(key: "$metadata.service", operation: "eq", type: "string", value: scriptName)
        ]
        if let level, !level.isEmpty {
            filters.append(.init(key: "$metadata.level", operation: "eq", type: "string", value: level))
        }

        let trimmed = search?.trimmingCharacters(in: .whitespacesAndNewlines)
        let needle = (trimmed?.isEmpty == false)
            ? ObservabilityQueryRequest.Needle(value: trimmed!, matchCase: false)
            : nil

        let body = ObservabilityQueryRequest(
            queryId: "orange-cloud-worker-logs",
            timeframe: .init(
                from: Int64(since.timeIntervalSince1970 * 1000),
                to:   Int64(until.timeIntervalSince1970 * 1000)
            ),
            view: "events",
            limit: limit,
            parameters: .init(datasets: [], filters: filters, needle: needle),
            dry: false,
            offset: cursor,
            offsetDirection: cursor == nil ? nil : "next"
        )

        let response: CFAPIResponse<ObservabilityQueryResult> = try await client.post(
            "accounts/\(accountId)/workers/observability/telemetry/query",
            body: body
        )
        guard response.success, let result = response.result else {
            throw response.toAPIError()
        }
        return result
    }
}
