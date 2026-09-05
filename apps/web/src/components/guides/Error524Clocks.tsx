/**
 * 524 的两只钟：连接已经建立之后，回源请求还要过「写完请求体」与「等到响应头」两道超时。
 * 纯 SVG、无 JS；配色全走主题 token，亮/暗两套都成立；竖版布局，窄屏不溢出。
 */
export default function Error524Clocks() {
  const box = (y: number) => ({ x: 24, y, width: 268, height: 58, rx: 14 });

  return (
    <figure className="my-8">
      <svg
        viewBox="0 0 360 396"
        role="img"
        aria-label="Where error 524 starts in a proxied request: the TCP connection to the origin opens successfully, which rules out error 522; Cloudflare then has 30 seconds to write the request body under the Proxy Write Timeout, and the origin has 125 seconds to return response headers under the Proxy Read Timeout. Missing either deadline returns error 524."
        className="mx-auto block h-auto w-full max-w-[420px]"
      >
        <title>The two timeouts behind Cloudflare error 524</title>

        <defs>
          <marker
            id="e524-arrow"
            viewBox="0 0 8 8"
            refX="6"
            refY="4"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M0 0 L8 4 L0 8 z" fill="var(--oc-orange)" />
          </marker>
        </defs>

        {/* 1 · 连接建立成功——这一步失败才是 522 */}
        <rect {...box(16)} fill="var(--glass-bg)" stroke="var(--divider)" />
        <text
          x="158"
          y="42"
          textAnchor="middle"
          fontSize="15"
          fontWeight="600"
          fill="var(--t-primary)"
        >
          Connection to origin opens
        </text>
        <text
          x="158"
          y="60"
          textAnchor="middle"
          fontSize="12"
          fill="var(--t-secondary)"
        >
          this step failing is a 522, not a 524
        </text>

        {/* 2 · 写请求体：30 秒 */}
        <rect
          {...box(126)}
          fill="var(--glass-bg)"
          stroke="var(--oc-orange)"
          strokeOpacity="0.55"
        />
        <text
          x="158"
          y="152"
          textAnchor="middle"
          fontSize="15"
          fontWeight="600"
          fill="var(--t-primary)"
        >
          Cloudflare writes the request
        </text>
        <text
          x="158"
          y="170"
          textAnchor="middle"
          fontSize="12"
          fill="var(--t-secondary)"
        >
          Proxy Write Timeout · 30 s · fixed
        </text>
        <text
          x="300"
          y="160"
          textAnchor="middle"
          fontSize="12.5"
          fontWeight="600"
          fill="var(--oc-orange)"
        >
          524
        </text>

        {/* 3 · 等响应头：125 秒 */}
        <rect
          {...box(236)}
          fill="var(--glass-bg)"
          stroke="var(--oc-orange)"
          strokeOpacity="0.55"
        />
        <text
          x="158"
          y="262"
          textAnchor="middle"
          fontSize="15"
          fontWeight="600"
          fill="var(--t-primary)"
        >
          Origin returns response headers
        </text>
        <text
          x="158"
          y="280"
          textAnchor="middle"
          fontSize="12"
          fill="var(--t-secondary)"
        >
          Proxy Read Timeout · 125 s · default
        </text>
        <text
          x="300"
          y="270"
          textAnchor="middle"
          fontSize="12.5"
          fontWeight="600"
          fill="var(--oc-orange)"
        >
          524
        </text>

        {/* 4 · 正常结果 */}
        <rect
          {...box(346)}
          height="34"
          fill="none"
          stroke="var(--divider)"
          strokeDasharray="4 5"
        />
        <text
          x="158"
          y="368"
          textAnchor="middle"
          fontSize="13"
          fill="var(--t-secondary)"
        >
          both met — the visitor gets the page
        </text>

        <g
          stroke="var(--oc-orange)"
          strokeWidth="1.6"
          markerEnd="url(#e524-arrow)"
          fill="none"
        >
          <path d="M158 74 L158 120" />
          <path d="M158 184 L158 230" />
          <path d="M158 294 L158 340" />
        </g>
      </svg>
      <figcaption className="mt-3 text-center text-[13px] leading-relaxed t-tertiary">
        Two separate deadlines return the same error code — and only the lower
        one can ever be raised.
      </figcaption>
    </figure>
  );
}
