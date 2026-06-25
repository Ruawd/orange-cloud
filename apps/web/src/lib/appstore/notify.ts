// 把一条 App Store Server Notification 转成 Bark 推送，让作者实时知道发生了什么。
// buildBarkMessage 是纯函数（可单测）；notifyAppleEvent 负责发送（无 key 则跳过）。

import { type BarkPush, sendBark } from "../notify/bark";
import type { DecodedNotification } from "./types";

// 通知类型 → 中文标签（带 emoji）。未知类型回退原始字符串。
const TYPE_LABEL: Record<string, string> = {
	SUBSCRIBED: "🎉 新订阅",
	DID_RENEW: "🔁 订阅续期",
	DID_CHANGE_RENEWAL_STATUS: "⚙️ 续订开关变更",
	DID_CHANGE_RENEWAL_PREF: "🔀 套餐变更",
	DID_FAIL_TO_RENEW: "⚠️ 续订失败",
	EXPIRED: "📕 订阅到期",
	GRACE_PERIOD_EXPIRED: "⌛ 宽限期结束",
	OFFER_REDEEMED: "🎟️ 优惠兑换",
	PRICE_INCREASE: "💱 价格调整",
	REFUND: "↩️ 退款",
	REFUND_DECLINED: "🚫 退款被拒",
	REFUND_REVERSED: "↪️ 退款撤销",
	REVOKE: "🔕 权益撤销",
	CONSUMPTION_REQUEST: "📨 消费信息请求",
	RENEWAL_EXTENDED: "📅 续订已延长",
	RENEWAL_EXTENSION: "📅 续订延长",
	ONE_TIME_CHARGE: "💰 买断购买",
	TEST: "🧪 测试通知",
};

// 商品 ID → 友好名。
const PRODUCT_LABEL: Record<string, string> = {
	"jiamin.chen.orange_cloud.pro.monthly": "Pro 月度",
	"jiamin.chen.orange_cloud.pro.yearly": "Pro 年度",
	"jiamin.chen.orange_cloud.pro.lifetime": "Pro 买断",
};

function formatPrice(price?: number, currency?: string): string | null {
	// Apple 的 price 为货币 milliunits（$19.99 → 19990）。
	if (typeof price !== "number" || !currency) return null;
	return `${(price / 1000).toFixed(2)} ${currency}`;
}

export interface BuiltMessage {
	title: string;
	body: string;
	group: string;
	isSandbox: boolean;
}

/** 解码后的通知 → Bark 标题/正文（纯函数）。 */
export function buildBarkMessage(decoded: DecodedNotification): BuiltMessage {
	const { payload, transaction } = decoded;
	const type = payload.notificationType;
	const environment = payload.data?.environment ?? transaction?.environment ?? "Production";
	const isSandbox = environment === "Sandbox";

	const label = TYPE_LABEL[type] ?? `📣 ${type}`;
	const title = isSandbox ? `🧪 ${label}` : label;

	// 正文：subtype · 商品 · 价格 · storefront · 环境（缺的省略）。
	const parts: string[] = [];
	if (payload.subtype) parts.push(payload.subtype);
	if (transaction?.productId) {
		parts.push(PRODUCT_LABEL[transaction.productId] ?? transaction.productId);
	}
	const price = formatPrice(transaction?.price, transaction?.currency);
	if (price) parts.push(price);
	if (transaction?.storefront) parts.push(transaction.storefront);
	parts.push(environment);

	return { title, body: parts.join(" · "), group: !isSandbox ? "Orange Cloud IAP" : "[🧪]Orange Cloud IAP", isSandbox };
}

/**
 * 构造并发送 Bark 推送。无 deviceKey（未配置）则静默跳过。
 * 供 webhook 在 ctx.waitUntil 里 fire-and-forget；发送失败仅记日志、不抛。
 */
export async function notifyAppleEvent(
	deviceKey: string | undefined,
	decoded: DecodedNotification,
	server?: string,
): Promise<void> {
	if (!deviceKey) return;
	const msg = buildBarkMessage(decoded);
	const push: BarkPush = {
		title: msg.title,
		body: msg.body,
		group: msg.group,
		icon: "https://orange-cloud.chatiro.app/icons/icon-64.png",
		// 真金白银的生产事件用 timeSensitive（穿透专注模式）；沙盒静默。
		level: msg.isSandbox ? "passive" : "timeSensitive",
		...(msg.isSandbox ? {} : { sound: "minuet" }),
	};
	try {
		await sendBark(deviceKey, push, server);
	} catch (err) {
		console.error("[apple-notifications] bark push failed", err);
	}
}
