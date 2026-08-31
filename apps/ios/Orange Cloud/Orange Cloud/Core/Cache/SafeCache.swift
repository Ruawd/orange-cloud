//
//  SafeCache.swift
//  Orange Cloud
//
//  SwiftData 缓存读写的 ObjC 异常收口。iOS 17.x 的 CoreData 会在个别设备上直接抛
//  NSException（TF 崩溃点 D8tiH4pqdctLgx_nCLGnZ：纯谓词 fetch；Sentry APPLE-IOS-Y：
//  冷启动早期实体解析失败 "could not locate an NSEntityDescription for entity name"），
//  Swift 的 try/try? 只接 Swift Error，接不住 NSException。缓存是可随时从 API 重拉的
//  非关键数据，绝不允许它把 App 崩掉——所有对缓存库的 fetch / 写入段必须经此收口，
//  异常按「缓存缺失」处理，并在连续异常时请求 CacheContainer 就地重建容器。
//

import Foundation
import SwiftData

@MainActor
enum SafeCache {

    /// 带 ObjC 异常兜底的 fetch：异常时返回 nil（调用方按缓存缺失 / 不新鲜处理）。
    static func fetch<T: PersistentModel>(
        _ descriptor: FetchDescriptor<T>, context: ModelContext
    ) -> [T]? {
        var fetched: [T]?
        let exception = OCCatchException {
            fetched = try? context.fetch(descriptor)
        }
        if let exception {
            note(exception, label: "fetch \(T.self)")
            return nil
        }
        noteHealthy()
        return fetched
    }

    /// 把一段同步的缓存读写（fetch + insert/delete + save）整体包进 ObjC @try。
    /// 异常时整段放弃并返回 false；body 里的 Swift Error 只记日志（缓存写失败不上抛，
    /// API 数据已在手，UI 不受影响）。注意 body 必须是同步代码，不能包含 await。
    @discardableResult
    static func perform(_ label: String, _ body: () throws -> Void) -> Bool {
        var swiftError: Error?
        let exception = OCCatchException {
            do { try body() } catch { swiftError = error }
        }
        if let exception {
            note(exception, label: label)
            return false
        }
        noteHealthy()
        if let swiftError {
            AppLog.app.info("缓存操作失败（已忽略，\(label)）：\(swiftError.localizedDescription)")
            return false
        }
        return true
    }

    /// 容器健康探针：对给定容器做一次空谓词 fetch，看实体描述是否可解析。
    /// 只回答「行不行」，不记日志、不计入健康计数——它本身就是修复流程的一部分。
    static func probe(_ container: ModelContainer) -> Bool {
        var ok = false
        let exception = OCCatchException {
            ok = ((try? ModelContext(container).fetch(FetchDescriptor<CachedZone>())) != nil)
        }
        return exception == nil && ok
    }

    // MARK: - 健康计数（进程内，不再跨启动持久化）

    /// 连续异常达到该数即请求就地重建容器（Sentry APPLE-IOS-1：坏掉时是整个容器
    /// 的实体注册失效，同一会话所有调用点一起抛，攒不到几次就该修）。
    private static let repairThreshold = 3
    private static var consecutiveExceptions = 0
    /// 异常详情每进程只按 error 记一次：坏容器会让每个调用点反复抛，
    /// 逐次记 error 会被遥测放大成成百上千条同源事件（APPLE-IOS-1 的 236 条即此）。
    private static var hasLoggedExceptionThisLaunch = false

    private static func note(_ exception: NSException, label: String) {
        let line = "缓存 \(label) 抛 ObjC 异常（已兜住，按缓存缺失处理）：\(exception.name.rawValue) — \(exception.reason ?? "无 reason")"
        if hasLoggedExceptionThisLaunch {
            AppLog.app.info("\(line)")
        } else {
            hasLoggedExceptionThisLaunch = true
            AppLog.app.error("\(line)")
        }
        consecutiveExceptions += 1
        if consecutiveExceptions >= repairThreshold {
            consecutiveExceptions = 0
            CacheContainer.repairIfNeeded()
        }
    }

    private static func noteHealthy() {
        consecutiveExceptions = 0
    }
}
