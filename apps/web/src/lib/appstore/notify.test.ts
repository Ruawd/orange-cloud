import { describe, expect, it } from "vitest";
import { buildBarkMessage } from "./notify";
import type { DecodedNotification } from "./types";

function decoded(over: {
	type: string;
	subtype?: string;
	environment?: "Sandbox" | "Production";
	productId?: string;
	price?: number;
	currency?: string;
	storefront?: string;
	withTxn?: boolean;
}): DecodedNotification {
	const environment = over.environment ?? "Production";
	const d: DecodedNotification = {
		payload: {
			notificationType: over.type,
			subtype: over.subtype,
			notificationUUID: "u1",
			data: { environment },
		},
	};
	if (over.withTxn !== false) {
		d.transaction = {
			transactionId: "t1",
			originalTransactionId: "o1",
			productId: over.productId ?? "jiamin.chen.orange_cloud.pro.yearly",
			price: over.price ?? 19990,
			currency: over.currency ?? "USD",
			storefront: over.storefront ?? "USA",
			environment,
		};
	}
	return d;
}

describe("buildBarkMessage", () => {
	it("新订阅（生产）：标签 + subtype/商品/价格/区/环境", () => {
		const m = buildBarkMessage(decoded({ type: "SUBSCRIBED", subtype: "INITIAL_BUY" }));
		expect(m.title).toBe("🎉 新订阅");
		expect(m.isSandbox).toBe(false);
		expect(m.body).toBe("INITIAL_BUY · Pro 年度 · 19.99 USD · USA · Production");
		expect(m.group).toBe("Orange Cloud IAP");
	});

	it("买断：商品名映射 + 价格格式化", () => {
		const m = buildBarkMessage(
			decoded({ type: "ONE_TIME_CHARGE", productId: "jiamin.chen.orange_cloud.pro.lifetime", price: 49990 }),
		);
		expect(m.title).toBe("💰 买断购买");
		expect(m.body).toContain("Pro 买断");
		expect(m.body).toContain("49.99 USD");
	});

	it("沙盒：标题加 🧪 前缀、环境标注 Sandbox", () => {
		const m = buildBarkMessage(decoded({ type: "DID_RENEW", environment: "Sandbox" }));
		expect(m.title).toBe("🧪 🔁 订阅续期");
		expect(m.isSandbox).toBe(true);
		expect(m.body).toContain("Sandbox");
	});

	it("退款标签", () => {
		expect(buildBarkMessage(decoded({ type: "REFUND" })).title).toBe("↩️ 退款");
	});

	it("未知类型回退原始串", () => {
		expect(buildBarkMessage(decoded({ type: "FUTURE_TYPE" })).title).toBe("📣 FUTURE_TYPE");
	});

	it("无交易体（如 TEST）：正文只剩环境", () => {
		const m = buildBarkMessage(decoded({ type: "TEST", withTxn: false }));
		expect(m.title).toBe("🧪 测试通知");
		expect(m.body).toBe("Production");
	});
});
