/**
 * 指南板块（/guides）的清单——目前只有英文版：
 * 这批查询（orange cloud / orange-to-orange）几乎全是英文，
 * 不为不存在的语言写 hreflang，避免稀薄内容与软 404。
 */
export const GUIDE_LOCALE = "en";

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
];

export function guideBySlug(slug: string): GuideMeta {
	const guide = GUIDES.find((g) => g.slug === slug);
	if (!guide) throw new Error(`Unknown guide: ${slug}`);
	return guide;
}

export const GUIDES_INDEX = {
	title: "Guides — Orange Cloud",
	h1: "Guides",
	description:
		"Plain-language guides to the Cloudflare settings people actually search for: the orange cloud, proxy status, SSL/TLS encryption modes, and Orange-to-Orange routing.",
};
