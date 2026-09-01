/**
 * 拦 AI 爬虫的三层：robots.txt 只是表态（自愿遵守），
 * AI bot 策略与 AI Crawl Control 才在边缘强制执行（落地成一条 WAF 自定义规则），
 * AI 迷宫处理那些两层都不认的。纯 SVG、无 JS；配色走主题 token，竖版布局，窄屏不溢出。
 */
export default function AiCrawlerDefense() {
	const layers = [
		{
			y: 34,
			tag: "第一层 · 表态",
			title: "robots.txt",
			body: "写明不许抓，遵不遵守全看对方",
			enforced: false,
		},
		{
			y: 158,
			tag: "第二层 · 强制执行",
			title: "AI bot 策略 / AI Crawl Control",
			body: "在边缘直接拦，落地是一条 WAF 自定义规则",
			enforced: true,
		},
		{
			y: 282,
			tag: "第三层 · 消耗",
			title: "AI 迷宫（AI Labyrinth）",
			body: "给不听话的爬虫喂无尽的隐藏链接",
			enforced: true,
		},
	];

	return (
		<figure className="my-8">
			<svg
				viewBox="0 0 360 424"
				role="img"
				aria-label="拦截 AI 爬虫的三层手段。第一层是 robots.txt，只是表明立场，遵不遵守完全取决于爬虫自己。第二层是 AI bot 策略与 AI Crawl Control，在 Cloudflare 边缘直接拦截，落地形式是一条 WAF 自定义规则，属于强制执行。第三层是 AI 迷宫，给不遵守规则的爬虫喂无尽的隐藏链接来消耗它。只有第二层和第三层是真正能拦住爬虫的。"
				className="mx-auto block h-auto w-full max-w-[420px]"
			>
				<title>拦 AI 爬虫的三层：表态、强制执行、消耗</title>

				<text x="30" y="16" fontSize="11" fill="var(--t-tertiary)" letterSpacing="0.6">
					爬虫从上往下走
				</text>

				{layers.map((layer) => (
					<g key={layer.title}>
						<rect
							x="30"
							y={layer.y}
							width="300"
							height="76"
							rx="14"
							fill="var(--glass-bg)"
							stroke={layer.enforced ? "var(--oc-orange)" : "var(--divider)"}
							strokeOpacity={layer.enforced ? 0.55 : 1}
							strokeDasharray={layer.enforced ? undefined : "5 4"}
						/>
						<text x="46" y={layer.y + 22} fontSize="10.5" fill="var(--t-tertiary)" letterSpacing="0.6">
							{layer.tag}
						</text>
						<text x="46" y={layer.y + 44} fontSize="14" fontWeight="600" fill="var(--t-primary)">
							{layer.title}
						</text>
						<text x="46" y={layer.y + 63} fontSize="11.5" fill="var(--t-secondary)">
							{layer.body}
						</text>
					</g>
				))}

				<defs>
					<marker id="crawl-arrow" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="6" markerHeight="6" orient="auto">
						<path d="M0 0 L8 4 L0 8 z" fill="var(--oc-orange)" />
					</marker>
				</defs>

				<path d="M180 110 L180 152" stroke="var(--oc-orange)" strokeWidth="1.6" fill="none" markerEnd="url(#crawl-arrow)" />
				<text x="190" y="136" fontSize="10.5" fill="var(--t-tertiary)">
					不听话的照样过
				</text>

				<path d="M180 234 L180 276" stroke="var(--oc-orange)" strokeWidth="1.6" fill="none" markerEnd="url(#crawl-arrow)" />
				<text x="190" y="260" fontSize="10.5" fill="var(--t-tertiary)">
					认不出 UA 的漏网
				</text>

				<line x1="30" y1="378" x2="330" y2="378" stroke="var(--divider)" strokeDasharray="4 5" />
				<text x="180" y="402" textAnchor="middle" fontSize="12" fill="var(--t-secondary)">
					你的网页内容
				</text>
			</svg>
			<figcaption className="mt-3 text-center text-[13px] leading-relaxed t-tertiary">
				虚线那一层不拦人，只是把话说清楚。真正的门在第二层，第三层负责收拾漏进来的。
			</figcaption>
		</figure>
	);
}
