/**
 * 指南板块（/guides）的清单——按语言分列：
 * 英文一套（/guides/…）、简体中文一套（/zh-Hans/guides/…）。
 * 两套选题各自独立、互不翻译：英文追 orange cloud / O2O 这类英文查询，
 * 中文追「内网穿透」「回源」这类中文查询。因此**不为文章写跨语言 hreflang**，
 * 只有索引页两语并列（同一份栏目，两个语言版本）。
 */
export const GUIDE_LOCALE = "en";
export const GUIDE_LOCALE_ZH = "zh-Hans";
export const GUIDE_LOCALES = [GUIDE_LOCALE, GUIDE_LOCALE_ZH] as const;
export type GuideLocale = (typeof GUIDE_LOCALES)[number];

export function isGuideLocale(locale: string): locale is GuideLocale {
	return (GUIDE_LOCALES as readonly string[]).includes(locale);
}

/** 站内绝对路径：默认语言无前缀（与 next-intl 的 as-needed 一致） */
export function guidePath(locale: GuideLocale, path: string) {
	return locale === GUIDE_LOCALE ? path : `/${locale}${path}`;
}

export type GuideMeta = {
	slug: string;
	/** 页面 H1 */
	h1: string;
	/** <title>（≤60 字符） */
	title: string;
	/** meta description（≤155 字符），首句即答案 */
	description: string;
	/** 索引页上的一句话摘要 */
	blurb: string;
	/** ISO 日期，用于 sitemap lastmod 与文章页「Updated」 */
	updated: string;
	readingTime: string;
};

export const GUIDES: GuideMeta[] = [
	{
		slug: "what-is-the-orange-cloud-in-cloudflare",
		h1: "What Does the Orange Cloud Mean in Cloudflare?",
		title: "Cloudflare Orange Cloud: Proxied vs DNS Only, Explained",
		description:
			"The orange cloud means a DNS record is proxied through Cloudflare. The gray cloud means DNS only. What changes, which records qualify, when to use each.",
		blurb:
			"Proxied vs DNS only: what the toggle actually changes, which record types and ports it covers, and how to read the errors it causes.",
		updated: "2026-08-19",
		readingTime: "8 min read",
	},
	{
		slug: "cloudflare-orange-to-orange",
		h1: "Cloudflare Orange-to-Orange (O2O), Explained",
		title: "Cloudflare Orange-to-Orange (O2O), Explained",
		description:
			"Orange-to-Orange is when a proxied hostname routes through two Cloudflare zones — yours and your SaaS provider's. How requests flow and which zone's settings win.",
		blurb:
			"Two Cloudflare zones, one request: how O2O routing works with Cloudflare for SaaS, which zone each setting applies in, and what breaks.",
		updated: "2026-08-19",
		readingTime: "7 min read",
	},
	{
		slug: "cloudflare-ssl-tls-encryption-modes",
		h1: "Which Cloudflare SSL/TLS Encryption Mode Should You Use?",
		title: "Cloudflare SSL Modes: Flexible vs Full vs Full (strict)",
		description:
			"Use Full (strict) unless your origin has no valid certificate. Flexible leaves the Cloudflare-to-origin hop unencrypted and causes redirect loops.",
		blurb:
			"Off, Flexible, Full, Full (strict): what each does to the second hop, which error each one produces, and why Cloudflare may now pick for you.",
		updated: "2026-08-20",
		readingTime: "8 min read",
	},
	{
		slug: "why-is-cloudflare-not-caching-my-site",
		h1: "Why Is Cloudflare Not Caching My Site?",
		title: "Why Isn't Cloudflare Caching My Site? cf-cache-status",
		description:
			"Cloudflare does not cache HTML or JSON by default. DYNAMIC means the request was never eligible; BYPASS means the origin response blocked caching.",
		blurb:
			"DYNAMIC, BYPASS and a MISS that never becomes a HIT are three different failures with three different fixes — read the header first.",
		updated: "2026-08-20",
		readingTime: "8 min read",
	},
	{
		slug: "why-is-my-cloudflare-dns-change-not-working",
		h1: "Why Isn\u2019t My Cloudflare DNS Change Working Yet?",
		title: "Cloudflare DNS Change Not Working? Propagation Explained",
		description:
			"Cloudflare publishes zone changes globally within five minutes. The wait is a cache: a record TTL, a negatively cached NXDOMAIN, or a stale delegation.",
		blurb:
			"Nothing propagates \u2014 caches expire. Which of the four layers is holding your old answer, and why lowering the TTL cannot fix a cached NXDOMAIN.",
		updated: "2026-08-21",
		readingTime: "8 min read",
	},
	{
		slug: "cloudflare-purge-cache-not-working",
		h1: "Why Isn\u2019t My Cloudflare Cache Purge Working?",
		title: "Cloudflare Purge Cache Not Working? What to Check",
		description:
			"A purge clears one exact cache key \u2014 nothing else. Custom cache keys, transformed URLs and the copy already in a browser all survive a purge by URL.",
		blurb:
			"Instant Purge really is instant, so a stale file means the purge matched nothing \u2014 or the copy you are looking at was never Cloudflare\u2019s to delete.",
		updated: "2026-08-22",
		readingTime: "7 min read",
	},
];

