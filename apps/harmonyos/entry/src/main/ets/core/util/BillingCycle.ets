// 账单周期计算（对齐 iOS Shared/BillingCycle.swift 与安卓 billingPeriodStart）：
// 给定账单日（1–28），求最近一次周期起点（UTC）。
// Cloudflare 的付费额度按订阅锚定日重置（账单日 16 → 5/16–6/16），不是自然月。

/// 账号用量口径偏好（按账号隔离）：CF 未对 OAuth 开放订阅查询，套餐与账单日只能手动设。
/// 只影响 App 里的额度对照与统计窗口，不改变 Cloudflare 的实际计费。
export interface UsagePlanPrefs {
  workersPaid: boolean;
  r2Paid: boolean;
  /// 1 = 自然月（每月 1 日）
  billingDay: number;
}

export const DEFAULT_USAGE_PLAN: UsagePlanPrefs = { workersPaid: false, r2Paid: false, billingDay: 1 };

export function clampBillingDay(day: number): number {
  if (!Number.isFinite(day)) {
    return 1;
  }
  return Math.min(Math.max(Math.round(day), 1), 28);
}

/// 最近一次账期起点（UTC 零点）。今天还没到本月账单日 → 起点落在上个月。
export function billingPeriodStart(billingDay: number, now: Date = new Date()): Date {
  const day = clampBillingDay(billingDay);
  const thisMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), day, 0, 0, 0));
  if (thisMonth.getTime() <= now.getTime()) {
    return thisMonth;
  }
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, day, 0, 0, 0));
}
