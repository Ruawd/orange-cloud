// 账本口径：一笔交易的钱到底有没有收到。
//
// 起因（2026-09-03）：Google Play 的续订失败会先进宽限期（SUBSCRIPTION_IN_GRACE_PERIOD）。
// 这条 RTDN 的 latestOrderId 指向那笔**尚未扣款成功**的续订订单，orders.get 返回
// state=PENDING、total 有金额、developerRevenueInBuyerCurrency 为空。账本原样落了一行
// 带金额的 transactions，于是「本月净额 / 累计」把一笔没收到的钱算成了收入。
//
// 修法：把 orders.get 的 state 存进 transactions.order_state（Apple 行恒 NULL），
// 所有营收聚合只认「钱已到账」的状态。
//
// Play 的 Order.state 全集（androidpublisher v3 discovery）：
//   STATE_UNSPECIFIED / PENDING / PROCESSED / CANCELED
//   PENDING_REFUND / PARTIALLY_REFUNDED / REFUNDED
//
// 这里只排除「钱从未收到」的三种：
//   PENDING            已下单、等待扣款（宽限期 / 待付款购买就在这个状态）
//   CANCELED           扣款前就被取消，永远不会到账
//   STATE_UNSPECIFIED  官方声明不使用，出现即视为不可信
// 退款三态（PENDING_REFUND / PARTIALLY_REFUNDED / REFUNDED）钱是真收过的，
// 退款本身由 VOIDED_PURCHASE 写 revocation_date 表达，营收口径不在这里二次扣减。

/** 钱从未到账的 Play 订单状态。 */
export const UNCOLLECTED_ORDER_STATES = ["PENDING", "CANCELED", "STATE_UNSPECIFIED"] as const;

/** TS 侧同款判断（Apple 行 order_state 为 null -> 算已到账）。 */
export function isCollectedOrderState(state: string | null | undefined): boolean {
	return !state || !(UNCOLLECTED_ORDER_STATES as readonly string[]).includes(state);
}

/**
 * 营收聚合用的 SQL 片段：只保留钱已到账的行。
 * `col` 支持带表别名（如 `t.order_state`）。NULL（Apple 行 / 未富化的 Play 行）计入。
 */
export function collectedOrderStateSql(col = "order_state"): string {
	const list = UNCOLLECTED_ORDER_STATES.map((s) => `'${s}'`).join(", ");
	return `COALESCE(${col}, '') NOT IN (${list})`;
}
