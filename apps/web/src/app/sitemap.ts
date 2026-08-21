import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { GUIDE_LOCALES, guidePath, guidesFor } from "@/lib/guides/guides";

const SITE_URL = "https://o-c.do";

function urlFor(locale: string, path: string) {
	const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
	return `${SITE_URL}${prefix}${path}` || SITE_URL;
}

export default function sitemap(): MetadataRoute.Sitemap {
	const pages = ["", "/privacy", "/terms", "/contact"];

	const localized: MetadataRoute.Sitemap = pages.map((path) => ({
		url: urlFor(routing.defaultLocale, path) || SITE_URL,
		lastModified: new Date(),
		alternates: {
			languages: Object.fromEntries(routing.locales.map((locale) => [locale, urlFor(locale, path)])),
		},
	}));

	// 指南板块只有英文与简体中文两套，且文章各写各的：
	// 只有索引页互为 alternates，文章不列，避免指向不存在的语言版本
	const guides: MetadataRoute.Sitemap = GUIDE_LOCALES.flatMap((locale) => {
		const list = guidesFor(locale);
		return [
			{
				url: `${SITE_URL}${guidePath(locale, "/guides")}`,
				lastModified: new Date(list[0].updated),
				alternates: {
					languages: Object.fromEntries(
						GUIDE_LOCALES.map((l) => [l, `${SITE_URL}${guidePath(l, "/guides")}`]),
					),
				},
			},
			...list.map((guide) => ({
				url: `${SITE_URL}${guidePath(locale, `/guides/${guide.slug}`)}`,
				lastModified: new Date(guide.updated),
			})),
		];
	});

	return [...localized, ...guides];
}
