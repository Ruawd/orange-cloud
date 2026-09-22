/**
 * 指南正文 → App 用的结构化块（feed）。
 *
 * 官网文章正文是手写 JSX、没有 markdown 源，因此这里解析的是**渲染后的 HTML**：
 * 取 `<article class="prose …">` 的内容，按块拆成 App 能原生渲染的结构。
 * 之所以不让 App 直接塞 WebView：原生块才能逐段喂给系统翻译（iOS Translation）。
 *
 * 行内格式收敛成极小的 markdown 子集（`**粗**` / `*斜*` / `` `代码` `` / `[文字](链接)`），
 * 客户端用 AttributedString(markdown:) 渲染，去掉标记即为翻译输入。
 */

export type GuideBlock =
	| { type: "heading"; level: 2 | 3; text: string; anchor?: string }
	| { type: "paragraph"; md: string }
	/** 正文里的玻璃岛提示块（文章开头的答案摘要多为此形态） */
	| { type: "note"; items: string[] }
	| { type: "list"; ordered: boolean; items: string[] }
	| { type: "code"; text: string }
	| { type: "quote"; md: string }
	/** 内联 SVG 示意图：App 端渲染不了矢量图，改用它的无障碍描述（本身就是完整的一句话） */
	| { type: "figure"; alt: string }
	| { type: "table"; headers: string[]; rows: string[][] };

type Node =
	| { kind: "text"; text: string }
	| { kind: "el"; tag: string; attrs: string; children: Node[] };

const VOID_TAGS = new Set(["br", "img", "hr", "input", "meta", "link", "source", "col", "path", "circle", "rect", "line", "polyline", "polygon", "stop", "use", "ellipse"]);

const TAG_RE = /<!--[\s\S]*?-->|<\/([a-zA-Z][a-zA-Z0-9]*)\s*>|<([a-zA-Z][a-zA-Z0-9]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/g;

/** 极小 HTML 解析：站点自己产出的 HTML，标签集可控，不需要通用解析器 */
function parseNodes(html: string): Node[] {
	const root: Node = { kind: "el", tag: "#root", attrs: "", children: [] };
	const stack: Extract<Node, { kind: "el" }>[] = [root as Extract<Node, { kind: "el" }>];
	let last = 0;
	let match: RegExpExecArray | null;
	TAG_RE.lastIndex = 0;

	const pushText = (text: string) => {
		if (!text) return;
		stack[stack.length - 1].children.push({ kind: "text", text });
	};

	while ((match = TAG_RE.exec(html))) {
		pushText(html.slice(last, match.index));
		last = TAG_RE.lastIndex;

		if (match[0].startsWith("<!--")) continue; // React 的 `<!-- -->` 文本分隔符

		if (match[1]) {
			const tag = match[1].toLowerCase();
			for (let i = stack.length - 1; i > 0; i -= 1) {
				if (stack[i].tag === tag) {
					stack.length = i;
					break;
				}
			}
			continue;
		}

		const tag = match[2].toLowerCase();
		const node: Extract<Node, { kind: "el" }> = { kind: "el", tag, attrs: match[3] ?? "", children: [] };
		stack[stack.length - 1].children.push(node);
		if (!VOID_TAGS.has(tag) && match[4] !== "/") stack.push(node);
	}
	pushText(html.slice(last));

	return (root as Extract<Node, { kind: "el" }>).children;
}

function attr(attrs: string, name: string): string | undefined {
	const re = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i");
	const m = re.exec(attrs);
	if (!m) return undefined;
	return decodeEntities(m[2] ?? m[3] ?? "");
}

function hasClass(attrs: string, name: string): boolean {
	const cls = attr(attrs, "class") ?? "";
	return cls.split(/\s+/).includes(name);
}

const ENTITIES: Record<string, string> = {
	amp: "&",
	lt: "<",
	gt: ">",
	quot: '"',
	apos: "'",
	nbsp: " ",
	hellip: "…",
	mdash: "—",
	ndash: "–",
	rsquo: "’",
	lsquo: "‘",
	ldquo: "“",
	rdquo: "”",
};

function decodeEntities(text: string): string {
	return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (whole, body: string) => {
		if (body.startsWith("#x") || body.startsWith("#X")) {
			return String.fromCodePoint(parseInt(body.slice(2), 16));
		}
		if (body.startsWith("#")) return String.fromCodePoint(parseInt(body.slice(1), 10));
		return ENTITIES[body.toLowerCase()] ?? whole;
	});
}

