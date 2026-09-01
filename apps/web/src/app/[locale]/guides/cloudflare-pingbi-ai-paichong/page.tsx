import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import GuideShell, { type RelatedLink } from "@/components/guides/GuideShell";
import AiCrawlerDefense from "@/components/guides/AiCrawlerDefense";
import { guideBySlug, guidePath, GUIDE_LOCALE_ZH } from "@/lib/guides/guides";

const SITE_URL = "https://o-c.do";
const guide = guideBySlug("cloudflare-pingbi-ai-paichong", GUIDE_LOCALE_ZH);
const PATH = guidePath(GUIDE_LOCALE_ZH, `/guides/${guide.slug}`);

const DOCS_ACC = "https://developers.cloudflare.com/ai-crawl-control/";
const DOCS_ACC_START = "https://developers.cloudflare.com/ai-crawl-control/get-started/";
const DOCS_ACC_MANAGE = "https://developers.cloudflare.com/ai-crawl-control/features/manage-ai-crawlers/";
const DOCS_ACC_ROBOTS = "https://developers.cloudflare.com/ai-crawl-control/features/track-robots-txt/";
const DOCS_ACC_WAF = "https://developers.cloudflare.com/ai-crawl-control/configuration/ai-crawl-control-with-waf/";
const DOCS_BLOCK_AI = "https://developers.cloudflare.com/bots/additional-configurations/block-ai-bots/";
const DOCS_ROBOTS = "https://developers.cloudflare.com/bots/additional-configurations/managed-robots-txt/";
const DOCS_LABYRINTH = "https://developers.cloudflare.com/bots/additional-configurations/ai-labyrinth/";
const DOCS_BOT_CONCEPT = "https://developers.cloudflare.com/bots/concepts/bot/";
const DOCS_VERIFIED = "https://developers.cloudflare.com/bots/concepts/bot/verified-bots/";
const DOCS_BOTS_FREE = "https://developers.cloudflare.com/bots/plans/free/";
const DOCS_WAF_CUSTOM = "https://developers.cloudflare.com/waf/custom-rules/";
const CONTENT_SIGNALS = "https://contentsignals.org/";

/** FAQ 一处定义：可见文本与 FAQPage JSON-LD 同源，保证逐字一致 */
const FAQ: Array<{ q: string; a: string }> = [
	{
		q: "Cloudflare 免费版能屏蔽 AI 爬虫吗？",
		a: "能。按官方的方案对照表，免费方案就带 AI bot 策略、AI 迷宫和托管 robots.txt 三项，AI Crawl Control 也标注为「所有方案可用」。短板不在功能有没有，而在识别精度和数据保留：爬虫识别只按 User-Agent 字符串走，认得出的是那些自报家门的知名爬虫，指标页也只能看最近 24 小时。",
	},
	{
		q: "写了 robots.txt 为什么还是拦不住 AI 爬虫？",
		a: "因为 robots.txt 从设计上就不是拦截手段。Cloudflare 文档说得很直白：遵守 robots.txt 是自愿的，这个文件表达的是你的意愿，并不能在技术层面阻止爬虫访问内容，部分运营方会无视 Disallow 直接抓。要强制执行，得用 AI Crawl Control 或 AI bot 策略，它们在边缘就把请求挡掉。",
	},
	{
		q: "屏蔽 AI 爬虫会影响百度和 Google 收录吗？",
		a: "正常配置下不会。Cloudflare 把 AI 相关行为拆成搜索、代理、训练三类，你可以只拦训练那一类；托管 robots.txt 的名单里也只有 GPTBot、ClaudeBot、Bytespider、Google-Extended 这类 AI 专用标识，没有 Baiduspider 和 Googlebot。要留意的是混合用途爬虫——既做搜索又做训练的那些，会被所有屏蔽 AI 训练的配置一起拦掉。",
	},
	{
		q: "AI Crawl Control 和「屏蔽 AI 机器人」开关有什么区别？",
		a: "一个按爬虫点名，一个按行为分类。AI Crawl Control 给你一张实际来访过的爬虫清单，逐个选放行还是拦截；安全设置里的 AI bot 策略按搜索、代理、训练三类批量下判断。两者可以同时用。注意在 AI Crawl Control 里选拦截会占掉一条 WAF 自定义规则，免费方案总共只有 5 条。",
	},
	{
		q: "2026 年 9 月 15 日 Cloudflare 的默认设置要怎么变？",
		a: "按官方文档，从 2026 年 9 月 15 日起，Cloudflare 会给新接入的域名启用新默认值：归类为训练或代理的机器人在展示广告的页面上被拦截，搜索类保持放行。同时，兼做搜索与训练的混合用途爬虫会被所有屏蔽 AI 训练的配置拦掉，包括即将弃用的旧版「屏蔽 AI 机器人」开关。9 月 15 日前可以在安全设置里选择不采用。",
	},
];

