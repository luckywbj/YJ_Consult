// utils/consultStore.js
// 岩姐商业咨询 · 订单、咨询过程追踪、交付结果与多角色权限隔离中心

const STORAGE_KEY = 'yj_consult_projects_v3';
const AUTH_KEY = 'yj_consult_auth_session_v1';
const CLIENT_PASSWORDS_KEY = 'yj_consult_client_passwords_v1';
const ADMIN_PASSCODE = '8888'; // 顾问后台工作人员默认管理口令

// 三大核心服务产品目录
const SERVICES_CATALOG = [
  {
    id: 's1',
    tier: '旗舰单品 · 深度问诊',
    name: '1对1 商业闭门深度私董会',
    price: 29800,
    priceText: '¥29,800 / 场',
    deposit: 2980,
    depositText: '¥2,980',
    quota: '每月仅限 5 席',
    target: '年营收500万以上、客单价遇瓶颈的企业主 / 知识商业IP',
    deliverables: [
      '3小时面对面闭门深度商业逻辑推演',
      '重构企业“奢侈品思维”产品定价与溢价体系',
      '独家定制《企业高客单破局行动路线图》',
      '交付后 14 天顾问团队答疑答辩追踪'
    ]
  },
  {
    id: 's2',
    tier: '全案赋能 · 体系操盘',
    name: '高客单商业操盘全案',
    price: 128000,
    priceText: '¥128,000 / 季',
    deposit: 10000,
    depositText: '¥10,000',
    quota: '每季度仅接 2 席',
    target: '希望打造销冠级成交体系与高转化会销漏斗的成熟团队',
    deliverables: [
      '顾问团队进驻调研，拆解现有产品交付漏洞',
      '全套奢侈品成交话术库、朋友圈发售剧本SOP输出',
      '现场销冠级高客单谈单培训与模拟演练',
      '全程协助落地一场高产出发售活动'
    ]
  },
  {
    id: 's3',
    tier: '长期陪跑 · 顶层协同',
    name: '年度战略商业顾问（限额）',
    price: 360000,
    priceText: '¥360,000 / 年',
    deposit: 30000,
    depositText: '¥30,000',
    quota: '全年仅开放 3 个席位',
    target: '志在成为细分赛道领头羊的高成长型企业',
    deliverables: [
      '全年战略股东级定期闭门复盘与经营研讨',
      '重大商业并购、合伙人机制、融资顶层设计把关',
      '岩姐高净值商业圈层与异业核心生态资源引荐',
      '随时为创始人提供重大商业决策参谋支持'
    ]
  }
];

// 5步全闭环交付标准流程
const DELIVERY_STEPS = [
  { step: 1, code: '01', title: '资质初筛', desc: '评估企业经营现状，匹配咨询方案与首席顾问排期' },
  { step: 2, code: '02', title: '深度问诊', desc: '全维度剖析客群画像、定价模式、销售卡点与交付链路' },
  { step: 3, code: '03', title: '全案输出', desc: '产出可执行、可衡量的 10 倍客单跃迁操盘方案与SOP' },
  { step: 4, code: '04', title: '陪跑落地', desc: '辅导团队打通成交闭环，协助高客单品鉴/发售落地' },
  { step: 5, code: '05', title: '复盘迭代', desc: '复盘核心业绩指标增长率，完成结案验收与资产沉淀' }
];

