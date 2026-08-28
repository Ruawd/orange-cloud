import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { setRequestLocale } from "next-intl/server";
import GuideShell, { type RelatedLink } from "@/components/guides/GuideShell";
import DomainOwnershipStack from "@/components/guides/DomainOwnershipStack";
import { guideBySlug, guidePath, GUIDE_LOCALE_ZH } from "@/lib/guides/guides";

const SITE_URL = "https://o-c.do";
const guide = guideBySlug("goumai-yuming-jieru-cloudflare", GUIDE_LOCALE_ZH);
const PATH = guidePath(GUIDE_LOCALE_ZH, `/guides/${guide.slug}`);

const CF_REGISTRAR = "https://developers.cloudflare.com/registrar/";
const CF_REGISTER = "https://developers.cloudflare.com/registrar/get-started/register-domain/";
const CF_TRANSFER = "https://developers.cloudflare.com/registrar/get-started/transfer-domain-to-cloudflare/";
const CF_TLDS = "https://www.cloudflare.com/tld-policies/";
const CF_FAQ = "https://developers.cloudflare.com/registrar/faq/";
const CF_STATUS = "https://developers.cloudflare.com/dns/zone-setups/reference/domain-status/";
const CF_NS = "https://developers.cloudflare.com/dns/nameservers/update-nameservers/";
const CF_RECORDS = "https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/";
const TX_QUICKSTART = "https://cloud.tencent.com/document/product/242/39039";
const TX_REALNAME = "https://cloud.tencent.com/document/product/242/6707";
const TX_STATUS = "https://cloud.tencent.com/document/product/242/7924";
const TX_SITEFLOW = "https://cloud.tencent.com/document/product/242/8584";
const TX_NS = "https://cloud.tencent.com/document/product/302/5518";

/** FAQ 一处定义：可见文本与 FAQPage JSON-LD 同源，保证逐字一致 */
const FAQ: Array<{ q: string; a: string }> = [
	{
		q: "在 Cloudflare 里添加了域名，就算我拥有它了吗？",
		a: "不算。添加域名只是在你的账号下建了一份配置，域名的归属由注册商那边的注册记录决定，跟你在谁的面板里填过它没有关系。判断方法很直接：别人的域名你也能添加进去，但它会永远停在「待更新 NS」状态——因为激活要求注册商那边把 NS 指向 Cloudflare 分配的那一组，而只有真正的持有者才动得了那个设置。免费方案的域名在这个状态下超过 28 天会被自动删除。",
	},
	{
		q: "买域名和买服务器是一回事吗？",
		a: "是两件事，两笔钱。域名是一个名字的使用权，按年付费，从注册商那里买；服务器是存放网站文件的地方，按月付费，从主机商那里买。中间还有一层 DNS，负责把名字指到服务器的 IP 上，Cloudflare 做的就是这一层。只买域名，打开是空的；只买服务器，别人只能用 IP 访问。",
	},
	{
		q: "在腾讯云买的域名能用 Cloudflare 吗？",
		a: "可以。域名在哪买和用谁家的 DNS 是两件独立的事。在腾讯云的域名注册控制台把 DNS 服务器改成 Cloudflare 分配给你的那两个，等 Cloudflare 检测到就会激活，之后解析记录都在 Cloudflare 这边管。要注意的是，域名实名认证没过之前会被注册局暂停解析，这时候改了 NS 也一样打不开。",
	},
	{
		q: "域名注册后为什么打不开，还提示 serverHold？",
		a: "这是注册局设置的暂停解析状态，最常见的原因就是没做域名实名认证。按腾讯云的说明，域名注册后 5 天内仍未完成实名会进入这个状态，实名审核通过后自动解除，恢复正常解析大约需要 48 小时。注意域名实名认证和你的腾讯云账号实名认证是两回事，账号实名了不代表域名实名了。",
	},
	{
		q: "我的网站需要备案吗？",
		a: "看服务器在哪里，不看域名在哪买。网站放在中国大陆境内的服务器上，按工信部规定必须先取得 ICP 备案号才能开通访问，备案通过你的接入商（比如腾讯云）办理；服务器在境外则不走这个流程，境内接入商也没法给你备案。备案与用不用 Cloudflare 无关，它约束的是境内的服务器接入。",
	},
];

