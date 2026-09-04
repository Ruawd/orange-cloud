// migration 0009 的回填针对真实 SQL 引擎的验证（node:sqlite）。
//
// 线上已有的 Play 交易行没有 order_state，只能从当初存下的通知 raw_payload 里
// 把 orders.get 的 state 挖回来。回填只跑一次，跑错就得手工对账，故此处固定其行为。

import { readdirSync, readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";

const migDir = new URL("../../../migrations/", import.meta.url);
const files = readdirSync(migDir)
	.filter((f) => f.endsWith(".sql"))
	.sort();
const BACKFILL = "0009_transaction_order_state.sql";

function payload(state: string | null) {
	return JSON.stringify({ notification: {}, enrichment: state ? { order: { state } } : {} });
}

describe("0009 回填 transactions.order_state", () => {
	it("按订单最后一条通知取状态，Apple 行保持 NULL", () => {
		const db = new DatabaseSync(":memory:");
		// 先建到 0008 为止的表结构，灌入历史数据，再单独跑 0009。
		for (const f of files.filter((f) => f < BACKFILL)) {
			db.exec(readFileSync(new URL(f, migDir), "utf8"));
		}
		db.exec(`
			INSERT INTO transactions (transaction_id, original_transaction_id, environment, price_millis, currency, created_at, updated_at, platform) VALUES
			 ('GPA.pending','tok1','Production',6319000,'HUF',1,1,'play'),
			 ('GPA.recovered','tok2','Production',19990,'USD',1,1,'play'),
			 ('GPA.bare','tok3','Production',19990,'USD',1,1,'play'),
			 ('2000000','1000000','Production',19990,'USD',1,1,'apple');
			INSERT INTO notifications (notification_uuid, notification_type, transaction_id, signed_date, received_at, raw_payload, platform) VALUES
			 ('n1','SUBSCRIPTION_IN_GRACE_PERIOD','GPA.pending',100,100,'${payload("PENDING")}','play'),
			 ('n2','SUBSCRIPTION_IN_GRACE_PERIOD','GPA.recovered',100,100,'${payload("PENDING")}','play'),
			 ('n3','SUBSCRIPTION_RECOVERED','GPA.recovered',200,200,'${payload("PROCESSED")}','play'),
			 ('n4','PLAY_TEST','GPA.bare',100,100,'${payload(null)}','play'),
			 ('n5','DID_RENEW','2000000',100,100,'{}','apple');
		`);

		db.exec(readFileSync(new URL(BACKFILL, migDir), "utf8"));

		const state = (id: string) =>
			(
				db.prepare("SELECT order_state FROM transactions WHERE transaction_id = ?").get(id) as {
					order_state: string | null;
				}
			).order_state;

		expect(state("GPA.pending")).toBe("PENDING");
		// 同一订单的多条通知：取 signed_date 最新的那条（宽限期后已恢复扣款）
		expect(state("GPA.recovered")).toBe("PROCESSED");
		// 没富化过（没配服务账号时的历史行）：留空 = 按已到账处理，维持原口径
		expect(state("GPA.bare")).toBeNull();
		expect(state("2000000")).toBeNull();
	});
});