// 默认演示项目数据（分别绑定不同客户手机号，实现严格的一客一档隔离）
function getDefaultProjects() {
  return [
    {
      id: 'YY2026112001',
      name: '李总',
      phone: '13888888899',
      industry: '高端私域美业（轻医美连锁）',
      problem: '门店长期依赖低价团购引流，顾问不敢报高价，高净值客户留存与升单困难。',
      type: '高客单商业操盘全案',
      planId: 's2',
      totalPrice: 128000,
      paidAmount: 128000,
      payMode: '已付全款 · 正式立项',
      status: '服务进行中',
      currentStep: 4,
      stepName: '04 陪跑落地',
      consultant: '岩姐 · 首席操盘顾问团队',
      createTime: '2026-11-10 14:30',
      updateTime: '2026-11-22 18:20',
      metrics: {
        ticketBefore: '¥1,200',
        ticketAfter: '¥29,800',
        marginBefore: '18%',
        marginAfter: '68%',
        revenueBefore: '42万/月',
        revenueAfter: '215万/月',
        conversionBefore: '4.5%',
        conversionAfter: '38.0%',
        highlightSummary: '首轮高定私享沙龙针对 18 位种子老客现场转化 7 单 2.98万 年度美学卡与 2 单 9.8万 家族黑卡，单周高客单回款突破 40.46 万元。'
      },
      sessions: [
        {
          sessionId: 'SES-102',
          sessionNo: 2,
          title: '奢侈品成交话术植入与首场闭门私享会发售彩排',
          date: '2026-11-18 14:00 - 17:30',
          mode: '腾讯会议 + 核心顾问1V1通关演练',
          participants: '岩姐、李总、门店店长及6名高级美学顾问',
          diagnosis: '销售顾问在报出 2.98 万以上价格时心理发虚，习惯性主动打折让利，缺乏“顾问式价值探寻”与情绪价值铺垫能力。',
          solution: '导入岩姐独创「3阶奢侈品价值锚定话术」，将推销单次项目转化为“定制年度年轻态身份方案”，现场逐一通关考核 6 名核心顾问，并敲定周六闭门沙龙促单动线。',
          consultantNote: '团队执行力极强，店长在模拟演练后第二天即用新话术拿下了首单 2.98万 试水成交！',
          clientRating: 0,
          clientFeedback: '',
          clientFeedbackTime: '',
          consultantReply: '',
          consultantReplyTime: '',
          actionItems: [
            {
              id: 'ACT-201',
              text: '6名高定顾问完成 1V1 谈单剧本通关演练录音打卡',
              done: true,
              feedback: '全员已通关，店长已成功开出首单 2.98万！'
            },
            {
              id: 'ACT-202',
              text: '定向邀约 20 位 A 类种子老客参加本周六「东方奢美闭门品鉴沙龙」',
              done: false,
              feedback: '目前已确认到场 16 位，剩余 4 位正在一对一跟进确认。'
            }
          ]
        },
        {
          sessionId: 'SES-101',
          sessionNo: 1,
          title: '顶层商业模式诊断与低毛利引流品砍除推演',
          date: '2026-11-12 14:00 - 17:30',
          mode: '上海静安私董会所 · 线下闭门推演',
          participants: '岩姐、李总（创始人）、运营总监',
          diagnosis: '门店过度依赖 399/699 团购引流，顾问每天接待大量羊毛党沦为客服，真正有消费力的高净值客户缺乏专属升单阶梯，净利率不足 12%。',
          solution: '果断砍掉 70% 低效走量耗品，围绕“抗衰长效管理 + 名媛圈层身份认同”重构「2.98万年度美学私享卡」与「9.8万家族高定黑卡」双层高客单产品矩阵。',
          consultantNote: '创始人认知升级非常快，当场拍板停止低价团购投放，全力转向私域高客单深耕。',
          clientRating: 5,
          clientFeedback: '第一次跟岩姐做完底层商业模式拆解，一下看清了之前忙着低价团购却不赚钱的死结！高定黑卡分层设计非常落地，当晚我们就开会拍板执行了。',
          clientFeedbackTime: '2026-11-12 20:15',
          consultantReply: '收到李总反馈！执行果断就是核心竞争力，接下来重点盯好 TOP 50 老客分级与 VIP 问诊室落地细节。',
          consultantReplyTime: '2026-11-12 20:42',
          actionItems: [
            {
              id: 'ACT-101',
              text: '盘点近12个月消费满1万元的 TOP 50 种子客户名单并完成资产分级',
              done: true,
              feedback: '已由店长梳理完毕，共筛选出 62 位高潜 VIP 客户档案。'
            },
            {
              id: 'ACT-102',
              text: '下架亏损团购引流单品，按照奢侈品接待标准改造 VIP 私密问诊室',
              done: true,
              feedback: '已全面替换门店烫金价目册、香氛茶歇与私密接待室动线。'
            }
          ]
        }
      ],
      deliverables: [
        {
          delivId: 'DEL-301',
          stage: '04 陪跑落地',
          title: '《首场闭门私享品鉴会全流程执行手册与朋友圈7天发售剧本》',
          fileType: 'PDF / 方案全案',
          deliverTime: '2026-11-19 11:00',
          status: '待客户验收',
          summary: '包含闭门沙龙五感体验动线设计、私信邀约话术、现场主讲人促单节奏控制，以及会后 48 小时高客单追单 SOP。'
        },
        {
          delivId: 'DEL-201',
          stage: '03 全案输出',
          title: '《奢侈品级顾问 1V1 高客单成交话术SOP及价格异议处理库》',
          fileType: 'PDF / 话术手册',
          deliverTime: '2026-11-16 16:30',
          status: '已确认验收',
          summary: '涵盖高净值客户破冰探寻 12 问、情绪价值锚定公式、面对“太贵了/考虑一下”的 8 种高维化解剧本。'
        },
        {
          delivId: 'DEL-101',
          stage: '02 深度问诊',
          title: '《高端美业 10 倍客单商业模式重构蓝图与定价矩阵表》',
          fileType: 'PDF / 战略蓝图',
          deliverTime: '2026-11-13 10:20',
          status: '已确认验收',
          summary: '明确引流品、利润品、尊享高定黑卡的三阶定价模型、权益拆解及顾问高激励提成方案。'
        }
      ],
      clientReview: ''
    },
    {
      id: 'YY2026110502',
      name: '陈老师',
      phone: '13988885520',
      industry: '商业财经知识IP（50万粉丝）',
      problem: '短视频粉丝50万，但变现停留在199元录播课，交付重、天花板低。',
      type: '1对1 商业闭门深度私董会',
      planId: 's1',
      totalPrice: 29800,
      paidAmount: 29800,
      payMode: '已付全款 · 圆满结案',
      status: '已交付结案',
      currentStep: 5,
      stepName: '05 复盘迭代',
      consultant: '岩姐 · 首席商业操盘手',
      createTime: '2026-11-02 10:15',
      updateTime: '2026-11-15 20:00',
      metrics: {
        ticketBefore: '¥199',
        ticketAfter: '¥49,800/年',
        marginBefore: '25%',
        marginAfter: '82%',
        revenueBefore: '18万/月',
        revenueAfter: '360万/首期',
        conversionBefore: '1.2%',
        conversionAfter: '28.5%',
        highlightSummary: '完成从“卖低价课博主”向“高净值企业战略陪跑导师”的身份跃迁，首期 30 席年度战略私董会 48 小时全部售罄，总收款超 360 万元。'
      },
      sessions: [
        {
          sessionId: 'SES-201',
          sessionNo: 1,
          title: 'IP 商业定位升维与 4.98 万年度私董会发售全链路推演',
          date: '2026-11-05 14:00 - 17:30',
          mode: '1V1 闭门深度推演（3.5小时）',
          participants: '岩姐、陈老师及内容合伙人',
          diagnosis: '将大量精力消耗在 199 元社群答疑上，吸引的都是价格敏感型散户，遮蔽了陈老师真正擅长的企业顶层战略咨询势能。',
          solution: '将原有 199 元课程转为高门槛筛选问卷赠品，主力推出仅限 30 席的「4.98万/年 创始人战略私董会」，重构朋友圈 10 天高势能发售叙事。',
          consultantNote: '首发当晚即成交 19 席，48 小时 30 席满员收官，轻资产高客单模型彻底跑通。',
          clientRating: 5,
          clientFeedback: '3.5 小时推演全程高能，帮我彻底跳出了低价录播课陷阱，直接跑通 4.98 万年度私董会模型，非常震撼！',
          clientFeedbackTime: '2026-11-05 21:10',
          consultantReply: '恭喜陈老师 48 小时满员收官，后续重点沉淀首期 30 位创始人的标杆案例！',
          consultantReplyTime: '2026-11-06 09:30',
          actionItems: [
            {
              id: 'ACT-301',
              text: '发布《致 30 位破局创始人的一封信》开启私董会资质审核通道',
              done: true,
              feedback: '首日收到 142 份企业主申请表，筛选出 45 位符合千万营收门槛的准客户。'
            },
            {
              id: 'ACT-302',
              text: '按岩姐定制的「1V1 语音诊断逼单SOP」完成前 30 名意向创始人的定向沟通',
              done: true,
              feedback: '48 小时内 30 个名额全部全款锁定，总营收 360 万！'
            }
          ]
        }
      ],
      deliverables: [
        {
          delivId: 'DEL-401',
          stage: '03 全案输出',
          title: '《知识 IP 高客单私董会产品架构与 48 小时爆单发售剧本》',
          fileType: 'PDF / 操盘路线图',
          deliverTime: '2026-11-06 12:00',
          status: '已确认验收',
          summary: '包含年度私董会交付权益设计、申请表筛选漏斗、朋友圈造势 10 篇文案模板及 1V1 高客单成交清单。'
        }
      ],
      clientReview: '跟着岩姐做完 3 小时闭门推演，彻底打通了高客单任督二脉！以前卖 199 的课累死累活，现在 4.98 万的私董会客户反而更加尊重和感激我们。'
    }
  ];
}

