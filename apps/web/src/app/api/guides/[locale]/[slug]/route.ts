import { NextRequest, NextResponse } from "next/server";
import { guidePath, guidesFor, isGuideLocale } from "@/lib/guides/guides";
import { parseGuideArticle } from "@/lib/guides/feed";

/**
 * 单篇指南正文（App 用）：把已渲染的文章页解析成结构化块。
 *
 * 正文是手写 JSX、没有 markdown 源，所以这里回取自己那一页的 HTML 再解析——
 * 好处是文章怎么改、这里就跟着变，不存在第二份需要同步的内容副本。
 * 子请求带 cacheEverything，边缘命中后不会真的重新渲染页面。
 */
const SITE_URL = "https://o-c.do";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ locale: string; slug: string }> },
): Promise<NextResponse> {
	const { locale, slug } = await params;
	if (!isGuideLocale(locale)) {
		return NextResponse.json({ error: "unknown locale" }, { status: 404 });
	}
	const meta = guidesFor(locale).find((guide) => guide.slug === slug);
	if (!meta) {
		return NextResponse.json({ error: "unknown guide" }, { status: 404 });
	}

	const path = guidePath(locale, `/guides/${slug}`);
	const origin = new URL(request.url).origin;
	const upstream = await fetch(`${origin}${path}`, {
		headers: { "accept-language": locale },
		cf: { cacheEverything: true, cacheTtl: 1800 },
	} as RequestInit);

	if (!upstream.ok) {
		return NextResponse.json({ error: "guide unavailable" }, { status: 502 });
	}

	const blocks = parseGuideArticle(await upstream.text(), SITE_URL);
	if (blocks.length === 0) {
		return NextResponse.json({ error: "guide unavailable" }, { status: 502 });
	}

	return NextResponse.json(
		{
			version: 1,
			locale,
			slug,
			title: meta.h1,
			description: meta.description,
			blurb: meta.blurb,
			updated: meta.updated,
			readingTime: meta.readingTime,
			url: `${SITE_URL}${path}`,
			blocks,
		},
		{ headers: { "cache-control": "public, max-age=1800, s-maxage=86400" } },
	);
}
