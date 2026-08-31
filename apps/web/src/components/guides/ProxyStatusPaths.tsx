/**
 * 代理状态对照图：同一个名字在橙云 / 灰云下，DNS 答案与请求路径分别长什么样。
 * 纯 SVG、无 JS；配色全走主题 token，亮/暗两套都成立；单列竖排，窄屏不溢出。
 * 说明文字一律放在方框外的整幅宽度上——框内只留一个词，避免窄屏挤到边。
 */
export default function ProxyStatusPaths() {
	const node = (x: number, y: number) => ({ x, y, width: 100, height: 48, rx: 12 });
	const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

	return (
		<figure className="my-8">
			<svg
				viewBox="0 0 360 352"
				role="img"
				aria-label="Two request paths compared. With the orange cloud the DNS answer is a Cloudflare anycast address and the request goes from the visitor to Cloudflare and then to your origin, so caching, WAF and Rules run at the Cloudflare hop. With the grey cloud the DNS answer is your own server address and the request goes straight from the visitor to your origin, skipping Cloudflare entirely."
				className="mx-auto block h-auto w-full max-w-[440px]"
			>
				<title>Orange cloud (proxied) vs grey cloud (DNS only): the two request paths</title>

				<defs>
					<marker id="ps-arrow" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="6" markerHeight="6" orient="auto">
						<path d="M0 0 L8 4 L0 8 z" fill="var(--oc-orange)" />
					</marker>
					<marker id="ps-arrow-grey" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="6" markerHeight="6" orient="auto">
						<path d="M0 0 L8 4 L0 8 z" fill="var(--t-tertiary)" />
					</marker>
				</defs>

				{/* —— 橙云：请求先到 Cloudflare —— */}
				<text x="180" y="16" textAnchor="middle" fontSize="11" letterSpacing="0.8" fill="var(--oc-orange)">
					ORANGE CLOUD · PROXIED
				</text>
				<text x="180" y="39" textAnchor="middle" fontSize="11" fill="var(--t-secondary)" fontFamily={MONO}>
					DNS answer: 104.21.0.1
				</text>

				<rect {...node(8, 54)} fill="var(--glass-bg)" stroke="var(--divider)" />
				<text x="58" y="83" textAnchor="middle" fontSize="13" fill="var(--t-primary)">
					Visitor
				</text>

				<rect {...node(130, 54)} fill="var(--glass-bg)" stroke="var(--oc-orange)" strokeOpacity="0.6" />
				<text x="180" y="83" textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--t-primary)">
					Cloudflare
				</text>

				<rect {...node(252, 54)} fill="var(--glass-bg)" stroke="var(--divider)" />
				<text x="302" y="83" textAnchor="middle" fontSize="13" fill="var(--t-primary)">
					Your origin
				</text>

				<g stroke="var(--oc-orange)" strokeWidth="1.6" markerEnd="url(#ps-arrow)" fill="none">
					<path d="M108 78 L126 78" />
					<path d="M230 78 L248 78" />
				</g>

				<text x="180" y="126" textAnchor="middle" fontSize="11.5" fill="var(--t-secondary)">
					Cache, WAF and Rules run at this hop.
				</text>
				<text x="180" y="144" textAnchor="middle" fontSize="11.5" fill="var(--t-secondary)">
					Your origin address is never published for this name.
				</text>

				<line x1="30" y1="168" x2="330" y2="168" stroke="var(--divider)" strokeWidth="1" />

				{/* —— 灰云：Cloudflare 根本不在路径上 —— */}
				<text x="180" y="199" textAnchor="middle" fontSize="11" letterSpacing="0.8" fill="var(--t-tertiary)">
					GREY CLOUD · DNS ONLY
				</text>
				<text x="180" y="222" textAnchor="middle" fontSize="11" fill="var(--t-secondary)" fontFamily={MONO}>
					DNS answer: 203.0.113.10
				</text>

				<rect {...node(8, 237)} fill="var(--glass-bg)" stroke="var(--divider)" />
				<text x="58" y="266" textAnchor="middle" fontSize="13" fill="var(--t-primary)">
					Visitor
				</text>

				<rect
					{...node(130, 237)}
					fill="none"
					stroke="var(--divider)"
					strokeDasharray="4 5"
					strokeOpacity="0.8"
				/>
				<text x="180" y="260" textAnchor="middle" fontSize="13" fill="var(--t-tertiary)">
					Cloudflare
				</text>
				<text x="180" y="276" textAnchor="middle" fontSize="11" fill="var(--t-tertiary)">
					skipped
				</text>

				<rect {...node(252, 237)} fill="var(--glass-bg)" stroke="var(--divider)" />
				<text x="302" y="266" textAnchor="middle" fontSize="13" fill="var(--t-primary)">
					Your origin
				</text>

				<path
					d="M108 268 C 142 322, 218 322, 246 272"
					fill="none"
					stroke="var(--t-tertiary)"
					strokeWidth="1.6"
					markerEnd="url(#ps-arrow-grey)"
				/>

				<text x="180" y="345" textAnchor="middle" fontSize="11.5" fill="var(--t-secondary)">
					Nothing to cache, filter or log.
				</text>
			</svg>
			<figcaption className="mt-3 text-center text-[13px] leading-relaxed t-tertiary">
				The toggle changes the DNS answer first; the path follows.
			</figcaption>
		</figure>
	);
}