// ==================== 客户专属密码管理（方案 A） ====================

function defaultPasswordFromPhone(phone) {
  const clean = (phone || '').replace(/\s+/g, '');
  return clean.length >= 6 ? clean.slice(-6) : '123456';
}

function generateRandomPassword() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function getClientPasswordMap() {
  const map = wx.getStorageSync(CLIENT_PASSWORDS_KEY);
  return map && typeof map === 'object' ? map : {};
}

function saveClientPasswordMap(map) {
  wx.setStorageSync(CLIENT_PASSWORDS_KEY, map);
}

function getClientPassword(phone) {
  const cleanPhone = (phone || '').trim();
  if (!cleanPhone) return '';
  const map = getClientPasswordMap();
  if (typeof map[cleanPhone] === 'string' && map[cleanPhone]) {
    return map[cleanPhone];
  }
  return defaultPasswordFromPhone(cleanPhone);
}

function setClientPassword(phone, password) {
  const cleanPhone = (phone || '').trim();
  const cleanPass = (password || '').trim();
  if (!cleanPhone) {
    return { ok: false, msg: '手机号不能为空' };
  }
  if (cleanPass.length < 4) {
    return { ok: false, msg: '登录密码不能少于 4 位' };
  }
  const map = getClientPasswordMap();
  map[cleanPhone] = cleanPass;
  saveClientPasswordMap(map);
  return { ok: true, password: cleanPass };
}

