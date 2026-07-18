//
//  WhatsNewReleases.generated.swift
//  Orange Cloud
//
//  ⚠️ 自动生成 —— 请勿手改。改 packages/changelog/ios.json 后运行 `pnpm changelog:gen`。
//  字符串走 WhatsNew.xcstrings（table: "WhatsNew"），与 Localizable.xcstrings 解耦。
//

import Foundation

nonisolated enum WhatsNewGenerated {
    static let releases: [WhatsNewRelease] = [
        WhatsNewRelease(version: "1.8.6", items: [
            WhatsNewItem(
                icon:   "globe",
                title:  String(localized: "workers.dev 子域直达", table: "WhatsNew"),
                detail: String(localized: "Worker 开启 workers.dev 子域后，直接显示完整访问地址，点一下即可打开。", table: "WhatsNew")
            ),
            WhatsNewItem(
                icon:   "cube.fill",
                title:  String(localized: "快速绑定 D1 / KV", table: "WhatsNew"),
                detail: String(localized: "在变量与密钥页直接把现有 D1 数据库或 KV 命名空间绑定到 Worker，也能一键解除。", table: "WhatsNew")
            )
        ]),
        WhatsNewRelease(version: "1.8.5", items: [
            WhatsNewItem(
                icon:   "clock.arrow.circlepath",
                title:  String(localized: "Worker 部署历史", table: "WhatsNew"),
                detail: String(localized: "查看每个 Worker 的历次部署记录，并可删除不再需要的旧部署。", table: "WhatsNew")
            ),
            WhatsNewItem(
                icon:   "square.and.pencil",
                title:  String(localized: "就地编辑与删除 Worker", table: "WhatsNew"),
                detail: String(localized: "直接载入线上源码修改后重新部署，变量、密钥与绑定自动保留；也可从 .js 文件导入，或删除整个 Worker。", table: "WhatsNew")
            ),
            WhatsNewItem(
                icon:   "tablecells",
                title:  String(localized: "删除 D1 数据表", table: "WhatsNew"),
                detail: String(localized: "在查询控制台长按任意表即可删除，需输入表名二次确认。", table: "WhatsNew")
            )
        ]),
        WhatsNewRelease(version: "1.8.4", items: [
            WhatsNewItem(
                icon:   "shield.lefthalf.filled",
                title:  String(localized: "编辑 WAF 规则", table: "WhatsNew"),
                detail: String(localized: "WAF 自定义防火墙规则现在支持编辑：点按任意规则即可修改动作、表达式、名称与启用状态，无需再删除后重建。", table: "WhatsNew")
            ),
            WhatsNewItem(
                icon:   "wrench.and.screwdriver.fill",
                title:  String(localized: "稳定性修复", table: "WhatsNew"),
                detail: String(localized: "进一步收敛 iOS 17 上由缓存数据库引发的偶发闪退：缓存读写全部加上异常兜底并在启动时预热，个别设备上残留的启动崩溃不再发生。", table: "WhatsNew")
            )
        ]),
        WhatsNewRelease(version: "1.8.2", items: [
            WhatsNewItem(
                icon:   "arrow.triangle.branch",
                title:  String(localized: "规则中心", table: "WhatsNew"),
                detail: String(localized: "域名详情新增「规则」统一入口：单条重定向、源站、配置、压缩与自定义错误五类规则支持查看、启停、新建、编辑与删除；Page Rules 与 URL 正规化支持查看与启停。", table: "WhatsNew")
            ),
            WhatsNewItem(
                icon:   "globe",
                title:  String(localized: "Pages 自定义域名", table: "WhatsNew"),
                detail: String(localized: "Pages 项目现可直接管理自定义域名：添加、删除、重新验证并检查解析状态；域名在当前账号时，还能一键添加指向项目的 CNAME 记录。", table: "WhatsNew")
            ),
            WhatsNewItem(
                icon:   "arrow.up.arrow.down",
                title:  String(localized: "列表排序", table: "WhatsNew"),
                detail: String(localized: "Workers 与 Pages 列表新增排序：默认（名称）、创建日期、最近更新，选择会被记住。", table: "WhatsNew")
            ),
            WhatsNewItem(
                icon:   "person.badge.key.fill",
                title:  String(localized: "登录更稳定", table: "WhatsNew"),
                detail: String(localized: "根治部分用户「自动退出账号」的问题：授权流程补齐长期凭证，登录状态不再随令牌到期而失效；若授权仍失效，概览页会提供「一键重新授权」引导。", table: "WhatsNew")
            ),
            WhatsNewItem(
                icon:   "waveform.path.ecg",
                title:  String(localized: "体验者计划", table: "WhatsNew"),
                detail: String(localized: "新增可随时开关的体验者计划：默认关闭，加入后才会匿名上报诊断信息，帮助我们更快定位闪退与登录问题；不收集任何个人身份数据。", table: "WhatsNew")
            ),
            WhatsNewItem(
                icon:   "textformat.123",
                title:  String(localized: "数据单位显示", table: "WhatsNew"),
                detail: String(localized: "存储与流量单位在所有语言下统一显示为国际通用符号（KB / MB / GB），不再随语言翻译。", table: "WhatsNew")
            ),
            WhatsNewItem(
                icon:   "wrench.and.screwdriver.fill",
                title:  String(localized: "稳定性修复", table: "WhatsNew"),
                detail: String(localized: "根治 iOS 17.0 上概览页、资源列表与域名详情的多处闪退与冻结；同时修复 Tunnel 页面卡死与冷启动请求翻倍的问题。", table: "WhatsNew")
            ),
            WhatsNewItem(
                icon:   "speedometer",
                title:  String(localized: "滑动更流畅", table: "WhatsNew"),
                detail: String(localized: "重做玻璃卡片的渲染方式：观感不变，滚动开销大幅下降，列表与概览页滑动明显更顺滑，旧机型尤其受益。", table: "WhatsNew")
            )
        ]),
        WhatsNewRelease(version: "1.8.0", items: [
            WhatsNewItem(
                icon:   "bell.badge.fill",
                title:  String(localized: "推送中心", table: "WhatsNew"),
                detail: String(localized: "内置推送服务：拿到一个专属端点，用 curl 或脚本就能把消息推到这台设备，支持标题、分组、铃声与端到端加密。无需登录 Cloudflare 即可使用。", table: "WhatsNew")
            ),
            WhatsNewItem(
                icon:   "wrench.and.screwdriver.fill",
                title:  String(localized: "免登录开发者工具箱", table: "WhatsNew"),
                detail: String(localized: "无需登录即可使用一组常用网络工具：DNS 查询、SSL 证书检查、HTTP 头、WHOIS、IP 归属、CIDR 计算与 Cloudflare trace。打开 App 在登录页就能直接进入。", table: "WhatsNew")
            ),
            WhatsNewItem(
                icon:   "exclamationmark.bubble.fill",
                title:  String(localized: "把 Cloudflare 告警推到手机", table: "WhatsNew"),
                detail: String(localized: "登录后可直接管理 Cloudflare 告警策略：选择想关注的告警类型（DDoS、健康检查、证书到期、Workers 错误率等），一键接到推送中心，事件发生时直推到这台设备。需账号下有 Pro 及以上套餐的域名。", table: "WhatsNew")
            ),
            WhatsNewItem(
                icon:   "rectangle.3.group.fill",
                title:  String(localized: "开发者平台更进一步", table: "WhatsNew"),
                detail: String(localized: "Queues 现可暂停/恢复投递、清空消息、调整保留期与延迟；Hyperdrive 可编辑查询缓存与源数据库连接；Durable Objects 可浏览对象实例；Workers AI 能直接在 App 内试运行文本生成模型，缺权限时可一键补授权、无需退出登录。", table: "WhatsNew")
            )
        ]),
        WhatsNewRelease(version: "1.7.0", items: [
            WhatsNewItem(
                icon:   "rectangle.3.group.fill",
                title:  String(localized: "全新「开发者平台」", table: "WhatsNew"),
                detail: String(localized: "把 Workers、Pages、Queues、Durable Objects、Hyperdrive、Workers AI、AI Gateway 收进一个按「计算 / 数据与消息 / AI」分组的 Tab，对齐 Cloudflare 的产品布局。", table: "WhatsNew")
            ),
            WhatsNewItem(
                icon:   "plus.circle.fill",
                title:  String(localized: "创建资源，不止于查看", table: "WhatsNew"),
                detail: String(localized: "直接新建 R2 存储桶、KV 命名空间、Pages 项目、Queues、Hyperdrive 与 AI Gateway，并可删除。", table: "WhatsNew")
            ),
            WhatsNewItem(
                icon:   "square.and.arrow.up.fill",
                title:  String(localized: "部署 Pages 与 Workers", table: "WhatsNew"),
                detail: String(localized: "Pages 支持「直接上传」部署（粘贴代码或选取文件 / ZIP）；Workers 可新建并整体更新代码，变量与密钥支持 JSON 批量导入。受 OAuth 限制无法读取源码，更新为整体替换。", table: "WhatsNew")
            ),
            WhatsNewItem(
                icon:   "lock.shield.fill",
                title:  String(localized: "Zero Trust 编辑器", table: "WhatsNew"),
                detail: String(localized: "可视化增删改 Access 自托管应用与策略，以及 Gateway 的 DNS / HTTP / 网络策略，内置带选择器调色板的表达式编辑器。", table: "WhatsNew")
            ),
            WhatsNewItem(
                icon:   "shield.lefthalf.filled",
                title:  String(localized: "WAF 可视化规则构建器", table: "WhatsNew"),
                detail: String(localized: "新建自定义防护规则时，可在「书写规则」与「表达式编辑器」之间随时切换，更快写出想要的条件。", table: "WhatsNew")
            ),
            WhatsNewItem(
                icon:   "checklist",
                title:  String(localized: "授权更省心", table: "WhatsNew"),
                detail: String(localized: "授权页新增「全部只读 / 全部读写 / 仅必选」快捷预设。本版新增 Queues、AI Gateway、Workers AI 等模块，需重新授权才会点亮对应入口。", table: "WhatsNew")
            )
        ]),
        WhatsNewRelease(version: "1.6.0", items: [
            WhatsNewItem(
                icon:   "folder.badge.gearshape",
                title:  String(localized: "在「文件」App 中打开 R2", table: "WhatsNew"),
                detail: String(localized: "把 R2 存储桶挂进系统「文件」App，像 iCloud 云盘一样浏览、上传、下载、重命名，并用任意 App 直接打开。Pro 功能。", table: "WhatsNew")
            ),
            WhatsNewItem(
                icon:   "sparkles",
                title:  String(localized: "设备端 AI 助手", table: "WhatsNew"),
                detail: String(localized: "用一句话生成 DNS 记录，或为流量分析生成一句话要点摘要——全部在设备上离线完成，不出设备。需 iOS 26 及支持 Apple 智能的机型，Pro 功能。", table: "WhatsNew")
            ),
            WhatsNewItem(
                icon:   "globe.americas",
                title:  String(localized: "全球流量地图", table: "WhatsNew"),
                detail: String(localized: "在世界地图上按国家/地区查看请求量与威胁分布，一眼看清流量来自哪里。Pro 功能。", table: "WhatsNew")
            ),
            WhatsNewItem(
                icon:   "wrench.and.screwdriver",
                title:  String(localized: "体验与稳定性改进", table: "WhatsNew"),
                detail: String(localized: "新增「减少动画」开关让界面更跟手，优化多账号切换的稳定性，并在后台预热数据，切回前台更快看到最新内容。", table: "WhatsNew")
            )
        ]),
        WhatsNewRelease(version: "1.5.0", items: [
            WhatsNewItem(
                icon:   "bolt.horizontal",
                title:  String(localized: "缓存规则", table: "WhatsNew"),
                detail: String(localized: "按 URL 自定义边缘与浏览器缓存时长、绕过缓存，直接在手机上管理缓存规则。", table: "WhatsNew")
            ),
            WhatsNewItem(
                icon:   "arrow.left.arrow.right",
                title:  String(localized: "负载均衡", table: "WhatsNew"),
                detail: String(localized: "查看与管理负载均衡器、源站池和健康监测，掌握流量分发与源站健康。", table: "WhatsNew")
            ),
            WhatsNewItem(
                icon:   "doc.richtext",
                title:  String(localized: "Cloudflare Pages", table: "WhatsNew"),
                detail: String(localized: "浏览 Pages 项目与部署，一键重试 / 回滚 / 删除部署，并编辑构建配置。", table: "WhatsNew")
            ),
            WhatsNewItem(
                icon:   "envelope",
                title:  String(localized: "Email Routing", table: "WhatsNew"),
                detail: String(localized: "开关域名的邮件路由，增删改转发规则，并管理账号内的已验证目的地址。", table: "WhatsNew")
            ),
            WhatsNewItem(
                icon:   "gauge.with.dots.needle.bottom.50percent",
                title:  String(localized: "Rate Limiting", table: "WhatsNew"),
                detail: String(localized: "新建与管理限速规则：按访客 IP 在时间窗内限制请求次数，超限即阻止或质询。", table: "WhatsNew")
            ),
            WhatsNewItem(
                icon:   "lock.shield",
                title:  String(localized: "Zero Trust", table: "WhatsNew"),
                detail: String(localized: "查看受 Cloudflare Access 保护的应用，以及 Gateway 的 DNS / HTTP / 网络过滤策略。", table: "WhatsNew")
            )
        ]),
        WhatsNewRelease(version: "1.4.0", items: [
            WhatsNewItem(
                icon:   "checkmark.seal",
                title:  String(localized: "SSL 证书与加密设置", table: "WhatsNew"),
                detail: String(localized: "查看域名的边缘证书与到期时间，开关 Universal SSL，并调整 SSL/TLS 加密模式。", table: "WhatsNew")
            ),
            WhatsNewItem(
                icon:   "arrow.triangle.branch",
                title:  String(localized: "Transform Rules", table: "WhatsNew"),
                detail: String(localized: "查看并编辑 URL 重写、请求头与响应头规则，直接在手机上管理流量改写。", table: "WhatsNew")
            ),
            WhatsNewItem(
                icon:   "hand.raised",
                title:  String(localized: "IP 访问规则", table: "WhatsNew"),
                detail: String(localized: "按 IP、网段、ASN 或国家/地区拦截、质询或放行访问，随时增删规则。", table: "WhatsNew")
            ),
            WhatsNewItem(
                icon:   "shippingbox",
                title:  String(localized: "R2 存储升级", table: "WhatsNew"),
                detail: String(localized: "以文件夹方式浏览对象，复制或移动文件，查看各存储桶用量，并管理公开访问域名与 CORS。", table: "WhatsNew")
            ),
            WhatsNewItem(
                icon:   "link",
                title:  String(localized: "按 URL 精准清缓存", table: "WhatsNew"),
                detail: String(localized: "无需清空整站，指定单个或多个 URL 精准刷新缓存；并新增性能与缓存设置页。", table: "WhatsNew")
            ),
            WhatsNewItem(
                icon:   "globe",
                title:  String(localized: "更多语言与稳定性", table: "WhatsNew"),
                detail: String(localized: "新增德语、法语、阿拉伯语与土耳其语；并改进崩溃诊断，帮助更快定位疑难问题。", table: "WhatsNew")
            )
        ]),
        WhatsNewRelease(version: "1.3.2", items: [
            WhatsNewItem(
                icon:   "sparkles",
                title:  String(localized: "用自然语言写 WAF 规则", table: "WhatsNew"),
                detail: String(localized: "在支持 Apple 智能的设备上，用一句话描述需求即可生成 WAF 自定义规则，也能把现有规则翻译成大白话；全程在设备上离线完成。", table: "WhatsNew")
            ),
            WhatsNewItem(
                icon:   "wrench.and.screwdriver",
                title:  String(localized: "修复启动闪退", table: "WhatsNew"),
                detail: String(localized: "修复了 App 在部分 iOS 17 设备上一启动就闪退的问题。", table: "WhatsNew")
            ),
            WhatsNewItem(
                icon:   "key.fill",
                title:  String(localized: "登录更稳定", table: "WhatsNew"),
                detail: String(localized: "登录信息改为仅在本机安全保管，修复了偶尔被登出、需要重新登录的问题；登录状态不再通过 iCloud 在设备间同步。", table: "WhatsNew")
            )
        ]),
        WhatsNewRelease(version: "1.3.0", items: [
            WhatsNewItem(
                icon:   "globe.badge.chevron.right",
                title:  String(localized: "添加域名", table: "WhatsNew"),
                detail: String(localized: "在 App 里把已注册的域名加入账号，并拿到要去注册商处配置的名称服务器。", table: "WhatsNew")
            ),
            WhatsNewItem(
                icon:   "network",
                title:  String(localized: "Tunnel 管理", table: "WhatsNew"),
                detail: String(localized: "不再只是查看——新建隧道、获取连接令牌与命令、配置公共主机名路由。", table: "WhatsNew")
            ),
            WhatsNewItem(
                icon:   "cylinder.split.1x2",
                title:  String(localized: "D1 数据库管理", table: "WhatsNew"),
                detail: String(localized: "直接新建 D1 数据库，或在原样确认库名后安全删除。", table: "WhatsNew")
            ),
            WhatsNewItem(
                icon:   "key",
                title:  String(localized: "变量与密钥", table: "WhatsNew"),
                detail: String(localized: "管理 Worker 的环境变量与密钥，随手增删改。", table: "WhatsNew")
            ),
            WhatsNewItem(
                icon:   "clock",
                title:  String(localized: "定时触发器", table: "WhatsNew"),
                detail: String(localized: "查看与增删 Cron 触发器，让 Worker 按计划自动运行。", table: "WhatsNew")
            ),
            WhatsNewItem(
                icon:   "globe",
                title:  String(localized: "域名与路由", table: "WhatsNew"),
                detail: String(localized: "管理 workers.dev 子域、自定义域与路由，掌控 Worker 的访问入口。", table: "WhatsNew")
            )
        ]),
        WhatsNewRelease(version: "1.2.1", items: [
            WhatsNewItem(
                icon:   "applewatch",
                title:  String(localized: "Apple Watch App", table: "WhatsNew"),
                detail: String(localized: "把域名状态与流量概览带上手腕，还能添加到表盘复杂功能随时一瞥。", table: "WhatsNew")
            ),
            WhatsNewItem(
                icon:   "curlybraces",
                title:  String(localized: "Snippets", table: "WhatsNew"),
                detail: String(localized: "在域名详情查看、编辑、新建 Cloudflare 边缘代码片段，并管理触发规则——轻量版 Workers，Pro 解锁。", table: "WhatsNew")
            ),
            WhatsNewItem(
                icon:   "accessibility",
                title:  String(localized: "全面无障碍", table: "WhatsNew"),
                detail: String(localized: "VoiceOver、更大字体、不只靠颜色区分、足够对比度全面达标，配合系统辅助功能更顺手。", table: "WhatsNew")
            ),
            WhatsNewItem(
                icon:   "character.bubble",
                title:  String(localized: "更多语言", table: "WhatsNew"),
                detail: String(localized: "新增西班牙语、韩语、葡萄牙语，现已支持九种语言。", table: "WhatsNew")
            ),
            WhatsNewItem(
                icon:   "arrow.clockwise",
                title:  String(localized: "刷新更省心", table: "WhatsNew"),
                detail: String(localized: "刷新失败不再弹窗打断，下拉刷新更稳定可靠。", table: "WhatsNew")
            )
        ])
    ]
}
