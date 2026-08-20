import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import HorizonArc from "@/components/HorizonArc";
import Stars from "@/components/Stars";
import { APP_STORE_URL } from "@/components/AppStoreBadge";

export type RelatedLink = {
	href: string;
	label: string;
	note: string;
	external?: boolean;
};

/**
 * 指南文章外壳：沿用首页「一天」的天色叙事——
 * 晨（标题）→ 昼（正文）→ 黄昏（延伸阅读）→ 日落缝 → 夜（产品 + 页脚）。
 * 正文版心 760px（约 68 字符/行），为长文阅读而非营销页留白。
 */
export default function GuideShell({
	title,
	lede,
	updated,
	readingTime,
	related,
	children,
}: {
	title: string;
	lede: string;
	updated: string;
	readingTime: string;
	related: RelatedLink[];
	children: ReactNode;
}) {
	const updatedLabel = new Date(`${updated}T00:00:00Z`).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
		timeZone: "UTC",
	});

	return (
		<>
			<div className="guides theme-light">
				{/* —— 标题 · 清晨 —— */}
				<section className="sky-band band-dawn dawn-glow overflow-hidden">
					<SiteHeader hideLocaleSwitcher />
					<div className="relative mx-auto w-full max-w-[760px] px-6 pb-12 pt-32">
						<nav aria-label="Breadcrumb" className="text-[13px]">
							<ol className="flex flex-wrap items-center gap-2 t-secondary">
								<li>
									<Link href="/guides" className="link-quiet underline underline-offset-2">
										Guides
									</Link>
								</li>
								<li aria-hidden="true">/</li>
								<li className="t-tertiary">{title}</li>
							</ol>
						</nav>
						<h1 className="f-display mt-4 text-[34px] font-bold leading-[1.15] t-primary sm:text-[40px]">
							{title}
						</h1>
						<p className="mt-4 text-[18px] leading-relaxed t-secondary">{lede}</p>
						<p className="mt-5 text-[13px] t-tertiary">
							Updated {updatedLabel} · {readingTime}
						</p>
						<HorizonArc className="mt-10" />
					</div>
				</section>

				{/* —— 正文 · 白昼 —— */}
				<section className="sky-band band-morning">
					<article className="prose mx-auto w-full max-w-[760px] px-6 pb-20 pt-10">{children}</article>
				</section>

				{/* —— 延伸阅读 · 黄昏 —— */}
				<section className="sky-band band-dusk">
					<div className="mx-auto w-full max-w-[760px] px-6 py-16">
						<h2 className="f-display text-[24px] font-bold t-primary">Keep reading</h2>
						<div className="mt-6 grid gap-3">
							{related.map((item) =>
								item.external ? (
									<a
										key={item.href}
										href={item.href}
										target="_blank"
										rel="noopener noreferrer"
										className="glass r-island block p-5 no-underline"
									>
										<span className="block text-[16px] font-semibold t-primary">{item.label} ↗</span>
										<span className="mt-1.5 block text-[14px] leading-relaxed t-secondary">{item.note}</span>
									</a>
								) : (
									<Link key={item.href} href={item.href} className="glass r-island block p-5 no-underline">
										<span className="block text-[16px] font-semibold t-primary">{item.label}</span>
										<span className="mt-1.5 block text-[14px] leading-relaxed t-secondary">{item.note}</span>
									</Link>
								),
							)}
						</div>
					</div>
				</section>
			</div>

			{/* —— 日落缝：把页面从昼带入夜 —— */}
			<div className="guides band-sunset relative h-[180px] overflow-hidden" aria-hidden="true">
				<div
					className="absolute left-1/2 top-[46%] h-[130px] w-[760px] max-w-[160vw] -translate-x-1/2 -translate-y-1/2"
					style={{
						borderRadius: "50%",
						background: "radial-gradient(50% 50% at 50% 50%, rgba(255,200,130,0.5) 0%, rgba(255,170,90,0) 70%)",
					}}
				/>
				<div
					className="absolute left-1/2 top-[46%] h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full"
					style={{ background: "#FFDCAC", boxShadow: "0 0 40px 13px rgba(255,180,100,0.65)" }}
				/>
			</div>

			{/* —— 产品 + 页脚 · 夜 —— */}
			<div className="guides theme-dark">
				<section className="sky-band band-night relative">
					<Stars />
					<div className="relative mx-auto w-full max-w-[760px] px-6 pt-16">
						<div className="glass r-island p-7 sm:p-8">
							<h2 className="f-display text-[22px] font-bold t-primary">Manage this from your phone</h2>
							<p className="mt-2.5 text-[15px] leading-relaxed t-secondary">
								Orange Cloud is a native iOS and Android client for Cloudflare. Sign in with Cloudflare
								OAuth and flip proxy status, edit DNS records, and read traffic analytics from anywhere.
							</p>
							<a href={APP_STORE_URL} className="cta-store mt-6 text-[15px]">
								Get Orange Cloud
							</a>
						</div>
					</div>
					<div className="relative mt-12">
						<SiteFooter />
					</div>
				</section>
			</div>
		</>
	);
}