function changeClientPassword(phone, oldPass, newPass) {
  const cleanPhone = (phone || '').trim();
  const cleanOld = (oldPass || '').trim();
  const cleanNew = (newPass || '').trim();
  if (!cleanPhone) {
    return { ok: false, msg: '未检测到登录手机号' };
  }
  if (!cleanOld) {
    return { ok: false, msg: '请输入原登录密码' };
  }
  if (cleanOld !== getClientPassword(cleanPhone)) {
    return { ok: false, msg: '原登录密码不正确' };
  }
  if (cleanNew.length < 4) {
    return { ok: false, msg: '新密码不能少于 4 位' };
  }
  return setClientPassword(cleanPhone, cleanNew);
}

function resetClientPassword(phone, customPassword) {
  const targetPass = (customPassword || '').trim() || generateRandomPassword();
  return setClientPassword(phone, targetPass);
}

// ==================== 登录与权限会话管理 ====================

// 获取当前登录会话：默认未登录访客 ('guest')
function getAuthSession() {
  const session = wx.getStorageSync(AUTH_KEY);
  if (!session || !session.role) {
    return {
      role: 'guest', // 'guest' | 'client' | 'admin'
      clientPhone: '',
      clientName: '',
      staffName: ''
    };
  }
  return session;
}

// 客户手机号 + 专属密码登录（仅能查看该手机号名下的订单与交付空间）
function loginAsClient(phone, password) {
  const cleanPhone = (phone || '').trim();
  const cleanPass = (password || '').trim();
  if (!cleanPhone) {
    return { ok: false, msg: '请输入您下单时预留的手机号' };
  }
  if (!cleanPass) {
    return { ok: false, msg: '请输入专属登录密码' };
  }
  const all = getProjects();
  const matched = all.filter(p => p.phone === cleanPhone);
  if (matched.length === 0) {
    return {
      ok: false,
      msg: '未查询到该手机号名下的咨询项目，请先在线下单或联系顾问建档'
    };
  }
  const expectedPass = getClientPassword(cleanPhone);
  if (cleanPass !== expectedPass) {
    return {
      ok: false,
      msg: '登录密码不正确，请核对后重试或联系顾问重置'
    };
  }
  const session = {
    role: 'client',
    clientPhone: cleanPhone,
    clientName: matched[0].name,
    staffName: ''
  };
  wx.setStorageSync(AUTH_KEY, session);
  return { ok: true, session, count: matched.length };
}

// 顾问/后台工作人员口令登录（解锁顾问工作台，可管理全部客户）
function loginAsAdmin(passcode) {
  const code = (passcode || '').trim();
  if (code !== ADMIN_PASSCODE) {
    return { ok: false, msg: '顾问后台管理口令不正确（演示口令：8888）' };
  }
  const session = {
    role: 'admin',
    clientPhone: '',
    clientName: '',
    staffName: '岩姐 · 首席顾问后台'
  };
  wx.setStorageSync(AUTH_KEY, session);
  return { ok: true, session };
}

