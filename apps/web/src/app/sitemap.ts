import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { GUIDES, GUIDE_LOCALE } from "@/lib/guides/guides";

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

	// 指南板块只有英文版：不列 alternates，避免指向不存在的语言版本
	const guides: MetadataRoute.Sitemap = [
		{ url: urlFor(GUIDE_LOCALE, "/guides"), lastModified: new Date(GUIDES[0].updated) },
		...GUIDES.map((guide) => ({
			url: urlFor(GUIDE_LOCALE, `/guides/${guide.slug}`),
			lastModified: new Date(guide.updated),
		})),
	];

	return [...localized, ...guides];
}
