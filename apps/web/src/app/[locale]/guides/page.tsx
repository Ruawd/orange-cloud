import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import HorizonArc from "@/components/HorizonArc";
import { GUIDES, GUIDES_INDEX, GUIDE_LOCALE } from "@/lib/guides/guides";

const SITE_URL = "https://o-c.do";

export const metadata: Metadata = {
	metadataBase: new URL(SITE_URL),
	title: GUIDES_INDEX.title,
	description: GUIDES_INDEX.description,
	alternates: {
		canonical: "/guides",
		languages: { en: "/guides", "x-default": "/guides" },
	},
	openGraph: {
		title: GUIDES_INDEX.title,
		description: GUIDES_INDEX.description,
		url: "/guides",
		siteName: "Orange Cloud",
		type: "website",
		locale: "en_US",
		images: [{ url: "/og/en.jpg", width: 1280, height: 640, alt: "Orange Cloud" }],
	},
	twitter: {
		card: "summary_large_image",
		title: GUIDES_INDEX.title,
		description: GUIDES_INDEX.description,
		images: ["/og/en.jpg"],
	},
};

export default async function GuidesIndexPage({ params }: { params: Promise<{ locale: string }> }) {
	const { locale } = await params;
	// 指南只有英文版：其它语言前缀不提供内容，避免稀薄的机翻页与软 404
	if (locale !== GUIDE_LOCALE) notFound();
	setRequestLocale(locale);

	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "CollectionPage",
		name: GUIDES_INDEX.h1,
		description: GUIDES_INDEX.description,
		url: `${SITE_URL}/guides`,
		inLanguage: "en",
		hasPart: GUIDES.map((guide) => ({
			"@type": "TechArticle",
			headline: guide.h1,
			url: `${SITE_URL}/guides/${guide.slug}`,
		})),
	};

	return (
		<div className="guides theme-light sky-band band-dawn dawn-glow flex min-h-screen flex-col overflow-x-clip">
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
			<SiteHeader hideLocaleSwitcher />
			<main className="relative mx-auto w-full max-w-[760px] flex-1 px-6 pb-20 pt-32">
				<h1 className="f-display text-[34px] font-bold t-primary sm:text-[40px]">{GUIDES_INDEX.h1}</h1>
				<p className="mt-4 max-w-[56ch] text-[17px] leading-relaxed t-secondary">
					{GUIDES_INDEX.description}
				</p>
				<HorizonArc className="mt-9" />

				<div className="mt-10 grid gap-4">
					{GUIDES.map((guide) => (
						<Link
							key={guide.slug}
							href={`/guides/${guide.slug}`}
							className="glass r-island block p-6 no-underline transition-transform duration-150 ease-out hover:scale-[1.008] active:scale-[0.995]"
						>
							<h2 className="f-display text-[21px] font-bold leading-snug t-primary">{guide.h1}</h2>
							<p className="mt-2.5 text-[15px] leading-relaxed t-secondary">{guide.blurb}</p>
							<p className="mt-4 text-[13px] t-tertiary">{guide.readingTime}</p>
						</Link>
					))}
				</div>
			</main>
			<SiteFooter />
		</div>
	);
}