// 退出登录（回到未登录访客视角）
function logout() {
  const guestSession = {
    role: 'guest',
    clientPhone: '',
    clientName: '',
    staffName: ''
  };
  wx.setStorageSync(AUTH_KEY, guestSession);
  return guestSession;
}

// 根据当前登录身份，返回可见的咨询项目列表（严格隔离！）
function getVisibleProjects() {
  const session = getAuthSession();
  const all = getProjects();
  if (session.role === 'admin') {
    // 后台顾问可查看并管理全部客户项目
    return all;
  }
  if (session.role === 'client' && session.clientPhone) {
    // 客户仅能看到自己手机号名下的咨询项目，绝对看不到其他客户
    return all.filter(p => p.phone === session.clientPhone);
  }
  // 未登录访客：返回空列表，看不到任何人的隐私项目
  return [];
}

// 校验当前登录用户是否有权访问指定项目
function canAccessProject(project) {
  if (!project) return false;
  const session = getAuthSession();
  if (session.role === 'admin') return true;
  if (session.role === 'client' && session.clientPhone === project.phone) return true;
  return false;
}

// ==================== 项目数据读写 ====================

function getProjects() {
  let list = wx.getStorageSync(STORAGE_KEY);
  if (!list || !Array.isArray(list) || list.length === 0) {
    list = getDefaultProjects();
    wx.setStorageSync(STORAGE_KEY, list);
  }
  return list;
}

function saveProjects(list) {
  wx.setStorageSync(STORAGE_KEY, list);
}

function getProjectById(id) {
  const visible = getVisibleProjects();
  if (visible.length === 0) return null;
  if (id) {
    const found = visible.find(item => item.id === id);
    if (found) return found;
  }
  return visible[0];
}

