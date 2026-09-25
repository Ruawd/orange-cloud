// 付费相关协议正文（华为审核指南 6.3：含自动续费的应用须在购买页提供会员服务说明、
// 自动续费服务协议及取消自动续费的说明与流程）。正文随包内置，不依赖网络，审核与离线都能看。
// 价格不写死：一律以购买页与华为收银台展示为准。

export interface AgreementSection {
  heading: string;
  body: string;
}

export interface AgreementDoc {
  title: string;
  updated: string;
  sections: AgreementSection[];
}

export class AgreementKind {
  static readonly MEMBERSHIP: string = 'membership';
  static readonly AUTO_RENEW: string = 'autoRenew';
}

export const OPERATOR_NAME = '龙岩新罗柘家科技有限公司';
export const SERVICE_EMAIL = 'support@zhe.ltd';

/// 取消自动续费的路径（购买页与协议正文共用同一份文案，避免两处说法不一致）
export const CANCEL_STEPS: string[] = [
  '打开手机「设置」，点击顶部的华为账号头像；',
  '进入「付款与购物」→「订阅」；',
  '选择「Orange Cloud Pro 年度」，点击「取消订阅」并确认。',
];

const MEMBERSHIP: AgreementDoc = {
  title: '会员服务说明',
  updated: '更新日期：2026 年 9 月 24 日',
  sections: [
    {
      heading: '一、服务提供方',
      body: `Orange Cloud Pro 会员服务（以下简称「Pro」）由${OPERATOR_NAME}（以下简称「我们」）提供，通过华为应用内支付（IAP）购买。`,
    },
    {
      heading: '二、Pro 包含的权益',
      body: '开通后，本应用内以下功能全部可用：\n· 多账号切换：同时登录多个 Cloudflare 身份并随时切换；\n· 存储模块：R2 对象存储、D1 数据库、KV 键值的完整管理；\n· Workers 实时日志：边缘请求 tail 实时追踪；\n· WAF 自定义规则：查看、启停与新建；\n· Cloudflare Tunnel：隧道状态、路由与连接令牌；\n· 7 天 / 30 天流量分析（免费版为 24 小时）。',
    },
    {
      heading: '三、开通方式与费用',
      body: '· Pro 年度：自动续费订阅，每个订阅周期为 1 年，到期自动续费，可随时取消。续费规则详见《自动续费服务协议》。\n· Pro 终身：一次性买断，非订阅，不会自动续费，也不会产生后续扣费。\n具体价格以购买页及华为收银台展示为准，支付时由华为应用内支付完成扣款。',
    },
    {
      heading: '四、免费版',
      body: '不开通 Pro 也可以一直使用免费版：单账号、域名与 DNS 全功能、24 小时流量分析等。开通 Pro 是可选的。',
    },
    {
      heading: '五、权益生效与恢复',
      body: 'Pro 权益与购买时登录的华为账号绑定。更换设备或重装应用后，登录同一华为账号，在购买页点击「恢复购买」即可恢复；已购买过的商品不会重复扣款。',
    },
    {
      heading: '六、服务范围说明',
      body: 'Pro 仅解锁本应用的功能，不包含 Cloudflare 自身的任何付费套餐或用量费用。你的 Cloudflare 账号产生的费用由 Cloudflare 另行收取，与本服务无关。Orange Cloud 是独立的第三方客户端，与 Cloudflare, Inc. 无隶属关系。',
    },
    {
      heading: '七、未成年人',
      body: '未满 18 周岁的用户，请在监护人同意并陪同下购买。',
    },
    {
      heading: '八、联系我们',
      body: `购买、订阅、退款相关问题，请联系客服：${SERVICE_EMAIL}（工作日 9:00–18:00，北京时间），一般 1 个工作日内回复。`,
    },
  ],
};

const AUTO_RENEW: AgreementDoc = {
  title: '自动续费服务协议',
  updated: '更新日期：2026 年 9 月 24 日',
  sections: [
    {
      heading: '一、协议说明',
      body: `本协议是你与${OPERATOR_NAME}（以下简称「我们」）之间关于 Orange Cloud Pro 年度自动续费服务（以下简称「自动续费服务」）的约定。开通前请仔细阅读本协议，特别是有关自动扣费、取消方式与退款的条款。你在购买页主动勾选同意本协议并完成支付，即表示你已阅读、理解并接受本协议。`,
    },
    {
      heading: '二、服务内容与费用',
      body: '自动续费服务适用于「Orange Cloud Pro 年度」订阅，订阅周期为 1 年。开通时将扣取首个周期的费用，金额以购买页及华为收银台展示为准。Pro 包含的权益见《会员服务说明》。',
    },
    {
      heading: '三、自动续费规则',
      body: '1. 开通后，每个订阅周期到期前，华为应用内支付会通过你开通时选择的支付方式自动扣取下一个周期的费用，续费周期同样为 1 年。\n2. 扣费成功后，Pro 权益自动顺延一个周期；扣费失败的，订阅到期后 Pro 权益停止，免费版功能不受影响。\n3. 如续费价格发生调整，将通过华为提前告知你，你可以选择接受新价格或在下次扣费前取消订阅。\n4. 你可以在「设置 → 华为账号 → 付款与购物 → 订阅」中随时查看订阅状态与下次续费日期。',
    },
    {
      heading: '四、如何取消自动续费',
      body: `你可以随时取消自动续费，取消不收取任何费用：\n1. ${CANCEL_STEPS[0]}\n2. ${CANCEL_STEPS[1]}\n3. ${CANCEL_STEPS[2]}\n也可以在本应用「设置 → Orange Cloud Pro」页面点击「管理订阅」直接前往。\n为避免下一周期被扣费，请在当前周期到期前至少 24 小时完成取消。取消后，已支付周期内的 Pro 权益保留至该周期结束，之后不再扣费。`,
    },
    {
      heading: '五、退款',
      body: `已扣取的费用原则上不予退还，法律法规另有规定或符合华为应用内支付退款政策的除外。如对扣费有疑问，请联系客服 ${SERVICE_EMAIL}，或通过华为「付款与购物」申请处理。`,
    },
    {
      heading: '六、协议变更',
      body: '我们可能根据法律法规或业务调整修订本协议，修订后将在应用内公布。涉及费用等重大变更的，将提前通知你；你不同意的，可在变更生效前取消自动续费。',
    },
    {
      heading: '七、联系我们',
      body: `如对本协议或自动续费服务有任何疑问，请联系：${SERVICE_EMAIL}（工作日 9:00–18:00，北京时间）。`,
    },
  ],
};

export function agreementDoc(kind: string): AgreementDoc {
  return kind === AgreementKind.AUTO_RENEW ? AUTO_RENEW : MEMBERSHIP;
}
