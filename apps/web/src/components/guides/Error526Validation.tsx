/**
 * Error 526 的位置图：TLS 握手一路走到源站把证书递出来——所以它不是 525——
 * 卡在下一步：Cloudflare 拿证书去比对信任库。Full 模式跳过这一步，
 * Full (strict) 才会验，验不过就是 526。两个条件必须同时成立，图上都画出来。
 * 纯 SVG、无 JS；配色全走主题 token，亮/暗两套都成立；竖版布局，窄屏不溢出。
 */
export default function Error526Validation() {
	const col = { x: 20, width: 244, rx: 14 };

	return (
		<figure className="my-8">
			<svg
				viewBox="0 0 400 482"
				role="img"
				aria-label="Where Cloudflare error 526 happens: a visitor reaches the Cloudflare edge normally, the edge opens a TLS connection to the origin on port 443, and the origin does present a certificate — so the handshake itself succeeded and this is not error 525. Cloudflare then checks that certificate against its trust store. In Full mode that check is skipped; in Full (strict) mode it is enforced, and a certificate that is expired, self-signed, name-mismatched or missing its intermediates fails, so Cloudflare returns error 526, invalid SSL certificate."
				className="mx-auto block h-auto w-full max-w-[440px]"
			>
				<title>Where a Cloudflare 526 error happens on the path to your origin</title>

				<defs>
					<marker id="e526-arrow" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="6" markerHeight="6" orient="auto">
						<path d="M0 0 L8 4 L0 8 z" fill="var(--oc-orange)" />
					</marker>
					<marker
						id="e526-arrow-back"
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

				{/* 1 · 访客 → 边缘：这一段是通的 */}
				<rect {...col} y="12" height="52" fill="var(--glass-bg)" stroke="var(--divider)" />
				<text x="142" y="36" textAnchor="middle" fontSize="15" fontWeight="600" fill="var(--t-primary)">
					Visitor
				</text>
				<text x="142" y="53" textAnchor="middle" fontSize="12" fill="var(--t-secondary)">
					reaches Cloudflare normally
				</text>

				<path
					d="M142 68 L142 96"
					stroke="var(--oc-orange)"
					strokeWidth="1.6"
					fill="none"
					markerEnd="url(#e526-arrow)"
				/>

				{/* 2 · Cloudflare 边缘：向源站开 TLS */}
				<rect {...col} y="102" height="56" fill="var(--glass-bg)" stroke="var(--oc-orange)" strokeOpacity="0.55" />
				<text x="142" y="127" textAnchor="middle" fontSize="15" fontWeight="600" fill="var(--t-primary)">
					Cloudflare edge
				</text>
				<text x="142" y="144" textAnchor="middle" fontSize="12" fill="var(--t-secondary)">
					opens TLS to the origin on 443
				</text>

				{/* 3 · 去程 ClientHello + 回程证书：握手本身是成的 */}
				<path
					d="M118 162 L118 218"
					stroke="var(--oc-orange)"
					strokeWidth="1.6"
					fill="none"
					markerEnd="url(#e526-arrow)"
				/>
				<path
					d="M166 218 L166 162"
					stroke="var(--t-secondary)"
					strokeWidth="1.6"
					fill="none"
					markerEnd="url(#e526-arrow-back)"
				/>

				{/* 4 · 源站：确实递出了证书 */}
				<rect {...col} y="224" height="56" fill="none" stroke="var(--divider)" strokeDasharray="5 4" />
				<text x="142" y="249" textAnchor="middle" fontSize="15" fontWeight="600" fill="var(--t-secondary)">
					Origin server
				</text>
				<text x="142" y="266" textAnchor="middle" fontSize="12" fill="var(--t-tertiary)">
					presents a certificate
				</text>
				<text x="274" y="245" fontSize="11" fill="var(--t-tertiary)">
					it answered, so
				</text>
				<text x="274" y="260" fontSize="11" fill="var(--t-tertiary)">
					this is not a
				</text>
				<text x="274" y="275" fontSize="11" fill="var(--t-tertiary)">
					521, 522 or 525
				</text>

				<path
					d="M142 286 L142 312"
					stroke="var(--oc-orange)"
					strokeWidth="1.6"
					fill="none"
					markerEnd="url(#e526-arrow)"
				/>

				{/* 5 · 验证这一步：模式决定验不验 */}
				<rect {...col} y="318" height="56" fill="var(--glass-bg)" stroke="var(--oc-orange)" strokeOpacity="0.55" />
				<text x="142" y="343" textAnchor="middle" fontSize="15" fontWeight="600" fill="var(--t-primary)">
					Cloudflare checks it
				</text>
				<text x="142" y="360" textAnchor="middle" fontSize="12" fill="var(--t-secondary)">
					against its trust store
				</text>
				<text x="274" y="339" fontSize="11" fill="var(--t-tertiary)">
					Full: skipped
				</text>
				<text x="274" y="354" fontSize="11" fill="var(--t-tertiary)">
					Full (strict):
				</text>
				<text x="274" y="369" fontSize="11" fill="var(--t-tertiary)">
					enforced
				</text>

				<path
					d="M142 380 L142 406"
					stroke="var(--oc-orange)"
					strokeWidth="1.6"
					fill="none"
					markerEnd="url(#e526-arrow)"
				/>

				{/* 6 · 结果 */}
				<rect
					{...col}
					y="412"
					height="56"
					fill="none"
					stroke="var(--oc-orange)"
					strokeOpacity="0.7"
					strokeDasharray="5 4"
				/>
				<text x="142" y="437" textAnchor="middle" fontSize="15" fontWeight="600" fill="var(--t-primary)">
					Error 526
				</text>
				<text x="142" y="454" textAnchor="middle" fontSize="12" fill="var(--t-secondary)">
					invalid SSL certificate
				</text>
			</svg>
			<figcaption className="mt-3 text-center text-[13px] leading-relaxed t-tertiary">
				The handshake reached the point where your origin handed over a certificate. Everything that goes wrong
				after that point is a validation decision, and only Full (strict) makes it.
			</figcaption>
		</figure>
	);
}