// 客户下单 / 或顾问在后台为客户新建档案
function createOrder(payload) {
  const list = getProjects();
  const plan = SERVICES_CATALOG.find(s => s.name === payload.type) || SERVICES_CATALOG[0];
  const isPaid = payload.isPaid;
  const payType = payload.payType || 'deposit';

  let paidAmount = 0;
  let payMode = '待顾问初审确认';
  let status = '待初审';
  let currentStep = 1;
  let stepName = '01 资质初筛';

  if (isPaid) {
    paidAmount = payType === 'full' ? plan.price : plan.deposit;
    payMode = payType === 'full' ? `已付全款 ¥${plan.price.toLocaleString()}` : `已付定金 ¥${plan.deposit.toLocaleString()}`;
    status = '服务进行中';
    currentStep = 2;
    stepName = '02 深度问诊';
  }

  const cleanName = (payload.name || '').trim();
  const cleanPhone = (payload.phone || '').trim();
  const nowStr = formatTime(new Date());

  const newOrder = {
    id: 'YY' + Date.now().toString().slice(-8),
    name: cleanName,
    phone: cleanPhone,
    industry: (payload.industry || '未注明行业').trim(),
    problem: (payload.problem || '希望突破客单价瓶颈，重塑奢侈品级高溢价商业模型').trim(),
    type: plan.name,
    planId: plan.id,
    totalPrice: plan.price,
    paidAmount: paidAmount,
    payMode: payMode,
    status: status,
    currentStep: currentStep,
    stepName: stepName,
    consultant: '岩姐 · 首席操盘顾问团队',
    createTime: nowStr,
    updateTime: nowStr,
    metrics: {
      ticketBefore: payload.ticketBefore || '待首次问诊录入',
      ticketAfter: '操盘推进中',
      marginBefore: '待调研',
      marginAfter: '操盘推进中',
      revenueBefore: payload.revenueBefore || '待首次问诊录入',
      revenueAfter: '操盘推进中',
      conversionBefore: '待调研',
      conversionAfter: '操盘推进中',
      highlightSummary: isPaid
        ? '项目已正式立项！岩姐顾问团队已为您开通专属咨询空间，正在为您准备首次 1V1 深度问诊推演清单。'
        : '您的商业咨询申请已提交，顾问团队将在 24 小时内完成资质初筛并与您对接。'
    },
    sessions: [
      {
        sessionId: 'SES-' + Date.now().toString().slice(-5),
        sessionNo: 1,
        title: '首次 1V1 商业诊断与底层问题盘点（排期筹备中）',
        date: nowStr + '（预约排期）',
        mode: '线上预沟通 + 1V1 闭门深度问诊',
        participants: `岩姐首席顾问、${cleanName}`,
        diagnosis: `客户核心诉求：${(payload.problem || '期待突破低客单内卷，打造高溢价商业闭环').trim()}`,
        solution: '首次问诊将重点拆解现有产品线利润结构、目标高净值客群画像，并制定第一阶段高客单破局切入点。',
        consultantNote: isPaid ? '客户已支付立项，优先安排本周核心排期。' : '待顾问与客户确认具体问诊时间。',
        clientRating: 0,
        clientFeedback: '',
        clientFeedbackTime: '',
        consultantReply: '',
        consultantReplyTime: '',
        actionItems: [
          {
            id: 'ACT-' + Date.now().toString().slice(-4) + '1',
            text: '梳理企业近半年主营产品/服务客单价与毛利率现状表',
            done: false,
            feedback: ''
          },
          {
            id: 'ACT-' + Date.now().toString().slice(-4) + '2',
            text: '准备 3 个过往最成功的高客单客户成交案例供问诊拆解',
            done: false,
            feedback: ''
          }
        ]
      }
    ],
    deliverables: [
      {
        delivId: 'DEL-' + Date.now().toString().slice(-5),
        stage: '01 资质初筛',
        title: `《${(payload.industry || '企业').trim()} · 岩姐商业咨询诊前调研与立项说明书》`,
        fileType: 'PDF / 立项清单',
        deliverTime: nowStr,
        status: isPaid ? '待客户验收' : '已生成预案',
        summary: `针对【${plan.name}】定制的诊前准备指南、核心经营数据采集表及 5 步全闭环交付排期计划。`
      }
    ],
    clientReview: ''
  };

  list.unshift(newOrder);
  saveProjects(list);

  // 为该客户手机号初始化或更新专属登录密码
  const passMap = getClientPasswordMap();
  const customPass = (payload.clientPassword || '').trim();
  if (customPass.length >= 4) {
    passMap[cleanPhone] = customPass;
    saveClientPasswordMap(passMap);
  } else if (!passMap[cleanPhone]) {
    passMap[cleanPhone] = defaultPasswordFromPhone(cleanPhone);
    saveClientPasswordMap(passMap);
  }
  newOrder.assignedPassword = getClientPassword(cleanPhone);

  // 如果是客户端下单（非顾问后台代建档），自动将该客户登录绑定到当前会话！
  const currentSession = getAuthSession();
  if (!payload.fromAdmin && currentSession.role !== 'admin') {
    wx.setStorageSync(AUTH_KEY, {
      role: 'client',
      clientPhone: cleanPhone,
      clientName: cleanName,
      staffName: ''
    });
  }

  return newOrder;
}

// 客户补交定金/全款激活订单
function payForProject(projectId, payType = 'deposit') {
  const list = getProjects();
  const idx = list.findIndex(p => p.id === projectId);
  if (idx === -1) return null;

  const proj = list[idx];
  const plan = SERVICES_CATALOG.find(s => s.name === proj.type) || SERVICES_CATALOG[0];
  proj.paidAmount = payType === 'full' ? plan.price : plan.deposit;
  proj.payMode = payType === 'full' ? `已付全款 ¥${plan.price.toLocaleString()}` : `已付定金 ¥${plan.deposit.toLocaleString()}`;
  proj.status = '服务进行中';
  if (proj.currentStep < 2) {
    proj.currentStep = 2;
    proj.stepName = '02 深度问诊';
  }
  proj.updateTime = formatTime(new Date());
  proj.metrics.highlightSummary = '已完成在线支付立项，专属顾问团队已介入并开启 1V1 深度问诊阶段。';
  saveProjects(list);
  return proj;
}

// 客户勾选/取消勾选课后落地行动项，或更新执行反馈
function toggleActionItem(projectId, sessionId, actionId, feedbackText) {
  const list = getProjects();
  const proj = list.find(p => p.id === projectId);
  if (!proj) return null;

  const session = proj.sessions.find(s => s.sessionId === sessionId);
  if (!session) return proj;

  const act = session.actionItems.find(a => a.id === actionId);
  if (act) {
    if (typeof feedbackText === 'string') {
      act.feedback = feedbackText;
      act.done = true;
    } else {
      act.done = !act.done;
    }
    proj.updateTime = formatTime(new Date());
    saveProjects(list);
  }
  return proj;
}