const RELATED: RelatedLink[] = [
	{
		href: "/guides/cloudflare-xiaohuangyun",
		label: "Cloudflare 的小黄云到底是什么？什么时候该关掉？",
		note: "这一整套拦截的前提：记录上的小黄云得开着，流量不过 Cloudflare，就没有边缘可以拦。",
	},
	{
		href: "/guides/cloudflare-huancun-mingzhonglv",
		label: "Cloudflare 到底缓存了什么？为什么命中率一直上不去",
		note: "爬虫压垮源站的另一半答案：请求有没有落到缓存上，决定了它们要不要惊动你的服务器。",
	},
	{
		href: "/guides/cloudflare-yuanzhan-ip-xielou",
		label: "套了 Cloudflare，源站真实 IP 还会泄露吗？",
		note: "边缘拦得再干净，爬虫要是直接打源站 IP，这些规则一条都不会生效。",
	},
	{
		href: "/guides",
		label: "全部中文指南",
		note: "Cloudflare 的其它设置项：代理状态、回源、缓存与证书。",
	},
	{
		href: DOCS_ACC,
		label: "Cloudflare 官方文档：AI Crawl Control",
		note: "本文爬虫清单、拦截动作与指标那几节的原始出处。",
		external: true,
	},
	{
		href: DOCS_BLOCK_AI,
		label: "Cloudflare 官方文档：屏蔽 AI 机器人",
		note: "三类行为预设与 2026 年 9 月 15 日新默认值的官方说明。",
		external: true,
	},
	{
		href: "/contact",
		label: "这篇有错？告诉我们",
		note: "勘误和提问都欢迎，每一封都会看。",
	},
];

export const metadata: Metadata = {
	metadataBase: new URL(SITE_URL),
	title: guide.title,
	description: guide.description,
	alternates: {
		canonical: PATH,
		languages: { "zh-Hans": PATH },
	},
	openGraph: {
		title: guide.title,
		description: guide.description,
		url: PATH,
		siteName: "Orange Cloud",
		type: "article",
		locale: "zh_CN",
		images: [{ url: "/og/zh-Hans.jpg", width: 1280, height: 640, alt: guide.h1 }],
	},
	twitter: {
		card: "summary_large_image",
		title: guide.title,
		description: guide.description,
		images: ["/og/zh-Hans.jpg"],
	},
};

