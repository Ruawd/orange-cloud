// CODEGEN —— 由 harmonyos.json 生成鸿蒙的「新功能」内容。运行：`pnpm changelog:gen`（或 gen:harmony）。
// 产出 codegen 独占文件：
//   entry/src/main/ets/core/whatsnew/WhatsNewReleases.generated.ets
//
// 与 iOS / Android 的两点不同：
//  ① 鸿蒙 App 当前无 i18n（全 zh-Hans 硬编码），文案直接内联 zh-Hans，不出资源文件；
//     harmonyos.json 里的 en 供官网 / AppGallery 英文素材复用。
//  ② 图标：changelog 里写的是 SF Symbol 名（与 iOS 同源），这里按 ICONS 映射到
//     HarmonyOS 的 sys.symbol。**映射表里的名字都已对着 SDK 的 id_defined.json 核过**；
//     未收录的名字回退 checkmark_circle，并在控制台提示，避免生成编译不过的 $r()。
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { emit, finalize } from "./_emit.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..", "..", "..");
const OUT = join(repo, "apps/harmonyos/entry/src/main/ets/core/whatsnew/WhatsNewReleases.generated.ets");

// apps/harmonyos 不入库（见根 .gitignore）：干净 clone / CI 上该目录并不存在。
// 此时写盘会 ENOENT，check 模式又会把「文件不存在」判成漂移而非零退出——
// 两种都是误报，直接跳过，让 `pnpm changelog:gen` / `:check` 在没有鸿蒙工程的环境里照常通过。
if (!existsSync(dirname(OUT))) {
  console.log("⏭️  gen-harmony: 未找到 apps/harmonyos（该目录不入库），跳过生成");
  process.exit(0);
}

/** SF Symbol → sys.symbol（右侧名字均已在 SDK id_defined.json 中验证存在） */
const ICONS = {
  "person.badge.key": "person_badge_checkmark",
  "person.crop.circle.badge.checkmark": "person_badge_checkmark",
  globe: "discover",
  "bolt.fill": "bolt",
  bolt: "bolt",
  externaldrive: "externaldrive",
  archivebox: "archivebox",
  "sun.horizon": "sun_max",
  brain: "wand_and_stars",
  magnifyingglass: "magnifyingglass",
  "bell.badge.fill": "bell",
  "checkmark.shield": "checkmark_shield",
  "lock.shield": "lock_shield",
  "arrow.triangle.branch": "square_stack_3d",
  "square.grid.2x2": "square_grid_2x2",
  "doc.text": "doc_text",
  "doc.richtext": "doc_text",
  terminal: "code_slash",
  "clock.arrow.circlepath": "clock",
  "arrow.up.arrow.down": "sort",
  "pause.circle": "timer",
  envelope: "envelope",
  "wrench.and.screwdriver.fill": "gearshape",
};
const FALLBACK = "checkmark_circle";

const releases = JSON.parse(readFileSync(join(here, "..", "harmonyos.json"), "utf8"));
const isNewer = (a, b) => a.localeCompare(b, undefined, { numeric: true }) > 0;
const inApp = releases
  .filter((r) => r.inApp !== false)
  .sort((a, b) => (isNewer(a.version, b.version) ? -1 : 1));

const missing = new Set();
const symbolOf = (icon) => {
  if (!icon) return FALLBACK;
  const mapped = ICONS[icon];
  if (!mapped) missing.add(icon);
  return mapped ?? FALLBACK;
};

/** ArkTS 单引号字符串字面量转义 */
const esc = (s) => (s ?? "").replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n");
const zh = (map) => map?.["zh-Hans"] ?? map?.en ?? "";

const body = inApp
  .map((r) => {
    const items = r.items
      .map(
        (it) =>
          `      {\n` +
          `        symbol: $r('sys.symbol.${symbolOf(it.icon)}'),\n` +
          `        title: '${esc(zh(it.title))}',\n` +
          `        detail: '${esc(zh(it.detail))}',\n` +
          `      },`,
      )
      .join("\n");
    return `  {\n    version: '${r.version}',\n    items: [\n${items}\n    ],\n  },`;
  })
  .join("\n");

const ets = `// ⚠️ 自动生成 —— 请勿手改。改 packages/changelog/harmonyos.json 后运行 \`pnpm changelog:gen\`。
// 文案取 zh-Hans（鸿蒙 App 当前无 i18n），图标由 SF Symbol 名映射到 sys.symbol。
import { WhatsNewRelease } from './WhatsNew';

/// 用函数而非顶层常量：\$r() 在函数体内求值，避免模块初始化期取资源。
export function whatsNewReleases(): WhatsNewRelease[] {
  return [
${body}
  ];
}
`;
emit(OUT, ets);

if (missing.size) {
  console.warn(`⚠️  gen-harmony: 以下 SF Symbol 未在 ICONS 映射表里，已回退 ${FALLBACK}：${[...missing].join(", ")}`);
}
console.log(`✅ gen-harmony: ${inApp.length} releases → WhatsNewReleases.generated.ets`);
finalize("gen-harmony");