// 客户确认验收某项交付成果
function acceptDeliverable(projectId, delivId) {
  const list = getProjects();
  const proj = list.find(p => p.id === projectId);
  if (!proj) return null;

  const deliv = proj.deliverables.find(d => d.delivId === delivId);
  if (deliv) {
    deliv.status = '已确认验收';
    proj.updateTime = formatTime(new Date());
    saveProjects(list);
  }
  return proj;
}

// 客户提交阶段/结案评价
function saveClientReview(projectId, reviewText) {
  const list = getProjects();
  const proj = list.find(p => p.id === projectId);
  if (!proj) return null;

  proj.clientReview = reviewText.trim();
  proj.updateTime = formatTime(new Date());
  saveProjects(list);
  return proj;
}

// ==================== 顾问端（工作台）操作接口 ====================

function updateProjectStep(projectId, stepNum) {
  const list = getProjects();
  const proj = list.find(p => p.id === projectId);
  if (!proj) return null;

  const stepObj = DELIVERY_STEPS.find(s => s.step === Number(stepNum)) || DELIVERY_STEPS[0];
  proj.currentStep = stepObj.step;
  proj.stepName = `${stepObj.code} ${stepObj.title}`;
  if (stepObj.step === 5) {
    proj.status = '已交付结案';
  } else {
    proj.status = '服务进行中';
  }
  proj.updateTime = formatTime(new Date());
  saveProjects(list);
  return proj;
}

function addConsultSession(projectId, sessionData) {
  const list = getProjects();
  const proj = list.find(p => p.id === projectId);
  if (!proj) return null;

  const nextNo = (proj.sessions ? proj.sessions.length : 0) + 1;
  const nowStr = formatTime(new Date());

  const rawActions = (sessionData.actionsText || '')
    .split(/[\n；;]/)
    .map(s => s.trim())
    .filter(Boolean);

  const actionItems = (rawActions.length > 0 ? rawActions : ['按本次推演方案完成内部团队对齐与首轮落地测试']).map((txt, i) => ({
    id: 'ACT-' + Date.now().toString().slice(-5) + i,
    text: txt,
    done: false,
    feedback: ''
  }));

  const newSession = {
    sessionId: 'SES-' + Date.now().toString().slice(-6),
    sessionNo: nextNo,
    title: sessionData.title || `第 ${nextNo} 次商业闭门深度咨询推演`,
    date: (sessionData.date || '').trim() || nowStr,
    mode: sessionData.mode || '1V1 闭门私董会推演',
    participants: sessionData.participants || `岩姐、${proj.name}及核心高管`,
    diagnosis: sessionData.diagnosis || '',
    solution: sessionData.solution || '',
    consultantNote: sessionData.consultantNote || '请按课后行动清单推进执行，随时在群内及小程序反馈卡点。',
    clientRating: 0,
    clientFeedback: '',
    clientFeedbackTime: '',
    consultantReply: '',
    consultantReplyTime: '',
    actionItems: actionItems
  };

  proj.sessions.unshift(newSession);
  proj.updateTime = nowStr;
  if (proj.status === '待初审') {
    proj.status = '服务进行中';
  }
  saveProjects(list);
  return proj;
}

// 顾问编辑已录入的咨询过程记录（保留客户评分、反馈与行动项已有打卡进度）
function updateConsultSession(projectId, sessionId, sessionData) {
  const list = getProjects();
  const proj = list.find(p => p.id === projectId);
  if (!proj || !Array.isArray(proj.sessions)) return null;

  const session = proj.sessions.find(s => s.sessionId === sessionId);
  if (!session) return proj;

  const nowStr = formatTime(new Date());
  if (typeof sessionData.title === 'string' && sessionData.title.trim()) {
    session.title = sessionData.title.trim();
  }
  if (typeof sessionData.date === 'string' && sessionData.date.trim()) {
    session.date = sessionData.date.trim();
  }
  if (typeof sessionData.mode === 'string') {
    session.mode = sessionData.mode.trim() || session.mode;
  }
  if (typeof sessionData.participants === 'string') {
    session.participants = sessionData.participants.trim() || session.participants;
  }
  if (typeof sessionData.diagnosis === 'string') {
    session.diagnosis = sessionData.diagnosis.trim();
  }
  if (typeof sessionData.solution === 'string') {
    session.solution = sessionData.solution.trim();
  }
  if (typeof sessionData.consultantNote === 'string') {
    session.consultantNote = sessionData.consultantNote.trim();
  }

  if (typeof sessionData.actionsText === 'string') {
    const rawActions = sessionData.actionsText
      .split(/[\n；;]/)
      .map(s => s.trim())
      .filter(Boolean);
    if (rawActions.length > 0) {
      const existing = Array.isArray(session.actionItems) ? session.actionItems : [];
      session.actionItems = rawActions.map((txt, i) => {
        const matched = existing.find(item => item.text === txt);
        if (matched) {
          return matched;
        }
        return {
          id: 'ACT-' + Date.now().toString().slice(-5) + i,
          text: txt,
          done: false,
          feedback: ''
        };
      });
    }
  }

  proj.updateTime = nowStr;
  saveProjects(list);
  return proj;
}

