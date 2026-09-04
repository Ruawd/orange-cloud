-- 交易行补「订单状态」：区分「钱已到账」与「只是下了单」。
--
-- Google Play 续订失败会先进宽限期，那条 RTDN 的 latestOrderId 指向一笔
-- **尚未扣款成功**的订单（orders.get 返回 state=PENDING、total 有金额、
-- developerRevenueInBuyerCurrency 为空）。此前账本原样落了一行带金额的交易，
-- 于是「本月净额 / 累计营收」把没收到的钱算成了收入。
--
-- 存下 orders.get 的 state（Apple 行恒 NULL，Apple 的续订失败通知带的是
-- 上一笔已成功交易，不会造出新的幻影流水），营收聚合只认已到账的状态，
-- 口径见 src/lib/ledger/order-state.ts。

ALTER TABLE transactions ADD COLUMN order_state TEXT;

-- 回填历史 Play 行：取该订单最后一条通知里富化到的订单状态。
UPDATE transactions
SET order_state = (
	SELECT json_extract(n.raw_payload, '$.enrichment.order.state')
	FROM notifications n
	WHERE n.platform = 'play'
	  AND n.transaction_id = transactions.transaction_id
	  AND json_extract(n.raw_payload, '$.enrichment.order.state') IS NOT NULL
	ORDER BY n.signed_date DESC
	LIMIT 1
)
WHERE platform = 'play';