/** 行内文本里的 markdown 记号要转义，否则客户端解析出意外的强调/链接 */
function escapeInline(text: string): string {
	return text.replace(/([\\`*_[\]])/g, "\\$1");
}

function collapse(text: string): string {
	return text.replace(/\s+/g, " ");
}

function absolute(href: string, siteURL: string): string {
	if (/^https?:\/\//i.test(href)) return href;
	if (href.startsWith("/")) return `${siteURL}${href}`;
	return href;
}

const WORD_CHAR = /[\p{L}\p{N}]/u;

/**
 * 行内节点 → 极小子集 markdown。
 *
 * `**粗**` / `*斜*` 的定界符两侧不能直接贴着字母数字，否则按 CommonMark 的
 * flanking 规则不成对，客户端会把星号原样显示（站上确有 `</strong>` 后紧跟正文、
 * 中间无空格的写法）。这里在紧贴处补一个空格，让强调始终成对。
 */
function inlineMarkdown(nodes: Node[], siteURL: string): string {
	let out = "";
	let afterEmphasis = false;

	const append = (text: string, emphasis = false) => {
		if (!text) return;
		if (afterEmphasis && WORD_CHAR.test(text[0])) out += " ";
		if (emphasis && out.length > 0 && WORD_CHAR.test(out[out.length - 1])) out += " ";
		out += text;
		afterEmphasis = emphasis;
	};

	for (const node of nodes) {
		if (node.kind === "text") {
			append(escapeInline(decodeEntities(node.text)));
			continue;
		}
		switch (node.tag) {
			case "br":
				append("\n");
				break;
			case "strong":
			case "b":
				append(`**${inlineMarkdown(node.children, siteURL).trim()}**`, true);
				break;
			case "em":
			case "i":
				append(`*${inlineMarkdown(node.children, siteURL).trim()}*`, true);
				break;
			case "code":
				append(`\`${collapse(plainText(node.children)).replace(/`/g, "")}\``);
				break;
			case "a": {
				const href = attr(node.attrs, "href");
				const label = inlineMarkdown(node.children, siteURL).trim();
				append(href ? `[${label}](${absolute(href, siteURL)})` : label);
				break;
			}
			case "svg":
				break;
			default:
				append(inlineMarkdown(node.children, siteURL));
		}
	}
	return out;
}

function plainText(nodes: Node[]): string {
	let out = "";
	for (const node of nodes) {
		if (node.kind === "text") out += decodeEntities(node.text);
		else if (node.tag === "br") out += "\n";
		else if (node.tag !== "svg") out += plainText(node.children);
	}
	return out;
}

function inline(nodes: Node[], siteURL: string): string {
	return collapse(inlineMarkdown(nodes, siteURL)).trim();
}

function text(nodes: Node[]): string {
	return collapse(plainText(nodes)).trim();
}

function elements(nodes: Node[], tag: string): Extract<Node, { kind: "el" }>[] {
	const found: Extract<Node, { kind: "el" }>[] = [];
	for (const node of nodes) {
		if (node.kind !== "el") continue;
		if (node.tag === tag) found.push(node);
		else found.push(...elements(node.children, tag));
	}
	return found;
}

/** `<figure>` 里是内联 SVG：拿 aria-label（写文章时就是一句完整的图注），退而取 <title> / figcaption */
function figureAlt(node: Node): string {
	const svg = elements([node], "svg")[0];
	const label = svg ? attr(svg.attrs, "aria-label") : undefined;
	if (label?.trim()) return collapse(label).trim();
	const title = svg ? elements(svg.children, "title")[0] : undefined;
	if (title) {
		const value = text(title.children);
		if (value) return value;
	}
	const caption = elements([node], "figcaption")[0];
	return caption ? text(caption.children) : "";
}

