/**
 * 「一个能打开的网站由三层拼起来」的分层图：注册商（域名归谁，年费）→
 * DNS 服务商（域名指向哪里）→ 服务器（网站文件，月费）。
 * 小白最常缺的心智模型：这三层是三个独立的服务、三笔独立的钱，
 * 在面板里添加域名只动到中间那层，跟第一层的所有权无关。
 * 纯 SVG、无 JS；配色全走主题 token，亮/暗两套都成立；竖版布局，窄屏不溢出。
 */
export default function DomainOwnershipStack() {
	return (
		<figure className="my-8">
			<svg
				viewBox="0 0 360 452"
				role="img"
				aria-label="一个能打开的网站由三层拼起来。第一层是注册商，你在这里按年付费买下域名，域名归谁由这一层决定，也只有持有者能在这里填写 NS。第二层是 DNS 服务商，例如 Cloudflare，它回答「这个域名指向哪个 IP」，你在这里填 A 记录。第三层是服务器，按月付费，网站文件真正存放在这里。三层是三个独立的服务、三笔独立的钱，缺任何一层域名都打不开网站。"
				className="mx-auto block h-auto w-full max-w-[420px]"
			>
				<title>域名、解析、服务器：三层各管什么</title>

				<defs>
					<marker id="own-arrow" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="6" markerHeight="6" orient="auto">
						<path d="M0 0 L8 4 L0 8 z" fill="var(--oc-orange)" />
					</marker>
				</defs>

				{/* 第一层 · 注册商：所有权与年费都在这里 */}
				<rect
					x="20"
					y="12"
					width="320"
					height="86"
					rx="16"
					fill="var(--glass-bg)"
					stroke="var(--oc-orange)"
					strokeOpacity="0.55"
				/>
				<text x="36" y="36" fontSize="11" fill="var(--t-tertiary)" letterSpacing="0.6">
					第 1 层 · 所有权
				</text>
				<text x="36" y="59" fontSize="15" fontWeight="600" fill="var(--t-primary)">
					注册商
				</text>
				<text x="36" y="77" fontSize="11.5" fill="var(--t-secondary)">
					腾讯云 / 阿里云 / Cloudflare Registrar
				</text>
				<text x="36" y="92" fontSize="11.5" fill="var(--t-secondary)">
					按年付费 · 域名归谁由这一层决定
				</text>

				<path d="M180 100 L180 132" stroke="var(--oc-orange)" strokeWidth="1.6" fill="none" markerEnd="url(#own-arrow)" />
				<text x="190" y="120" fontSize="11.5" fill="var(--t-secondary)">
					持有者在这里填 NS
				</text>

				{/* 第二层 · DNS：只回答「指向哪里」 */}
				<rect
					x="20"
					y="136"
					width="320"
					height="86"
					rx="16"
					fill="var(--glass-bg)"
					stroke="var(--oc-orange)"
					strokeOpacity="0.55"
				/>
				<text x="36" y="160" fontSize="11" fill="var(--t-tertiary)" letterSpacing="0.6">
					第 2 层 · 指向
				</text>
				<text x="36" y="183" fontSize="15" fontWeight="600" fill="var(--t-primary)">
					DNS 服务商
				</text>
				<text x="36" y="201" fontSize="11.5" fill="var(--t-secondary)">
					Cloudflare 就在这一层
				</text>
				<text x="36" y="216" fontSize="11.5" fill="var(--t-secondary)">
					可免费 · 回答「域名指向哪个 IP」
				</text>

				<path d="M180 224 L180 256" stroke="var(--oc-orange)" strokeWidth="1.6" fill="none" markerEnd="url(#own-arrow)" />
				<text x="190" y="244" fontSize="11.5" fill="var(--t-secondary)">
					记录里填服务器的 IP
				</text>

				{/* 第三层 · 服务器：内容真正所在 */}
				<rect x="20" y="260" width="320" height="86" rx="16" fill="var(--glass-bg)" stroke="var(--divider)" />
				<text x="36" y="284" fontSize="11" fill="var(--t-tertiary)" letterSpacing="0.6">
					第 3 层 · 内容
				</text>
				<text x="36" y="307" fontSize="15" fontWeight="600" fill="var(--t-primary)">
					服务器 / 主机
				</text>
				<text x="36" y="325" fontSize="11.5" fill="var(--t-secondary)">
					云服务器 / 虚拟主机 / 静态托管
				</text>
				<text x="36" y="340" fontSize="11.5" fill="var(--t-secondary)">
					按月付费 · 网站文件真正放在这里
				</text>

				{/* 三笔钱是分开的 */}
				<rect
					x="20"
					y="368"
					width="320"
					height="70"
					rx="16"
					fill="none"
					stroke="var(--divider)"
					strokeDasharray="4 5"
				/>
				<text x="180" y="392" textAnchor="middle" fontSize="12.5" fontWeight="600" fill="var(--t-primary)">
					三层是三个独立的服务，三笔独立的钱
				</text>
				<text x="180" y="412" textAnchor="middle" fontSize="11.5" fill="var(--t-secondary)">
					买了域名不等于有了网站
				</text>
				<text x="180" y="429" textAnchor="middle" fontSize="11.5" fill="var(--t-secondary)">
					在面板里添加域名只动到第 2 层
				</text>
			</svg>
			<figcaption className="mt-3 text-center text-[13px] leading-relaxed t-tertiary">
				新手最常缺的就是这张图：以为「域名」「解析」「网站」是一件事。它们是三件事，缺哪一层网站都打不开。
			</figcaption>
		</figure>
	);
}
