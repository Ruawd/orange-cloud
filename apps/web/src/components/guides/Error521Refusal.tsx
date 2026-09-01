/**
 * Error 521 的位置图：请求到了 Cloudflare 边缘，边缘向源站发起 TCP 连接，
 * 源站那一侧**主动拒绝**（RST / ECONNREFUSED）—— 于是立刻返回 521。
 * 与 522 的分界画在同一张图上：被拒绝（有回应）是 521，被静默丢弃才是 522。
 * 纯 SVG、无 JS；配色全走主题 token，亮/暗两套都成立；竖版布局，窄屏不溢出。
 */
export default function Error521Refusal() {
	const col = { x: 30, width: 260, rx: 14 };

	return (
		<figure className="my-8">
			<svg
				viewBox="0 0 400 404"
				role="img"
				aria-label="Where Cloudflare error 521 happens: a visitor reaches the Cloudflare edge normally, the edge opens a TCP connection to the origin server, and the origin answers immediately with a refusal — a TCP reset, meaning nothing is listening on that port or a firewall rejected the packet. Cloudflare returns error 521, web server is down, within a fraction of a second. Had the origin stayed silent instead of refusing, the result would be error 522 after a nineteen second timeout."
				className="mx-auto block h-auto w-full max-w-[440px]"
			>
				<title>Where a Cloudflare 521 error happens on the path to your origin</title>

				{/* 1 · 访客 → 边缘：这一段是通的 */}
				<rect {...col} y="12" height="52" fill="var(--glass-bg)" stroke="var(--divider)" />
				<text x="160" y="36" textAnchor="middle" fontSize="15" fontWeight="600" fill="var(--t-primary)">
					Visitor
				</text>
				<text x="160" y="53" textAnchor="middle" fontSize="12" fill="var(--t-secondary)">
					reaches Cloudflare normally
				</text>

				<defs>
					<marker id="e521-arrow" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="6" markerHeight="6" orient="auto">
						<path d="M0 0 L8 4 L0 8 z" fill="var(--oc-orange)" />
					</marker>
					<marker
						id="e521-arrow-back"
						viewBox="0 0 8 8"
						refX="6"
						refY="4"
						markerWidth="6"
						markerHeight="6"
						orient="auto"
					>
						<path d="M0 0 L8 4 L0 8 z" fill="var(--t-secondary)" />
					</marker>
				</defs>

				<path
					d="M160 68 L160 96"
					stroke="var(--oc-orange)"
					strokeWidth="1.6"
					fill="none"
					markerEnd="url(#e521-arrow)"
				/>

				{/* 2 · Cloudflare 边缘：向源站发 SYN */}
				<rect {...col} y="102" height="56" fill="var(--glass-bg)" stroke="var(--oc-orange)" strokeOpacity="0.55" />
				<text x="160" y="127" textAnchor="middle" fontSize="15" fontWeight="600" fill="var(--t-primary)">
					Cloudflare edge
				</text>
				<text x="160" y="144" textAnchor="middle" fontSize="12" fill="var(--t-secondary)">
					opens a TCP connection to the origin
				</text>

				{/* 3 · 去程 SYN + 回程 RST：一来一回，没有等待 */}
				<path
					d="M132 162 L132 232"
					stroke="var(--oc-orange)"
					strokeWidth="1.6"
					fill="none"
					markerEnd="url(#e521-arrow)"
				/>
				<path
					d="M188 232 L188 162"
					stroke="var(--t-secondary)"
					strokeWidth="1.6"
					fill="none"
					markerEnd="url(#e521-arrow-back)"
				/>
				<text x="200" y="190" fontSize="11" fill="var(--t-tertiary)">
					refused at once
				</text>
				<text x="200" y="207" fontSize="11" fill="var(--t-tertiary)">
					(TCP reset)
				</text>

				{/* 4 · 源站侧：主动拒绝 */}
				<rect {...col} y="238" height="56" fill="none" stroke="var(--divider)" strokeDasharray="5 4" />
				<text x="160" y="263" textAnchor="middle" fontSize="15" fontWeight="600" fill="var(--t-secondary)">
					Origin server
				</text>
				<text x="160" y="280" textAnchor="middle" fontSize="12" fill="var(--t-tertiary)">
					answers: refused, not silent
				</text>

				{/* 5 · 结果 */}
				<path
					d="M160 300 L160 326"
					stroke="var(--oc-orange)"
					strokeWidth="1.6"
					fill="none"
					markerEnd="url(#e521-arrow)"
				/>
				<rect
					{...col}
					y="332"
					height="56"
					fill="none"
					stroke="var(--oc-orange)"
					strokeOpacity="0.7"
					strokeDasharray="5 4"
				/>
				<text x="160" y="357" textAnchor="middle" fontSize="15" fontWeight="600" fill="var(--t-primary)">
					Error 521
				</text>
				<text x="160" y="374" textAnchor="middle" fontSize="12" fill="var(--t-secondary)">
					web server is down
				</text>
			</svg>
			<figcaption className="mt-3 text-center text-[13px] leading-relaxed t-tertiary">
				A 521 arrives almost instantly, because the origin answered. Silence on the same hop produces 522 instead,
				after Cloudflare has spent 19 seconds retrying.
			</figcaption>
		</figure>
	);
}