export default async function BlockAiCrawlersGuideZh({ params }: { params: Promise<{ locale: string }> }) {
	const { locale } = await params;
	if (locale !== GUIDE_LOCALE_ZH) notFound();
	setRequestLocale(locale);

	const jsonLd = [
		{
			"@context": "https://schema.org",
			"@type": "TechArticle",
			headline: guide.h1,
			description: guide.description,
			url: `${SITE_URL}${PATH}`,
			inLanguage: "zh-Hans",
			datePublished: guide.updated,
			dateModified: guide.updated,
			image: `${SITE_URL}/og/zh-Hans.jpg`,
			author: { "@type": "Organization", name: "Orange Cloud", url: SITE_URL },
			publisher: { "@type": "Organization", name: "Orange Cloud", url: SITE_URL },
			mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}${PATH}` },
		},
		{
			"@context": "https://schema.org",
			"@type": "FAQPage",
			mainEntity: FAQ.map((item) => ({
				"@type": "Question",
				name: item.q,
				acceptedAnswer: { "@type": "Answer", text: item.a },
			})),
		},
		{
			"@context": "https://schema.org",
			"@type": "BreadcrumbList",
			itemListElement: [
				{ "@type": "ListItem", position: 1, name: "指南", item: `${SITE_URL}${guidePath(GUIDE_LOCALE_ZH, "/guides")}` },
				{ "@type": "ListItem", position: 2, name: guide.h1, item: `${SITE_URL}${PATH}` },
			],
		},
	];

	return (
		<>
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
			<GuideShell
				locale={GUIDE_LOCALE_ZH}
				title={guide.h1}
				lede="内容被 AI 白嫖是一回事，被高频抓取拖垮源站是另一回事。两件事的解法不一样，而免费方案里那几个开关，多数人只知道其中一个。"
				updated={guide.updated}
				readingTime={guide.readingTime}
				related={RELATED}
			>
				<div className="glass r-island note p-6 sm:p-7">
					<p>
						<code>robots.txt</code> 只是表态，遵不遵守全看爬虫自己。真正能拦住的是 AI Crawl Control 与安全设置里的 AI bot
						策略——免费方案就能用，落地是在边缘执行的一条 WAF 自定义规则。
					</p>
				</div>

				<p>
			这两年站长的抱怨从「百度不收录」变成了「AI 把我的文章原样喂进去了」。查日志会发现事情分成独立的两半：一半是内容被拿去训练，你在意版权和署名；另一半是抓取频率高到把小机器打满，你在意账单和可用性。
				</p>
				<p>
					Cloudflare 的工具也分成这两类，并且分得比多数中文教程讲的细。下面把边界一次讲清，顺便说一件时间上很紧的事：2026 年 9 月 15
					日，新接入域名的默认值就要变了。
				</p>

				<h2 id="robots">robots.txt 是请求，不是门</h2>
				<p>
					绝大多数「怎么屏蔽 AI 爬虫」的中文答案，最后落到的都是往 <code>robots.txt</code> 里加上{" "}
					<code>User-agent: GPTBot</code> 和 <code>Disallow: /</code>。这一步值得做，但要清楚它的性质。
				</p>
				<p>
					Cloudflare 的文档写得没有余地：遵守 <code>robots.txt</code>{" "}
					是自愿的，这个文件表达的是你的偏好，并不在技术层面阻止任何人访问你的内容，部分爬虫运营方会径直无视 <code>Disallow</code>{" "}
					继续抓。换句话说，它是一份声明，不是一道门。
				</p>
				<p>
					Cloudflare 提供了一个托管 <code>robots.txt</code> 的开关（安全设置里，免费方案可用）。打开后它替你生成并维护这个文件，内含一份针对常见
					AI 训练爬虫的屏蔽指令，以及{" "}
					<a href={CONTENT_SIGNALS} target="_blank" rel="noopener noreferrer">
						内容信号（Content Signals）
					</a>{" "}
					政策文本。官方文档里给出的托管名单包含这些标识：
				</p>
				<ul>
					<li>
						<code>GPTBot</code>、<code>ClaudeBot</code>、<code>CCBot</code>、<code>meta-externalagent</code>
					</li>
					<li>
						<code>Bytespider</code>（字节跳动）、<code>Amazonbot</code>
					</li>
					<li>
						<code>Google-Extended</code>、<code>Applebot-Extended</code>
					</li>
				</ul>
				<p>
					这份名单里没有 <code>Baiduspider</code>，也没有 <code>Googlebot</code>——这就是很多人担心的「屏蔽 AI
					会不会连搜索收录一起断掉」的答案：托管名单针对的是各家为 AI 用途单列的抓取标识，不是搜索索引用的那一个。
				</p>
				<p>
					还有个容易忽略的行为：源站本来就有 <code>robots.txt</code>（能返回 200）时，Cloudflare 不覆盖它，而是把托管内容拼在原有内容前面合成一份返回。细节见{" "}
					<a href={DOCS_ROBOTS} target="_blank" rel="noopener noreferrer">
						托管 robots.txt 文档
					</a>
					。
				</p>

				<h2 id="three-layers">三层手段，只有两层真的会拦人</h2>
				<p>把这些手段按「能不能强制执行」排一排，结构就清楚了。</p>
				<AiCrawlerDefense />
				<p>
					第三层的{" "}
					<a href={DOCS_LABYRINTH} target="_blank" rel="noopener noreferrer">
						AI 迷宫（AI Labyrinth）
					</a>{" "}
					值得单独说一句：它在页面里插入带 <code>Nofollow</code>{" "}
					标记的隐藏链接，不守规矩的爬虫会掉进一串走不完的链接里，记录下来的特征还会被所有选择屏蔽 AI 机器人的 Cloudflare
					客户共用。官方说明这些链接对搜索引擎优化和页面外观没有影响，只有机器人看得见。开关同样在安全设置里，按{" "}
					<a href={DOCS_BOTS_FREE} target="_blank" rel="noopener noreferrer">
						免费方案的机器人能力表
					</a>
					，免费也能开。
				</p>

				<h2 id="two-switches">两个入口，管的不是同一件事</h2>
				<p>真正会拦人的那一层有两个入口，名字都带 AI，很容易混。区别是一个按爬虫点名，一个按行为分类。</p>
				<div className="table-wrap">
					<table>
						<thead>
							<tr>
								<th scope="col">对比项</th>
								<th scope="col">AI Crawl Control</th>
								<th scope="col">AI bot 策略</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<th scope="row">在哪</th>
								<td>仪表盘 AI Crawl Control</td>
								<td>安全设置 → 配置 AI bot 策略</td>
							</tr>
							<tr>
								<th scope="row">粒度</th>
								<td>逐个爬虫点名放行或拦截</td>
								<td>按搜索、代理、训练三类批量处置</td>
							</tr>
							<tr>
								<th scope="row">依据</th>
								<td>实际来访过的爬虫清单，带请求量与违规次数</td>
								<td>Cloudflare 的行为分类，不看你的实际流量</td>
							</tr>
							<tr>
								<th scope="row">动作</th>
								<td>放行 / 拦截（按次计费为封闭测试）</td>
								<td>全站拦截 / 仅在含广告的页面拦截 / 放行</td>
							</tr>
							<tr>
								<th scope="row">代价</th>
								<td>拦截会占用一条 WAF 自定义规则</td>
								<td>不占用自定义规则配额</td>
							</tr>
						</tbody>
					</table>
				</div>
				<p>
					按{" "}
					<a href={DOCS_BOT_CONCEPT} target="_blank" rel="noopener noreferrer">
						官方对 AI 机器人的分类
					</a>
					，三类行为是：<strong>搜索</strong>（收集或索引内容以便日后回答问题）、<strong>代理</strong>（实时替真人办事，如聊天抓取和浏览器代理）、
					<strong>训练</strong>（拿内容训练或微调模型）。一个爬虫可以同时具备多种行为——这是后面那个坑的根源。
				</p>
				<p>
					AI Crawl Control 的用法很直白：进 <strong>Crawlers</strong> 标签页，表里是实际来过的爬虫、所属运营方、请求量趋势，以及各自违反{" "}
					<code>robots.txt</code> 的次数，在 <strong>Action</strong> 列选放行或拦截即可。{" "}
					<a href={DOCS_ACC_ROBOTS} target="_blank" rel="noopener noreferrer">
						Directives 标签页
					</a>{" "}
					还会列出是哪个爬虫、抓了哪个路径、撞上了你 <code>robots.txt</code> 里的哪一行——它把「谁不守规矩」从猜测变成了名单。
				</p>

				<h3 id="waf-rule">拦截落地成一条 WAF 规则，这有副作用</h3>
				<p>
					在 AI Crawl Control 里点了拦截之后，Cloudflare 会在你的域名下创建或更新<strong>一条</strong> WAF
					自定义规则来执行它；选择全部放行则不占用任何自定义规则。这带来两个必须知道的后果。
				</p>
				<p>
					一是配额。<a href={DOCS_WAF_CUSTOM} target="_blank" rel="noopener noreferrer">WAF 自定义规则</a>{" "}
					在免费方案上限是 5 条，Pro 是 20 条。手上规则本来就紧的人，要把这一条算进预算里。
				</p>
				<p>
					二是执行顺序。这条规则和你其它自定义规则处在同一阶段，排在前面的先生效。于是会出现：你明明把某个爬虫设成了放行，它还是被拦——上游另一条规则先挡掉了它，而这类拦截未必出现在 AI Crawl Control
					的统计里。官方建议是，打算统一管理时就把已有规则里涉及 AI 爬虫的部分改掉，详见{" "}
					<a href={DOCS_ACC_WAF} target="_blank" rel="noopener noreferrer">
						AI Crawl Control 与 WAF 的配合说明
					</a>
					。
				</p>

				<h2 id="september">9 月 15 日，新域名的默认值要变</h2>
				<p>
					按{" "}
					<a href={DOCS_BLOCK_AI} target="_blank" rel="noopener noreferrer">
						官方文档
					</a>
					，2026 年 9 月 15 日起，Cloudflare 会给<strong>新接入的域名</strong>启用一套新默认值：归类为训练或代理的机器人，会在展示广告的页面上被拦截；搜索类保持放行。同时，旧版的「屏蔽 AI 机器人」开关将在同一天弃用。
				</p>
				<p>
					真正值得留意的是随之而来的另一句：<strong>兼做搜索与训练的混合用途爬虫，会被所有屏蔽 AI 训练的配置一起拦掉</strong>
					，包括那个旧开关。而旧开关原本是把混合用途排除在外的——同一个开关，含义在这一天变了。
				</p>
				<p>9 月 15 日之前，所有用户都可以在安全设置里选择不采用这套新默认值。要不要退出，取决于你站点的内容策略：</p>
				<ul>
					<li>内容以引流为主、希望尽可能被各种入口收录——考虑退出，或至少只拦纯训练类。</li>
					<li>内容本身就是资产、被原样搬走等于损失——不必退出，新默认值的方向和你一致。</li>
					<li>站上没有广告——「仅在含广告的页面拦截」这一档对你等于没开，要拦就得明确选全站拦截。</li>
				</ul>

				<h2 id="free-plan">免费方案能做到哪一步</h2>
				<p>功能层面免费方案基本都给了，短板在识别精度和数据保留上，官方文档标得很清楚，照抄一遍免得误判。</p>
				<div className="table-wrap">
					<table>
						<thead>
							<tr>
								<th scope="col">能力</th>
								<th scope="col">免费方案</th>
								<th scope="col">升级之后</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<th scope="row">爬虫识别方式</th>
								<td>只按 User-Agent 字符串，认得出自报家门的知名爬虫</td>
								<td>可用 Bot Management 的检测 ID 做更彻底的识别</td>
							</tr>
							<tr>
								<th scope="row">指标保留</th>
								<td>Metrics 标签页只显示最近 24 小时</td>
								<td>更长的历史区间</td>
							</tr>
							<tr>
								<th scope="row">拦截响应自定义</th>
								<td>不支持</td>
								<td>付费方案可配置拦截时返回的响应</td>
							</tr>
							<tr>
								<th scope="row">WAF 自定义规则</th>
								<td>5 条（AI Crawl Control 的拦截占 1 条）</td>
								<td>Pro 20 条，Business 100 条</td>
							</tr>
							<tr>
								<th scope="row">AI 迷宫 / 托管 robots.txt</th>
								<td>都可用</td>
								<td>相同</td>
							</tr>
						</tbody>
					</table>
				</div>
				<p>
					「只按 User-Agent 识别」这句要吃透：爬虫若不自报家门，或者干脆伪装成普通浏览器，免费方案的这张表里根本不会出现它，你也就无从拦起。想知道某个爬虫 Cloudflare
					认不认、归成哪一类，对照{" "}
					<a href={DOCS_VERIFIED} target="_blank" rel="noopener noreferrer">
						已验证机器人文档
					</a>
					里的分类口径。
				</p>

				<h2 id="china">国内站长要多想的三件事</h2>
				<h3 id="china-bytespider">字节跳动的爬虫在默认名单里</h3>
				<p>
					<code>Bytespider</code> 出现在 Cloudflare 托管 <code>robots.txt</code>{" "}
					的屏蔽名单里，打开那个开关等于同时向字节表明了态度。这条在中文语境下常被漏掉——大家盯着 GPTBot 和 ClaudeBot，忘了抓得最勤的可能是隔壁那家。
				</p>
				<h3 id="china-domestic">名单之外的国内抓取程序，大概率识别不到</h3>
				<p>
					国内 AI 厂商的抓取程序不一定进了 Cloudflare 的已验证机器人目录，也不一定用固定且可识别的 User-Agent。落到免费方案上，它们就不会出现在爬虫表里，拦截清单自然也点不到。能做的只剩通用手段：看访问日志找出高频来源，用{" "}
					<a href={DOCS_WAF_CUSTOM} target="_blank" rel="noopener noreferrer">
						WAF 自定义规则
					</a>{" "}
					按 User-Agent、ASN 或路径自己写规则拦。别指望那个下拉列表能替你解决所有问题。
				</p>
				<h3 id="china-proxy">这一切的前提是小黄云开着</h3>
				<p>
					官方在前置条件里写明：域名必须处于代理状态，流量真的经过 Cloudflare，这套东西才有意义。灰云记录的请求直接落到源站，边缘上再多规则也碰不到。国内站点常把一部分子域名走境内直连、一部分走
					Cloudflare，这种混合结构下，AI 爬虫完全可以从没代理的那一侧进来。
				</p>
				<p>
					还有个反直觉的好消息：免费方案不使用中国大陆境内节点，大陆访客要绕境外——但爬虫本来就多从境外发起，这条限制对拦爬虫几乎没有影响。看爬虫这件事上，境内没有节点不是短板。
				</p>

				<h2 id="checklist">动手顺序</h2>
				<p>只想要一条最短路径的话，按这个顺序走：</p>
				<ol>
					<li>确认要保护的域名和子域名都开着小黄云，流量确实经过 Cloudflare。</li>
					<li>
						进 AI Crawl Control 的 Crawlers 标签页，先<strong>只看不动</strong>，弄清楚到底是谁在抓、抓得多勤。免费方案只有 24 小时数据，隔几天多看几次。
					</li>
					<li>
						去 Directives 看违规表，把无视你 <code>robots.txt</code> 的那几个记下来——这批最该拦。
					</li>
					<li>
						打开托管 <code>robots.txt</code> 把话说明白，再在安全设置里按三类行为定下大方向。
					</li>
					<li>回到 Crawlers 表，对第 3 步记下的那几个点拦截，留意这会占掉一条 WAF 自定义规则。</li>
					<li>
						想再进一步，打开 AI 迷宫。最后回头检查已有的 WAF 自定义规则有没有和这套配置打架。完整步骤见{" "}
						<a href={DOCS_ACC_START} target="_blank" rel="noopener noreferrer">
							AI Crawl Control 快速上手
						</a>{" "}
						与{" "}
						<a href={DOCS_ACC_MANAGE} target="_blank" rel="noopener noreferrer">
							管理 AI 爬虫
						</a>
						。
					</li>
				</ol>
				<p>这几个开关和那张爬虫表都在 Cloudflare 仪表盘里；WAF 自定义规则的启停也能在 Orange Cloud 里随手切换，出门在外接到告警时方便些。</p>

				<h2 id="faq">常见问题</h2>
				{FAQ.map((item) => (
					<div key={item.q}>
						<h3 id={`faq-${FAQ.indexOf(item)}`}>{item.q}</h3>
						<p>{item.a}</p>
					</div>
				))}
			</GuideShell>
		</>
	);
}