// 客户针对某次咨询录入评分与收获反馈
function saveSessionClientFeedback(projectId, sessionId, payload) {
  const list = getProjects();
  const proj = list.find(p => p.id === projectId);
  if (!proj || !Array.isArray(proj.sessions)) return null;

  const session = proj.sessions.find(s => s.sessionId === sessionId);
  if (!session) return proj;

  const rawRating = Number(payload && payload.rating);
  const clampedRating = Number.isFinite(rawRating)
    ? Math.min(5, Math.max(1, Math.round(rawRating)))
    : 5;
  const nowStr = formatTime(new Date());

  session.clientRating = clampedRating;
  session.clientFeedback = ((payload && payload.feedback) || '').trim();
  session.clientFeedbackTime = nowStr;

  proj.updateTime = nowStr;
  saveProjects(list);
  return proj;
}

// 顾问针对客户单次咨询反馈进行回复
function replySessionFeedback(projectId, sessionId, replyText) {
  const list = getProjects();
  const proj = list.find(p => p.id === projectId);
  if (!proj || !Array.isArray(proj.sessions)) return null;

  const session = proj.sessions.find(s => s.sessionId === sessionId);
  if (!session) return proj;

  const nowStr = formatTime(new Date());
  session.consultantReply = (replyText || '').trim();
  session.consultantReplyTime = nowStr;

  proj.updateTime = nowStr;
  saveProjects(list);
  return proj;
}

function addDeliverable(projectId, delivData) {
  const list = getProjects();
  const proj = list.find(p => p.id === projectId);
  if (!proj) return null;

  const nowStr = formatTime(new Date());
  const newDeliv = {
    delivId: 'DEL-' + Date.now().toString().slice(-6),
    stage: delivData.stage || proj.stepName || '03 全案输出',
    title: delivData.title.startsWith('《') ? delivData.title : `《${delivData.title}》`,
    fileType: delivData.fileType || 'PDF / 核心交付方案',
    deliverTime: nowStr,
    status: '待客户验收',
    summary: delivData.summary || '岩姐咨询团队独家定制输出的高客单商业操盘交付文档。'
  };

  proj.deliverables.unshift(newDeliv);
  proj.updateTime = nowStr;
  saveProjects(list);
  return proj;
}

function updateProjectMetrics(projectId, metricsData) {
  const list = getProjects();
  const proj = list.find(p => p.id === projectId);
  if (!proj) return null;

  proj.metrics = {
    ...proj.metrics,
    ...metricsData
  };
  proj.updateTime = formatTime(new Date());
  saveProjects(list);
  return proj;
}

function resetDemoData() {
  const defaults = getDefaultProjects();
  saveProjects(defaults);
  saveClientPasswordMap({
    '13888888899': '888899',
    '13988885520': '885520'
  });
  return defaults;
}

function formatTime(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

module.exports = {
  ADMIN_PASSCODE,
  SERVICES_CATALOG,
  DELIVERY_STEPS,
  generateRandomPassword,
  getClientPassword,
  setClientPassword,
  changeClientPassword,
  resetClientPassword,
  getAuthSession,
  loginAsClient,
  loginAsAdmin,
  logout,
  getVisibleProjects,
  canAccessProject,
  getProjects,
  getProjectById,
  createOrder,
  payForProject,
  toggleActionItem,
  acceptDeliverable,
  saveClientReview,
  updateProjectStep,
  addConsultSession,
  updateConsultSession,
  saveSessionClientFeedback,
  replySessionFeedback,
  addDeliverable,
  updateProjectMetrics,
  resetDemoData
};
