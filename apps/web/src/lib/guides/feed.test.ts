import { describe, it, expect } from "vitest";
import { parseGuideArticle, extractArticleHTML, type GuideBlock } from "./feed";

/** 与线上渲染结果同形（含 React 的 `<!-- -->` 分隔符、table-wrap 包裹、内联 SVG 图） */
const PAGE = `<!DOCTYPE html><html><body><header>忽略我</header>
<article class="prose mx-auto w-full max-w-[760px] px-6 pb-20 pt-10"><div class="glass r-island note p-6 sm:p-7"><p><strong>Error 524 means the connection succeeded.</strong> <!-- -->The default limit is 125 seconds.</p></div><p>It only appears on a<!-- --> <a href="/guides/what-is-the-orange-cloud-in-cloudflare">proxied record</a>, and the header is <code>cf-cache-status</code>. See the <a href="https://developers.cloudflare.com/support/" target="_blank" rel="noopener noreferrer">docs</a> — <em>error 524</em> is Cloudflare&#x2019;s own code.</p><h2 id="two-clocks">Connected, then silent</h2><figure class="my-8"><svg viewBox="0 0 360 396" role="img" aria-label="Where error 524 starts in a proxied request." class="mx-auto"><title>The two timeouts</title><rect x="24" y="16"></rect><text x="158" y="42">Connection to origin opens</text></svg></figure><div class="table-wrap"><table><thead><tr><th scope="col">Limit</th><th scope="col">Default</th></tr></thead><tbody><tr><th scope="row">Proxy read timeout</th><td>125 s</td></tr><tr><th scope="row">Proxy write timeout</th><td>30 s</td></tr></tbody></table></div><ol><li><strong>Stop waiting synchronously.</strong> Return a job ID immediately.</li><li>Move the long jobs off the proxy.</li></ol><ul><li>One</li><li><strong>Two.</strong>No space after the bold run.</li></ul><p>Ask the edge directly instead:</p><pre><code>curl -sSI https://example.com/app.css
dig +short example.com A</code></pre><h2 id="faq">FAQ</h2><div><h3>What does error 524 mean?</h3><p>The origin was too slow.</p></div></article>
<footer>也忽略我</footer></body></html>`;

const blocks = parseGuideArticle(PAGE);
const typed = <T extends GuideBlock["type"]>(type: T) =>
	blocks.filter((b): b is Extract<GuideBlock, { type: T }> => b.type === type);

describe("parseGuideArticle", () => {
	it("只取 <article class=prose> 的内容，页眉页脚不进正文", () => {
		expect(JSON.stringify(blocks)).not.toContain("忽略我");
		expect(extractArticleHTML("<html><body><p>没有正文</p></body></html>")).toBeNull();
	});

	it("开头的玻璃岛提示解析成 note", () => {
		expect(blocks[0]).toEqual({
			type: "note",
			items: ["**Error 524 means the connection succeeded.** The default limit is 125 seconds."],
		});
	});

	it("行内链接转成 markdown，站内相对链接补成绝对地址", () => {
		const md = typed("paragraph")[0].md;
		expect(md).toContain("[proxied record](https://o-c.do/guides/what-is-the-orange-cloud-in-cloudflare)");
		expect(md).toContain("[docs](https://developers.cloudflare.com/support/)");
		expect(md).toContain("`cf-cache-status`");
		expect(md).toContain("*error 524*");
	});

	it("React 的 `<!-- -->` 分隔符不进正文，实体已解码", () => {
		const md = typed("paragraph")[0].md;
		expect(md).not.toContain("<!--");
		expect(md).toContain("Cloudflare’s own code");
	});

	it("标题带层级与锚点", () => {
		expect(typed("heading")).toEqual([
			{ type: "heading", level: 2, text: "Connected, then silent", anchor: "two-clocks" },
			{ type: "heading", level: 2, text: "FAQ", anchor: "faq" },
			{ type: "heading", level: 3, text: "What does error 524 mean?", anchor: undefined },
		]);
	});

	it("内联 SVG 取无障碍描述当图注", () => {
		expect(typed("figure")).toEqual([{ type: "figure", alt: "Where error 524 starts in a proxied request." }]);
	});

	it("表格保留表头与行首表头单元格", () => {
		expect(typed("table")[0]).toEqual({
			type: "table",
			headers: ["Limit", "Default"],
			rows: [
				["Proxy read timeout", "125 s"],
				["Proxy write timeout", "30 s"],
			],
		});
	});

	it("强调紧贴正文时补空格，避免星号被原样显示", () => {
		// 站上确有 `</strong>` 后直接跟正文的写法，CommonMark 下那对 ** 不成对
		expect(typed("list")[1].items[1]).toBe("**Two.** No space after the bold run.");
	});

	it("有序/无序列表分别标记", () => {
		expect(typed("list").map((l) => l.ordered)).toEqual([true, false]);
		expect(typed("list")[0].items[0]).toBe("**Stop waiting synchronously.** Return a job ID immediately.");
	});

	it("代码块保留换行、不做行内转义", () => {
		expect(typed("code")[0].text).toBe("curl -sSI https://example.com/app.css\ndig +short example.com A");
	});

	it("FAQ 的 div 包裹被拆平，问答按顺序在末尾", () => {
		expect(blocks.at(-2)).toEqual({ type: "heading", level: 3, text: "What does error 524 mean?", anchor: undefined });
		expect(blocks.at(-1)).toEqual({ type: "paragraph", md: "The origin was too slow." });
	});
});