function tableBlock(node: Extract<Node, { kind: "el" }>, siteURL: string): GuideBlock | null {
	const head = elements(node.children, "thead")[0];
	const headers = head ? elements(head.children, "tr").flatMap((tr) => cellsOf(tr, siteURL)) : [];
	const bodies = elements(node.children, "tbody");
	const bodyRows = (bodies.length ? bodies.flatMap((tbody) => elements(tbody.children, "tr")) : elements(node.children, "tr")).filter(
		(tr) => !head || !elements(head.children, "tr").includes(tr),
	);
	const rows = bodyRows.map((tr) => cellsOf(tr, siteURL)).filter((row) => row.length > 0);
	if (headers.length === 0 && rows.length === 0) return null;
	return { type: "table", headers, rows };
}

function cellsOf(tr: Extract<Node, { kind: "el" }>, siteURL: string): string[] {
	return tr.children
		.filter((child): child is Extract<Node, { kind: "el" }> => child.kind === "el" && (child.tag === "td" || child.tag === "th"))
		.map((cell) => inline(cell.children, siteURL));
}

function blocksFrom(nodes: Node[], siteURL: string): GuideBlock[] {
	const blocks: GuideBlock[] = [];

	for (const node of nodes) {
		if (node.kind !== "el") continue;

		switch (node.tag) {
			case "h2":
			case "h3": {
				const value = text(node.children);
				if (value) {
					blocks.push({
						type: "heading",
						level: node.tag === "h2" ? 2 : 3,
						text: value,
						anchor: attr(node.attrs, "id"),
					});
				}
				break;
			}
			case "p": {
				const md = inline(node.children, siteURL);
				if (md) blocks.push({ type: "paragraph", md });
				break;
			}
			case "ul":
			case "ol": {
				const items = elements(node.children, "li")
					.map((li) => inline(li.children, siteURL))
					.filter(Boolean);
				if (items.length) blocks.push({ type: "list", ordered: node.tag === "ol", items });
				break;
			}
			case "pre": {
				const code = plainText(node.children).replace(/^\n+|\s+$/g, "");
				if (code) blocks.push({ type: "code", text: code });
				break;
			}
			case "blockquote": {
				const md = inline(node.children, siteURL);
				if (md) blocks.push({ type: "quote", md });
				break;
			}
			case "figure": {
				const alt = figureAlt(node);
				if (alt) blocks.push({ type: "figure", alt });
				break;
			}
			case "table": {
				const block = tableBlock(node, siteURL);
				if (block) blocks.push(block);
				break;
			}
			case "div": {
				if (hasClass(node.attrs, "note")) {
					const items = elements(node.children, "p")
						.map((p) => inline(p.children, siteURL))
						.filter(Boolean);
					if (items.length) blocks.push({ type: "note", items });
					break;
				}
				blocks.push(...blocksFrom(node.children, siteURL));
				break;
			}
			case "section":
			case "article":
				blocks.push(...blocksFrom(node.children, siteURL));
				break;
			default:
				break;
		}
	}

	return blocks;
}

/** 从整页 HTML 里切出正文 `<article class="prose …">` 的内容 */
export function extractArticleHTML(pageHTML: string): string | null {
	const open = /<article\b[^>]*class="[^"]*\bprose\b[^"]*"[^>]*>/i.exec(pageHTML);
	if (!open) return null;
	const start = open.index + open[0].length;
	const end = pageHTML.indexOf("</article>", start);
	if (end < 0) return null;
	return pageHTML.slice(start, end);
}

export function parseGuideArticle(pageHTML: string, siteURL = "https://o-c.do"): GuideBlock[] {
	const article = extractArticleHTML(pageHTML);
	if (article === null) return [];
	return blocksFrom(parseNodes(article), siteURL.replace(/\/$/, ""));
}