const RELATED: RelatedLink[] = [
	{
		href: "/guides/cloudflare-dns-jiexi-bu-shengxiao",
		label: "改了 DNS 解析，为什么一直不生效？",
		note: "改完 NS 卡在待更新、或者记录改了没反应，下一步的排查顺序都在这篇里。",
	},
	{
		href: "/guides/cloudflare-xiaohuangyun",
		label: "Cloudflare 的小黄云到底是什么？什么时候该关掉？",
		note: "接入之后每条记录旁边那个云朵图标，决定了流量走不走 Cloudflare。",
	},
	{
		href: "/guides/cloudflare-ssl-jiami-moshi",
		label: "Cloudflare 的 SSL/TLS 加密模式该选哪一个？",
		note: "域名接进来之后要配的第一件事，选错会直接打不开或者重定向循环。",
	},
	{
		href: CF_REGISTER,
		label: "Cloudflare 官方文档：注册新域名",
		note: "本文路线一的原始出处，含联系人信息的字段要求与限制。",
		external: true,
	},
	{
		href: TX_QUICKSTART,
		label: "腾讯云官方文档：快速注册域名及实名认证",
		note: "本文路线二的原始出处，信息模板与实名审核的完整步骤。",
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

export default async function BuyDomainGuideZh({ params }: { params: Promise<{ locale: string }> }) {
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
				lede="这篇写给从没买过域名的人。看完你会知道钱花在哪几处、每一步在等什么，以及为什么「在面板里输入一个域名」离拥有它还差着一整段路。"
				updated={guide.updated}
				readingTime={guide.readingTime}
				related={RELATED}
			>
				<div className="glass r-island note p-6 sm:p-7">
					<p>
						域名要先在注册商那里花钱买下来，才归你。在面板里把一个域名添加进去，只是建了一份配置，不会让它变成你的。
					</p>
				</div>

				<h2 id="misconception">先纠正一个最常见的误会</h2>
				<p>
					有人在管理面板里输入了一个域名，看到它出现在列表里，就以为这个域名已经是自己的了。这个误会很好理解——界面上确实什么都没拦你——但它不成立。
				</p>
				<p>
					域名的归属只由一处记录决定：<strong>注册商那边的注册记录</strong>
					。你付了钱，注册商去注册局登记，这个名字才在接下来的一年（或几年）里归你用。这跟你在谁的面板里填过它、填过几次，一点关系都没有。
				</p>
				<p>
					有个很直接的验证办法：随便一个别人的域名，你也能添加进自己的 Cloudflare 账号，界面照样让你加。但它会永远停在
					<strong>「待更新 NS」</strong>，永远不会激活。因为按{" "}
					<a href={CF_STATUS} target="_blank" rel="noopener noreferrer">
						域名状态
					</a>
					的规则，激活要求注册商那边把域名的 NS 指向 Cloudflare 分配给你的那一组——而只有真正的持有者才动得了注册商后台的那个设置。免费方案的域名在这个状态下超过
					28 天，还会被自动删除。
				</p>
				<p>所以「添加」只是声明「我想用 Cloudflare 管这个域名」，「拥有」得先去买。</p>

				<h2 id="three-layers">域名、解析、服务器：三件事，三笔钱</h2>
				<p>
					新手卡住的第二个点，是把域名和网站当成一件事。腾讯云在{" "}
					<a href={TX_SITEFLOW} target="_blank" rel="noopener noreferrer">
						建站基本流程
					</a>{" "}
					里把它拆成了五步：注册域名、买服务器、备案、搭网站、配解析。这五步里，「买域名」只占第一步。
				</p>
				<DomainOwnershipStack />
				<div className="table-wrap">
					<table>
						<thead>
							<tr>
								<th scope="col">这一层</th>
								<th scope="col">管什么</th>
								<th scope="col">找谁买 · 怎么收费</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<th scope="row">注册商</th>
								<td>域名归谁；也只有在这里能改 NS</td>
								<td>腾讯云、阿里云、Cloudflare Registrar 等，按年</td>
							</tr>
							<tr>
								<th scope="row">DNS 服务商</th>
								<td>域名指向哪个 IP</td>
								<td>Cloudflare 这一层可以免费</td>
							</tr>
							<tr>
								<th scope="row">服务器 / 主机</th>
								<td>网站文件真正存放的地方</td>
								<td>云服务器、虚拟主机、静态托管，按月</td>
							</tr>
						</tbody>
					</table>
				</div>
				<p>
					三层可以来自三家不同的公司，互不影响。域名在腾讯云买、DNS 用 Cloudflare、服务器放在别处，是很常见的组合。
				</p>

				<h2 id="route-cloudflare">路线一：直接在 Cloudflare 买</h2>
				<p>
					<a href={CF_REGISTRAR} target="_blank" rel="noopener noreferrer">
						Cloudflare Registrar
					</a>{" "}
					的特点是<strong>按成本价卖</strong>，只收注册局和 ICANN 的费用，不加价、不搞第一年一元第二年翻十倍那套，WHOIS
					信息默认隐去。对新手最友好的一点是：在这里买的域名自动就用 Cloudflare 的 NS，<strong>不需要改 NS 这一步</strong>。
				</p>
				<p>步骤本身很短：</p>
				<ol>
					<li>注册 Cloudflare 账号，并完成邮箱验证——没验证邮箱是不能注册域名的。</li>
					<li>
						进仪表盘的「注册域名」页搜你想要的名字，出现在结果里就是可注册；没出现就是被人占了，或者是它不支持的类型。
					</li>
					<li>选年限（多数后缀最长十年），默认开启自动续费。</li>
					<li>填联系人信息，付款，确认。整个注册过程约三十秒。</li>
				</ol>
				<p>四个需要先知道的限制：</p>
				<ul>
					<li>
						<strong>不支持 .cn。</strong>官方的{" "}
						<a href={CF_TLDS} target="_blank" rel="noopener noreferrer">
							后缀清单
						</a>{" "}
						里有 .com、.net、.org、.xyz、.dev、.app、.io 等四百多个，但没有 .cn。要 .cn 只能走路线二。
					</li>
					<li>
						<strong>联系人信息只能填 ASCII 字符。</strong>姓名、地址都得用拼音或英文，中文填不进去。
					</li>
					<li>
						<strong>不支持中文域名</strong>（含 <code>xn--</code> 开头的那种）。
					</li>
					<li>
						<strong>买错了不退款。</strong>因为是成本价，钱在注册完成的瞬间就转给注册局了。打错一个字母、或者把 .com 选成
						.co，这笔钱就回不来了——只能关掉自动续费让它到期。
					</li>
				</ul>
				<p>
					另外还有一条 ICANN 的规矩：注册人邮箱必须验证。没验证或验证过期，域名会被挂起并换成停放用的 NS，验证完成后自动恢复。这些细节在{" "}
					<a href={CF_FAQ} target="_blank" rel="noopener noreferrer">
						Registrar 常见问题
					</a>{" "}
					里都有。
				</p>

				<h2 id="route-tencent">路线二：在腾讯云买</h2>
				<p>
					国内注册商的流程会长一些，多出来的部分基本都在<strong>实名认证</strong>上——这是工信部 2017 年起的硬性要求，不是腾讯云自己加的。
				</p>
				<p>
					这里有个新手极容易混的点：<strong>账号实名和域名实名是两回事</strong>
					。你的腾讯云账号要实名，域名也要单独实名，后者是要提交给注册局审核的。账号实名了不等于域名实名了。
				</p>
				<p>
					按{" "}
					<a href={TX_QUICKSTART} target="_blank" rel="noopener noreferrer">
						官方的快速入门
					</a>
					，顺序是这样：
				</p>
				<ol>
					<li>注册腾讯云账号并完成账号实名认证。</li>
					<li>
						<strong>先建「域名信息模板」并等它审核通过</strong>
						。这一步在买域名之前——按规定，新注册和转入都必须绑定一个已通过实名审核的模板。模板审核一般要 1 到 3 个工作日。
					</li>
					<li>模板通过后，去域名注册页搜索并购买，购买时绑定这个模板。</li>
					<li>
						等两道审核：域名的实名审核（关联模板后通常当天，部分要 1 个工作日）和注册局的<strong>命名审核</strong>（通常 1 到 3
						个工作日）。这期间不用做任何操作。
					</li>
				</ol>
				<p>
					所以国内买域名不是「付完钱立刻能用」，第一次买要预留几天。如果实名迟迟没过，会撞上下面这些状态，官方在{" "}
					<a href={TX_STATUS} target="_blank" rel="noopener noreferrer">
						域名状态说明
					</a>{" "}
					里列得很清楚：
				</p>
				<div className="table-wrap">
					<table>
						<thead>
							<tr>
								<th scope="col">状态</th>
								<th scope="col">含义</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<th scope="row">
									<code>pendingVerification</code>
								</th>
								<td>实名审核中，期间会影响解析。注册满 5 天仍未完成实名，就转入下面那个状态</td>
							</tr>
							<tr>
								<th scope="row">
									<code>serverHold</code>
								</th>
								<td>
									注册局暂停解析，域名完全打不开。多数就是没实名，
									<a href={TX_REALNAME} target="_blank" rel="noopener noreferrer">
										审核通过后自动解除
									</a>
									，恢复解析约需 48 小时
								</td>
							</tr>
							<tr>
								<th scope="row">
									<code>INACTIVE</code>
								</th>
								<td>没设置过 NS，自然也解析不了</td>
							</tr>
							<tr>
								<th scope="row">
									<code>serverTransferProhibited</code>
								</th>
								<td>禁止转出。新注册的域名 60 天内会被注册局设上这个状态，到期自动解除</td>
							</tr>
						</tbody>
					</table>
				</div>
				<p>
					买完之后要把 DNS 交给 Cloudflare，就在域名注册控制台里改 DNS 服务器，填 Cloudflare 分配给你的那两个地址（改 NS
					的入口和说明见{" "}
					<a href={TX_NS} target="_blank" rel="noopener noreferrer">
						腾讯云文档
					</a>
					）。注意先后顺序：<strong>实名没过之前处于暂停解析，改了 NS 也照样打不开</strong>，先把实名走完再折腾解析。
				</p>

				<h2 id="which-route">两条路线怎么选</h2>
				<div className="table-wrap">
					<table>
						<thead>
							<tr>
								<th scope="col">你的情况</th>
								<th scope="col">建议</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<th scope="row">要 .cn 后缀</th>
								<td>只能在腾讯云这类国内注册商买，Cloudflare 不支持</td>
							</tr>
							<tr>
								<th scope="row">网站要放在境内服务器</th>
								<td>国内注册商更省事，备案和服务器在同一家好办</td>
							</tr>
							<tr>
								<th scope="row">买 .com/.net 且服务器在境外</th>
								<td>Cloudflare 更简单：成本价、不用改 NS、隐私默认隐去</td>
							</tr>
							<tr>
								<th scope="row">没有能付境外款的支付方式</th>
								<td>走腾讯云，国内支付方式齐全</td>
							</tr>
							<tr>
								<th scope="row">只是想试试、还没想好</th>
								<td>先按最低年限买一个便宜后缀，两边都不贵，别一上来买十年</td>
							</tr>
						</tbody>
					</table>
				</div>
				<p>
					选错了也不是死局。域名可以在注册商之间转移，只是要满足 ICANN 的规矩：注册满 60
					天、最近 60 天内没转移过、也没改过注册人姓名或邮箱。想转到 Cloudflare 还有个前提——
					<strong>域名得先在 Cloudflare 上激活</strong>，也就是 NS 已经指过来了，具体见{" "}
					<a href={CF_TRANSFER} target="_blank" rel="noopener noreferrer">
						转入文档
					</a>
					。
				</p>

				<h2 id="connect">买完了，接进 Cloudflare 的三步</h2>
				<p>路线一买的域名跳过第一步，它已经在用 Cloudflare 的 NS 了。</p>
				<ol>
					<li>
						<strong>把域名添加到 Cloudflare，改 NS。</strong>添加后 Cloudflare 会给你两个 NS
						地址，去注册商后台把原来的替换掉——只留这两个，别家的一条都不能留。改法与各家注册商的位置见{" "}
						<a href={CF_NS} target="_blank" rel="noopener noreferrer">
							更新 NS 文档
						</a>
						。
					</li>
					<li>
						<strong>等激活。</strong>Cloudflare 会自动反复检查，首次检查在 60 秒后。状态从「待更新 NS」变成「已激活」，这一步才算完。
					</li>
					<li>
						<strong>加解析记录。</strong>在 DNS 页面{" "}
						<a href={CF_RECORDS} target="_blank" rel="noopener noreferrer">
							添加记录
						</a>
						：一条 A 记录，名称填 <code>@</code>，值填服务器 IP；再来一条名称 <code>www</code> 的。到这里域名才真的指向了你的网站。
					</li>
				</ol>
				<p>
					这三步里任何一步卡住，排查顺序都在{" "}
					<Link href="/guides/cloudflare-dns-jiexi-bu-shengxiao">改了 DNS 解析为什么一直不生效</Link> 里。
				</p>

				<h2 id="pitfalls">新手最容易踩的六个坑</h2>
				<ul>
					<li>
						<strong>以为在面板里添加了就等于拥有。</strong>本文开头那件事，也是最贵的一课——真正要花的钱一分没花，时间倒是搭进去不少。
					</li>
					<li>
						<strong>以为买了域名就有了网站。</strong>还差服务器和内容。域名只是门牌号，房子得另买。
					</li>
					<li>
						<strong>忘记续费。</strong>域名是租的不是买断的。过期后先是宽限期，接着停止解析，再往后进赎回期要另交赎回费，最后被删除放回市场。把自动续费开着，并保证付款方式有效。
					</li>
					<li>
						<strong>国内买了不做域名实名。</strong>5 天后进 <code>serverHold</code>，域名直接打不开，而且解除后还要等约 48 小时。
					</li>
					<li>
						<strong>改 NS 时留着旧的没删。</strong>注册商那里只能留 Cloudflare 给的那两个，多留一条别家的，激活就一直不会通过。
					</li>
					<li>
						<strong>贪便宜挑冷门后缀。</strong>首年一两块钱、续费上百的后缀很多，买之前先看清第二年的价格。
					</li>
				</ul>

				<h2 id="faq">常见问题</h2>
				{FAQ.map((item, i) => (
					<div key={item.q}>
						<h3 id={`faq-${i + 1}`}>{item.q}</h3>
						<p>{item.a}</p>
					</div>
				))}
			</GuideShell>
		</>
	);
}
