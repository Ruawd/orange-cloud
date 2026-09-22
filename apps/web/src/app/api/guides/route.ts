import { NextResponse } from "next/server";
import {
	GUIDE_LOCALES,
	guidePath,
	guidesFor,
	guidesIndexFor,
	type GuideLocale,
} from "@/lib/guides/guides";

/**
 * 指南清单（App 用）。
 *
 * 两语各写各的、互不翻译（见 lib/guides/guides.ts），所以这里按语言并列返回两套，
 * 由客户端按设备语言挑一套作为「原文」，其余语言靠设备本地翻译。
 * 数据源就是站点自己的清单常量，不读文章正文，因此可长缓存。
 */
const SITE_URL = "https://o-c.do";

export async function GET(): Promise<NextResponse> {
	const locales = Object.fromEntries(
		GUIDE_LOCALES.map((locale: GuideLocale) => {
			const index = guidesIndexFor(locale);
			return [
				locale,
				{
					title: index.h1,
					description: index.description,
					url: `${SITE_URL}${guidePath(locale, "/guides")}`,
					guides: guidesFor(locale).map((guide) => ({
						slug: guide.slug,
						title: guide.h1,
						blurb: guide.blurb,
						description: guide.description,
						updated: guide.updated,
						readingTime: guide.readingTime,
						url: `${SITE_URL}${guidePath(locale, `/guides/${guide.slug}`)}`,
					})),
				},
			];
		}),
	);

	return NextResponse.json(
		{ version: 1, locales },
		{ headers: { "cache-control": "public, max-age=1800, s-maxage=86400" } },
	);
}