export const GUIDES_ZH: GuideMeta[] = [
	{
		slug: "cloudflare-yuanzhan-ip-xielou",
		h1: "套了 Cloudflare，源站真实 IP 还会泄露吗？",
		title: "Cloudflare 下源站 IP 怎么泄露的，怎么堵",
		description:
			"会。橙云只挡住 A、AAAA、CNAME 上的 HTTP 流量，灰云子域、MX 的 _dc-mx 应答、SPF 里的 ip4:、历史解析与证书透明度日志都会把源站 IP 交出去。",
		blurb:
			"五条绕开代理的泄露路径、一条能自查的 dig 命令，以及为什么真正的防线不在 DNS 里，而在源站自己身上。",
		updated: "2026-08-22",
		readingTime: "约 10 分钟",
	},
	{
		slug: "cloudflare-522-error",
		h1: "Cloudflare 为什么会报 522 错误？",
		title: "Cloudflare 522 错误：连接超时的成因与排查",
		description:
			"522 的意思是 Cloudflare 在 19 秒内没能和源站建立 TCP 连接。最常见的原因是源站防火墙挡了回源 IP，其次是源站过载、IP 填错，或跨境回源链路丢包。",
		blurb:
			"19 秒、90 秒、125 秒各对应哪种失败，521 与 522 的分界在哪，以及国内源站配境外边缘节点时那种查不出原因的间歇性 522。",
		updated: "2026-08-21",
		readingTime: "约 9 分钟",
	},
	{
		slug: "cloudflare-tunnel-neiwang-chuantou",
		h1: "没有公网 IP，怎么用 Cloudflare Tunnel 做内网穿透？",
		title: "Cloudflare Tunnel 内网穿透：没有公网 IP 也能用",
		description:
			"cloudflared 从内网主动向 Cloudflare 建立出站连接，所以不需要公网 IP，也不用在路由器上开放端口。本文讲清它与 frp 的差别、配置步骤，以及免费方案的真实限制。",
		blurb:
			"出站连接模型、三种隧道形态的取舍、五分钟配置流程，以及 100 MB 上传上限、视频类内容条款、大陆访问绕境外这些必须先知道的边界。",
		updated: "2026-08-21",
		readingTime: "约 9 分钟",
	},
];

export function guideBySlug(slug: string, locale: GuideLocale = GUIDE_LOCALE): GuideMeta {
	const guide = guidesFor(locale).find((g) => g.slug === slug);
	if (!guide) throw new Error(`Unknown guide: ${locale} ${slug}`);
	return guide;
}

export function guidesFor(locale: GuideLocale): GuideMeta[] {
	return locale === GUIDE_LOCALE_ZH ? GUIDES_ZH : GUIDES;
}

export const GUIDES_INDEX = {
	title: "Guides — Orange Cloud",
	h1: "Guides",
	description:
		"Plain-language guides to the Cloudflare settings people actually search for: the orange cloud, proxy status, SSL/TLS encryption modes, and caching.",
};

export const GUIDES_INDEX_ZH = {
	title: "Cloudflare 指南 — Orange Cloud",
	h1: "Cloudflare 指南",
	description:
		"用人话讲清楚 Cloudflare 里那些真正被搜索的问题：内网穿透、代理状态、回源与缓存、SSL/TLS 加密模式。每篇都对着官方文档逐条核过。",
};

export function guidesIndexFor(locale: GuideLocale) {
	return locale === GUIDE_LOCALE_ZH ? GUIDES_INDEX_ZH : GUIDES_INDEX;
}
