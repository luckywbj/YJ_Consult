// pc-web/js/api.js
// PC 端交付后台双模数据适配器：
// 1. 微信云开发 HTTP 访问模式（通过 Authorization: Bearer Token 调用 consultApi 云函数）
// 2. 本地高仿真演示模式（localStorage 持久化，打开浏览器即可零依赖体验全部交付流程）
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./workflowTemplate'));
  } else {
    root.YZApi = factory(root.YZWorkflow);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (WF) {
  const root = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : {});
  const LS_CLOUD_URL = 'yz_pc_cloud_http_url_v1';
  const LS_SESSION = 'yz_pc_session_v1';
  const LS_DEMO_DB = 'yz_pc_demo_state_v1';

  function nowStr() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${day} ${hh}:${mm}`;
  }

  function storageGet(k, fallback) {
    try {
      const raw = root.localStorage ? root.localStorage.getItem(k) : null;
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function storageSet(k, v) {
    try {
      if (root.localStorage) {
        root.localStorage.setItem(k, JSON.stringify(v));
      }
    } catch (e) {
      // 忽略存储限制错误
    }
  }

  function storageRemove(k) {
    try {
      if (root.localStorage) root.localStorage.removeItem(k);
    } catch (e) {}
  }

  function buildInitialDemoState() {
    const pipeLi = WF.createInitialCampPipeline({
      pipe_01: { status: 'done', assignee: '林助教', updatedAt: '2026-11-02' },
      pipe_02: { status: 'done', assignee: '博士顾问', updatedAt: '2026-11-04', note: '痛点精准命中团购依赖，当场认可10倍溢价逻辑' },
      pipe_03: { status: 'done', assignee: '岩姐 + 林助教', updatedAt: '2026-11-06', note: '三方一致通过，调性与执行力极佳' },
      pipe_04: { status: 'done', assignee: '林助教', updatedAt: '2026-11-07' },
      pipe_05: { status: 'done', assignee: '林助教', updatedAt: '2026-11-08' },
      pipe_06: { status: 'done', assignee: '林助教', updatedAt: '2026-11-08' },
      pipe_07: { status: 'done', assignee: '林助教', updatedAt: '2026-11-10', note: '按时提交《商业梳理学员版》' },
      pipe_08: { status: 'done', assignee: '岩姐', updatedAt: '2026-11-12', recordingUrl: '腾讯会议回放 #1112' },
      pipe_09: { status: 'done', assignee: '内容助教', updatedAt: '2026-11-16', recordingUrl: '腾讯会议回放 #1116' },
      pipe_10: { status: 'in_progress', assignee: '岩姐 + 博士顾问', note: '2.98万/9.8万黑卡已定案，海报视觉终审中' }
    });

    const cockpitLi = WF.createInitialCockpitProgress({
      doneIds: [
        't_01_01', 't_01_02', 't_01_03', 't_01_04', 't_01_05',
        't_02_01', 't_02_02', 't_02_03', 't_02_04', 't_02_05',
        't_03_01', 't_03_02', 't_03_03',
        't_04_01', 't_04_02', 't_04_03',
        't_05_01', 't_05_02', 't_05_03', 't_06_01', 't_06_02'
      ],
      activeIds: ['t_05_04', 't_05_05', 't_06_04'],
      details: {
        t_02_04: {
          status: 'done',
          updatedAt: '2026-11-12',
          attachment: '复盘截图_李总_商业定位.png',
          rating: { professional: 5, attitude: 5, response: 5, result: 5 },
          reviewText: '💡 阶段服务复盘记录\n日期：2026-11-12\n咨询老师：岩姐\n【我的问题】团购引流越来越卷、毛利低怎么办？\n【过往挑战】399团购拉新全是羊毛党，顾问不敢报高价。\n【我的收获】果断确立2.98万与9.8万年度黑卡体系，当天就开会拍板执行！'
        },
        t_03_03: {
          status: 'done',
          updatedAt: '2026-11-17',
          attachment: '李总新版朋友圈主页截图.jpg',
          rating: { professional: 5, attitude: 5, response: 5, result: 5 },
          reviewText: '朋友圈背景墙与置顶自我介绍改完当晚，就有3位老客主动微信询问黑卡权益！'
        }
      }
    });

    const pipeChen = WF.createInitialCampPipeline({
      pipe_01: { status: 'done', assignee: '林助教' },
      pipe_02: { status: 'done', assignee: '博士顾问' },
      pipe_03: { status: 'done', assignee: '岩姐 + 林助教' },
      pipe_04: { status: 'done', assignee: '林助教' },
      pipe_05: { status: 'done', assignee: '林助教' },
      pipe_06: { status: 'done', assignee: '林助教' },
      pipe_07: { status: 'done', assignee: '林助教' },
      pipe_08: { status: 'done', assignee: '岩姐', recordingUrl: '腾讯会议回放 #1115' },
      pipe_09: { status: 'in_progress', assignee: '内容助教' },
      pipe_10: { status: 'pending', assignee: '岩姐 + 博士顾问' }
    });

    const cockpitChen = WF.createInitialCockpitProgress({
      doneIds: [
        't_01_01', 't_01_02', 't_01_03', 't_01_04', 't_01_05',
        't_02_01', 't_02_02', 't_02_03'
      ],
      activeIds: ['t_02_04', 't_03_01', 't_03_02']
    });

    const pipeLin = WF.createInitialCampPipeline({
      pipe_01: { status: 'done', assignee: '林助教' },
      pipe_02: { status: 'done', assignee: '博士顾问' },
      pipe_03: { status: 'done', assignee: '岩姐 + 林助教' },
      pipe_04: { status: 'done', assignee: '林助教' },
      pipe_05: { status: 'in_progress', assignee: '林助教' },
      pipe_06: { status: 'pending', assignee: '林助教' },
      pipe_07: { status: 'pending', assignee: '林助教' },
      pipe_08: { status: 'pending', assignee: '岩姐' },
      pipe_09: { status: 'pending', assignee: '内容助教' },
      pipe_10: { status: 'pending', assignee: '岩姐 + 博士顾问' }
    });

    const cockpitLin = WF.createInitialCockpitProgress({
      doneIds: ['t_01_01', 't_01_02', 't_01_03'],
      activeIds: ['t_01_04', 't_01_05']
    });

    return {
      adminAccounts: [
        {
          id: 'ADM-001',
          username: 'yanjie',
          name: '岩姐',
          title: '首席操盘顾问',
          password: '888888',
          roleType: 'super',
          status: 'active',
          createTime: '2026-11-01 09:00'
        },
        {
          id: 'ADM-002',
          username: 'assistant',
          name: '林助教',
          title: '资深交付助教',
          password: '666666',
          roleType: 'staff',
          status: 'active',
          createTime: '2026-11-05 10:00'
        }
      ],
      clientPasswords: {
        '13888888899': '888899',
        '13966668888': '668888',
        '13699997777': '997777'
      },
      projects: [
        {
          id: 'YY2026111001',
          name: '李总',
          phone: '13888888899',
          industry: '高端私域美业（轻医美连锁）',
          problem: '门店长期依赖低价团购引流，顾问不敢报高价，高净值客户留存与升单困难。',
          type: 'IP实战陪跑营 · 年度顾问全案',
          totalPrice: 128000,
          paidAmount: 128000,
          payMode: '已付全款 · 正式立项',
          status: '服务进行中',
          currentStep: 4,
          stepName: '04 陪跑落地',
          consultant: '岩姐 · 首席操盘顾问团队',
          createTime: '2026-11-10 14:30',
          updateTime: '2026-11-26 18:20',
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
          campPipeline: pipeLi,
          cockpitProgress: cockpitLi,
          sessions: [
            {
              sessionId: 'SES-102',
              sessionNo: 2,
              title: '奢侈品成交话术植入与首场闭门私享会发售彩排',
              date: '2026-11-18 14:00 - 17:30',
              mode: '腾讯会议 + 核心顾问1V1通关演练',
              participants: '岩姐、李总、门店店长及6名高级美学顾问',
              diagnosis: '销售顾问在报出 2.98 万以上价格时心理发虚，习惯性主动打折让利，缺乏“顾问式价值探寻”与情绪价值铺垫能力。',
              solution: '导入「3阶奢侈品价值锚定话术」，将推销单次项目转化为“定制年度年轻态身份方案”，现场逐一通关考核 6 名核心顾问，并敲定周六闭门沙龙促单动线。',
              consultantNote: '团队执行力极强，店长在模拟演练后第二天即用新话术拿下了首单 2.98万 试水成交！',
              clientRating: 5,
              clientFeedback: '按新话术演练当周就成交了2单2.98万黑卡，顾问们再也不怯场报低价了！',
              clientFeedbackTime: '2026-11-20 19:40',
              consultantReply: '',
              consultantReplyTime: '',
              actionItems: [
                { id: 'ACT-201', text: '6名高定顾问完成 1V1 谈单剧本通关演练录音打卡', done: true, feedback: '全员已通关，店长已成功开出首单 2.98万！' },
                { id: 'ACT-202', text: '定向邀约 20 位 A 类种子老客参加本周六「东方奢美闭门品鉴沙龙」', done: false, feedback: '目前已确认到场 16 位。' }
              ]
            },
            {
              sessionId: 'SES-101',
              sessionNo: 1,
              title: '顶层商业模式诊断与低毛利引流品砍除推演',
              date: '2026-11-12 14:00 - 17:30',
              mode: '上海静安私董会所 · 线下闭门推演',
              participants: '岩姐、李总（创始人）、运营总监',
              diagnosis: '门店过度依赖 399/699 团购引流，真正有消费力的高净值客户缺乏专属升单阶梯，净利率不足 12%。',
              solution: '果断砍掉 70% 低效走量耗品，重构「2.98万年度美学私享卡」与「9.8万家族高定黑卡」双层高客单产品矩阵。',
              consultantNote: '创始人认知升级很快，当场拍板转向私域高客单深耕。',
              clientRating: 5,
              clientFeedback: '第一次跟岩姐做完底层商业模式拆解，一下看清了之前忙着低价团购却不赚钱的死结！',
              clientFeedbackTime: '2026-11-12 20:15',
              consultantReply: '收到李总反馈！执行果断就是核心竞争力，接下来重点盯好 TOP 50 老客分级与 VIP 问诊室落地细节。',
              consultantReplyTime: '2026-11-12 20:42',
              actionItems: [
                { id: 'ACT-101', text: '梳理近半年消费满 1 万以上的 TOP 50 种子客户资产档案', done: true, feedback: '已全部建表分级完成' }
              ]
            }
          ],
          deliverables: [
            {
              delivId: 'DEL-102',
              stage: '03 全案输出',
              title: '《轻医美高客单产品价格体系与奢美黑卡权益设计方案》',
              fileType: 'PPT / 产品全案',
              fileName: '轻医美黑卡全案_v2.pptx',
              fileUrl: '',
              deliverTime: '2026-11-15 16:00',
              status: '已确认验收',
              summary: '完整重构了从引流体验卡到 2.98 万年度私享卡、9.8 万家族黑卡的三层利润结构。'
            }
          ]
        },
        {
          id: 'YY2026111502',
          name: '陈老师',
          phone: '13966668888',
          industry: '财经知识 IP（50万粉丝）',
          problem: '长期靠 199 元录播课变现天花板明显，缺乏年度私董高客单体系与发售剧本。',
          type: '1对1 商业闭门深度私董会 + 陪跑',
          totalPrice: 69800,
          paidAmount: 69800,
          payMode: '已付全款 · 正式立项',
          status: '服务进行中',
          currentStep: 3,
          stepName: '03 全案输出',
          consultant: '岩姐 · 首席商业操盘手',
          createTime: '2026-11-15 11:00',
          updateTime: '2026-11-25 16:40',
          metrics: {
            ticketBefore: '¥199',
            ticketAfter: '¥49,800',
            marginBefore: '35%',
            marginAfter: '88%',
            revenueBefore: '28万/月',
            revenueAfter: '125万/首期',
            conversionBefore: '1.8%',
            conversionAfter: '26.5%',
            highlightSummary: '确立“企业战略财务私董会（4.98万/席）”新定位，正在推进朋友圈四件套展示面升级。'
          },
          campPipeline: pipeChen,
          cockpitProgress: cockpitChen,
          sessions: [
            {
              sessionId: 'SES-201',
              sessionNo: 1,
              title: 'IP高价值定位梳理：从卖低价课转向企业战略财务私董陪跑',
              date: '2026-11-16 15:00 - 17:00',
              mode: '腾讯会议 1V1 闭门梳理',
              participants: '岩姐、陈老师、内容合伙人',
              diagnosis: '粉丝中企业主占比达 62%，却只卖 199 录播课，客群价值严重错配。',
              solution: '砍除泛知识杂课，聚焦企业现金流与合规增长痛点，设定 4.98 万年度私董核心爆品。',
              consultantNote: '请本周按模版完成朋友圈背景墙与置顶介绍升级。',
              clientRating: 0,
              clientFeedback: '',
              clientFeedbackTime: '',
              consultantReply: '',
              consultantReplyTime: '',
              actionItems: [
                { id: 'ACT-301', text: '筛选近一年私信询问过“企业定制内训”的 30 位高净值粉丝名单', done: true, feedback: '已拉出38位意向企业主名单' }
              ]
            }
          ],
          deliverables: [
            {
              delivId: 'DEL-201',
              stage: '02 深度问诊',
              title: '《财经IP高价值定位与尖刀产品定向说明书》',
              fileType: 'PDF / 定位全案',
              fileName: '陈老师IP定位全案.pdf',
              fileUrl: '',
              deliverTime: '2026-11-17 14:20',
              status: '待客户验收',
              summary: '明确核心人设标签、高净值客群切入话术与 4.98 万私董会服务清单。'
            }
          ]
        },
        {
          id: 'YY2026111903',
          name: '林女士',
          phone: '13699997777',
          industry: '高定珠宝与私人礼赠工作室',
          problem: '代工出身缺乏自主高端品牌溢价，客户只问克重工费，难以做高毛利定制。',
          type: '高客单商业操盘全案',
          totalPrice: 128000,
          paidAmount: 128000,
          payMode: '已付全款 · 正式立项',
          status: '服务进行中',
          currentStep: 2,
          stepName: '02 深度问诊',
          consultant: '岩姐 · 林助教协同',
          createTime: '2026-11-22 09:40',
          updateTime: '2026-11-27 10:15',
          metrics: {
            ticketBefore: '¥3,800',
            ticketAfter: '¥58,000',
            marginBefore: '16%',
            marginAfter: '64%',
            revenueBefore: '35万/月',
            revenueAfter: '筹备首轮发售中',
            conversionBefore: '6%',
            conversionAfter: '筹备首轮发售中',
            highlightSummary: '已完成入营录取仪式与商业梳理前置准备，即将进入 1V1 定位梳理会议。'
          },
          campPipeline: pipeLin,
          cockpitProgress: cockpitLin,
          sessions: [
            {
              sessionId: 'SES-301',
              sessionNo: 1,
              title: '入营建档与商业梳理前置动员',
              date: '2026-11-23 10:30',
              mode: '线上预沟通 + 驾驶舱激活引导',
              participants: '林助教、林女士',
              diagnosis: '待完成《商业梳理学员版》表格填报后进入首次 1V1 深度问诊。',
              solution: '优先完成 01 入学准备与群内自我介绍，领取驾驶舱资料后约见岩姐做 1V1 定位梳理。',
              consultantNote: '学员已领取驾驶舱权限，自我介绍非常精彩，已在群内获多位同班老板互动。',
              clientRating: 0,
              clientFeedback: '',
              clientFeedbackTime: '',
              consultantReply: '',
              consultantReplyTime: '',
              actionItems: [
                { id: 'ACT-401', text: '填写提交《个人品牌商业梳理（学员版）》表格', done: false, feedback: '' }
              ]
            }
          ],
          deliverables: []
        }
      ],
      visitors: [
        { openid: 'oDemo_1001', shortId: '9A2F', viewerName: '张总 · 上海轻医美', viewerRole: 'guest', viewCount: 6, shareCount: 2, inviteCount: 3, wechatClickCount: 1, phoneClickCount: 0, lastVisitTime: '2026-11-28 15:20' },
        { openid: 'oDemo_1002', shortId: '4C18', viewerName: '王院长 · 杭州奢美馆', viewerRole: 'guest', viewCount: 4, shareCount: 1, inviteCount: 1, wechatClickCount: 1, phoneClickCount: 1, lastVisitTime: '2026-11-28 11:05' },
        { openid: 'oDemo_1003', shortId: '7B09', viewerName: '周先生 · 财税顾问IP', viewerRole: 'client', viewCount: 9, shareCount: 3, inviteCount: 2, wechatClickCount: 0, phoneClickCount: 0, lastVisitTime: '2026-11-27 19:42' }
      ],
      brochure: {
        title: '岩值商业咨询 · 公司简介与高客单操盘体系',
        views: 2512,
        shares: 433
      }
    };
  }

  function getDemoDb() {
    let state = storageGet(LS_DEMO_DB, null);
    if (!state || !Array.isArray(state.projects) || !Array.isArray(state.adminAccounts)) {
      state = buildInitialDemoState();
      storageSet(LS_DEMO_DB, state);
    }
    return state;
  }

  function saveDemoDb(state) {
    storageSet(LS_DEMO_DB, state);
  }

  function getCloudUrl() {
    const u = storageGet(LS_CLOUD_URL, '');
    return typeof u === 'string' ? u.trim() : '';
  }

  function setCloudUrl(url) {
    const clean = String(url || '').trim();
    if (clean) {
      storageSet(LS_CLOUD_URL, clean);
    } else {
      storageRemove(LS_CLOUD_URL);
    }
    return clean;
  }

  function getSession() {
    return storageGet(LS_SESSION, null);
  }

  function setSession(session) {
    if (session) storageSet(LS_SESSION, session);
    else storageRemove(LS_SESSION);
  }

  let localProxyInfo = {
    configured: false,
    appId: '',
    cloudEnv: '',
    functionName: '',
    endpoint: '/api/cloud'
  };

  async function detectLocalProxy() {
    if (!root.fetch) return localProxyInfo;
    try {
      const resp = await root.fetch('/api/proxy-status', { method: 'GET' });
      if (!resp.ok) return localProxyInfo;
      const json = await resp.json();
      if (json && json.ok) {
        localProxyInfo = {
          configured: !!json.configured,
          appId: json.appId || '',
          cloudEnv: json.cloudEnv || '',
          functionName: json.functionName || 'consultApi',
          endpoint: json.endpoint || '/api/cloud'
        };
      }
    } catch (e) {
      // 非 Node 本地服务器（如静态托管或 file://）时保持默认
    }
    return localProxyInfo;
  }

  function getEffectiveCloudUrl() {
    const manual = getCloudUrl();
    if (manual) return manual;
    if (localProxyInfo.configured) return localProxyInfo.endpoint || '/api/cloud';
    return '';
  }

  function isUsingLocalProxy() {
    return !getCloudUrl() && !!localProxyInfo.configured;
  }

  function getProxyInfo() {
    return { ...localProxyInfo };
  }

  function getMode() {
    return getEffectiveCloudUrl() ? 'cloud' : 'demo';
  }

  async function callCloudHttp(action, payload = {}, requireAuth = true) {
    const url = getEffectiveCloudUrl();
    if (!url) {
      throw new Error('未配置微信云开发连接地址');
    }
    const headers = { 'Content-Type': 'application/json' };
    if (requireAuth) {
      const sess = getSession();
      if (!sess || !sess.token) {
        throw new Error('未登录或登录状态失效');
      }
      headers.Authorization = `Bearer ${sess.token}`;
    }

    const resp = await root.fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action, ...payload })
    });
    const text = await resp.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch (e) {
      throw new Error(`云函数返回非 JSON 内容 (HTTP ${resp.status})`);
    }
    if (resp.status === 401) {
      setSession(null);
      const err = new Error((json && json.msg) || '登录已过期，请重新登录');
      err.code = 401;
      throw err;
    }
    if (!json || !json.ok) {
      throw new Error((json && json.msg) || `请求失败 (${resp.status})`);
    }
    return json;
  }

  async function testCloudHealth(urlToTest) {
    const targetUrl = String(urlToTest || getEffectiveCloudUrl()).trim();
    if (!targetUrl) {
      return { ok: false, msg: '请先输入云函数 HTTP 访问地址或配置本地 .env.local 代理' };
    }
    try {
      const resp = await root.fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pcHealth' })
      });
      const json = await resp.json();
      if (json && json.ok) {
        return { ok: true, msg: `连接成功（云端服务时间：${json.time || 'OK'}）` };
      }
      return { ok: false, msg: (json && json.msg) || '云函数返回异常状态' };
    } catch (err) {
      return { ok: false, msg: err.message || '网络请求失败，请确认已开启 CORS 与 HTTP 访问服务' };
    }
  }

  async function login(username, password) {
    const cleanUser = String(username || '').trim();
    const cleanPass = String(password || '').trim();
    if (!cleanUser || !cleanPass) {
      return { ok: false, msg: '请输入顾问账号与密码' };
    }

    if (getMode() === 'cloud') {
      try {
        const res = await callCloudHttp('pcLogin', { username: cleanUser, password: cleanPass }, false);
        const sess = { mode: 'cloud', token: res.token, user: res.user };
        setSession(sess);
        return { ok: true, session: sess };
      } catch (err) {
        return { ok: false, msg: err.message || '云端登录失败' };
      }
    }

    const db = getDemoDb();
    const acc = db.adminAccounts.find(
      a => a.username.toLowerCase() === cleanUser.toLowerCase() && a.password === cleanPass
    );
    if (!acc) return { ok: false, msg: '演示账号或密码错误（默认 yanjie/888888 或 assistant/666666）' };
    if (acc.status !== 'active') return { ok: false, msg: '该顾问账号已被停用' };
    const safeUser = {
      id: acc.id,
      username: acc.username,
      name: acc.name,
      title: acc.title,
      roleType: acc.roleType,
      status: acc.status
    };
    const sess = { mode: 'demo', token: 'demo_token_' + acc.id, user: safeUser };
    setSession(sess);
    return { ok: true, session: sess };
  }

  function logout() {
    setSession(null);
  }

  async function loadDashboard() {
    if (getMode() === 'cloud') {
      return await callCloudHttp('pcDashboard', {}, true);
    }
    const db = getDemoDb();
    const sess = getSession();
    const visitors = db.visitors || [];
    let totalViews = 0;
    let totalShares = 0;
    let totalInvites = 0;
    let totalLeads = 0;
    visitors.forEach(v => {
      totalViews += Number(v.viewCount) || 0;
      totalShares += Number(v.shareCount) || 0;
      totalInvites += Number(v.inviteCount) || 0;
      if ((v.wechatClickCount || 0) > 0 || (v.phoneClickCount || 0) > 0) totalLeads += 1;
    });
    return {
      ok: true,
      user: sess ? sess.user : null,
      projects: db.projects,
      adminAccounts: db.adminAccounts.map(a => ({ ...a, password: '******' })),
      clientPasswords: db.clientPasswords,
      brochure: db.brochure,
      visitorStats: {
        totalVisitors: visitors.length,
        totalViews,
        totalShares,
        totalInvites,
        totalLeads
      },
      visitors
    };
  }

  async function createProject(payload) {
    const campPipeline = WF.createInitialCampPipeline({
      pipe_01: { status: 'done', assignee: '助理', updatedAt: nowStr().slice(0, 10) },
      pipe_02: { status: 'done', assignee: '博士顾问', updatedAt: nowStr().slice(0, 10) },
      pipe_03: { status: 'done', assignee: '三方联审', updatedAt: nowStr().slice(0, 10) },
      pipe_04: { status: 'in_progress', assignee: '班主任' }
    });
    const cockpitProgress = WF.createInitialCockpitProgress({ activeIds: ['t_01_01'] });

    if (getMode() === 'cloud') {
      return await callCloudHttp('pcCreateProject', {
        ...payload,
        campPipeline,
        cockpitProgress
      });
    }

    const db = getDemoDb();
    const cleanPhone = String(payload.phone || '').trim();
    const pass = String(payload.clientPassword || '').trim() || (cleanPhone.length >= 6 ? cleanPhone.slice(-6) : '123456');
    const stepNum = Number(payload.currentStep) || 2;
    const stepObj = WF.DELIVERY_STEPS.find(s => s.step === stepNum) || WF.DELIVERY_STEPS[1];
    const now = nowStr();
    const totalPrice = Number(payload.totalPrice) || 128000;
    const sess = getSession();
    const staffName = (sess && sess.user && sess.user.name) || '岩姐';

    const newProj = {
      id: 'YY' + Date.now().toString().slice(-8),
      name: String(payload.name || '').trim(),
      phone: cleanPhone,
      industry: String(payload.industry || '').trim(),
      problem: String(payload.problem || '期待突破高客单定价与发售转化瓶颈').trim(),
      type: String(payload.type || 'IP实战陪跑营 · 年度顾问全案').trim(),
      totalPrice,
      paidAmount: totalPrice,
      payMode: `已付全款 ¥${totalPrice.toLocaleString()}`,
      status: stepObj.step === 5 ? '已交付结案' : '服务进行中',
      currentStep: stepObj.step,
      stepName: `${stepObj.code} ${stepObj.title}`,
      consultant: `${staffName} · 岩值咨询操盘团队`,
      createTime: now,
      updateTime: now,
      metrics: {
        ticketBefore: payload.ticketBefore || '待首次梳理',
        ticketAfter: '陪跑推进中',
        marginBefore: '待调研',
        marginAfter: '陪跑推进中',
        revenueBefore: payload.revenueBefore || '待首次梳理',
        revenueAfter: '陪跑推进中',
        conversionBefore: '待调研',
        conversionAfter: '陪跑推进中',
        highlightSummary: `已在 PC 交付后台完成【${payload.name}】建档立项，正式启动 IP 实战陪跑营流程。`
      },
      campPipeline,
      cockpitProgress,
      sessions: [
        {
          sessionId: 'SES-' + Date.now().toString().slice(-5),
          sessionNo: 1,
          title: 'IP实战陪跑营入营审定与商业梳理排期筹备',
          date: now,
          mode: '线上预沟通 + 1V1 闭门问诊',
          participants: `${staffName}、${payload.name}`,
          diagnosis: `学员核心诉求：${payload.problem || '建立高价值个人品牌定位与爆品变现闭环'}`,
          solution: '完成【入学准备】及《商业梳理（学员版）》表格，随后安排 1V1 定位梳理会议。',
          consultantNote: 'PC 端已立项并开通交付空间。',
          clientRating: 0,
          clientFeedback: '',
          clientFeedbackTime: '',
          consultantReply: '',
          consultantReplyTime: '',
          actionItems: [
            { id: 'ACT-' + Date.now().toString().slice(-4) + '1', text: '完善学籍档案并完成学员群自我介绍', done: false, feedback: '' },
            { id: 'ACT-' + Date.now().toString().slice(-4) + '2', text: '填写上传《个人品牌商业梳理（学员版）》', done: false, feedback: '' }
          ]
        }
      ],
      deliverables: [
        {
          delivId: 'DEL-' + Date.now().toString().slice(-5),
          stage: '01 资质初筛',
          title: `《${payload.industry} · 入营录取与 12 板块陪跑说明书》`,
          fileType: 'PDF / 立项清单',
          deliverTime: now,
          status: '待客户验收',
          summary: '包含入营准备指南、商业梳理采集表及双线陪跑节奏计划。'
        }
      ]
    };

    db.projects.unshift(newProj);
    db.clientPasswords[cleanPhone] = pass;
    saveDemoDb(db);
    return { ok: true, project: newProj, assignedPassword: pass };
  }

  async function updateProject(projectId, patch) {
    if (getMode() === 'cloud') {
      return await callCloudHttp('pcUpdateProject', { projectId, patch });
    }
    const db = getDemoDb();
    const idx = db.projects.findIndex(p => p.id === projectId);
    if (idx === -1) throw new Error('项目不存在');
    const cur = { ...db.projects[idx], ...patch, updateTime: nowStr() };
    if (patch.currentStep !== undefined) {
      const st = WF.DELIVERY_STEPS.find(s => s.step === Number(patch.currentStep));
      if (st) {
        cur.currentStep = st.step;
        cur.stepName = `${st.code} ${st.title}`;
        if (!patch.status) cur.status = st.step === 5 ? '已交付结案' : '服务进行中';
      }
    }
    db.projects[idx] = cur;
    saveDemoDb(db);
    return { ok: true, project: cur };
  }

  async function addSession(projectId, session) {
    if (getMode() === 'cloud') {
      return await callCloudHttp('pcAddSession', { projectId, session });
    }
    const db = getDemoDb();
    const proj = db.projects.find(p => p.id === projectId);
    if (!proj) throw new Error('项目不存在');
    if (!Array.isArray(proj.sessions)) proj.sessions = [];
    const sess = getSession();
    const staffName = (sess && sess.user && sess.user.name) || '岩姐';
    const rawActions = String(session.actionsText || '').split(/[\n；;]/).map(s => s.trim()).filter(Boolean);
    const actionItems = (rawActions.length ? rawActions : ['按本次推演完成首轮落地测试']).map((text, i) => ({
      id: 'ACT-' + Date.now().toString().slice(-5) + i,
      text,
      done: false,
      feedback: ''
    }));
    const newSes = {
      sessionId: 'SES-' + Date.now().toString().slice(-6),
      sessionNo: proj.sessions.length + 1,
      title: session.title.trim(),
      date: (session.date || '').trim() || nowStr(),
      mode: (session.mode || '').trim() || '腾讯会议 1V1 深度梳理',
      participants: (session.participants || '').trim() || `${staffName}、${proj.name}`,
      diagnosis: session.diagnosis.trim(),
      solution: session.solution.trim(),
      consultantNote: (session.consultantNote || '').trim() || '请按课后行动清单推进落地。',
      clientRating: 0,
      clientFeedback: '',
      clientFeedbackTime: '',
      consultantReply: '',
      consultantReplyTime: '',
      actionItems
    };
    proj.sessions.unshift(newSes);
    proj.updateTime = nowStr();
    saveDemoDb(db);
    return { ok: true, project: proj };
  }

  async function updateSession(projectId, sessionId, session) {
    if (getMode() === 'cloud') {
      return await callCloudHttp('pcUpdateSession', { projectId, sessionId, session });
    }
    const db = getDemoDb();
    const proj = db.projects.find(p => p.id === projectId);
    if (!proj) throw new Error('项目不存在');
    const ses = (proj.sessions || []).find(s => s.sessionId === sessionId);
    if (!ses) throw new Error('咨询场次不存在');
    ['title', 'date', 'mode', 'participants', 'diagnosis', 'solution', 'consultantNote'].forEach(k => {
      if (typeof session[k] === 'string' && (k === 'consultantNote' || session[k].trim())) {
        ses[k] = session[k].trim();
      }
    });
    if (typeof session.actionsText === 'string') {
      const rawActions = session.actionsText.split(/[\n；;]/).map(s => s.trim()).filter(Boolean);
      if (rawActions.length > 0) {
        const existing = ses.actionItems || [];
        ses.actionItems = rawActions.map((txt, i) => {
          const hit = existing.find(a => a.text === txt);
          return hit || { id: 'ACT-' + Date.now().toString().slice(-5) + i, text: txt, done: false, feedback: '' };
        });
      }
    }
    proj.updateTime = nowStr();
    saveDemoDb(db);
    return { ok: true, project: proj };
  }

  async function replySession(projectId, sessionId, replyText) {
    if (getMode() === 'cloud') {
      return await callCloudHttp('pcReplySession', { projectId, sessionId, replyText });
    }
    const db = getDemoDb();
    const proj = db.projects.find(p => p.id === projectId);
    if (!proj) throw new Error('项目不存在');
    const ses = (proj.sessions || []).find(s => s.sessionId === sessionId);
    if (!ses) throw new Error('场次不存在');
    ses.consultantReply = String(replyText || '').trim();
    ses.consultantReplyTime = nowStr();
    proj.updateTime = nowStr();
    saveDemoDb(db);
    return { ok: true, project: proj };
  }

  async function addDeliverable(projectId, deliverable) {
    if (getMode() === 'cloud') {
      return await callCloudHttp('pcAddDeliverable', { projectId, deliverable });
    }
    const db = getDemoDb();
    const proj = db.projects.find(p => p.id === projectId);
    if (!proj) throw new Error('项目不存在');
    if (!Array.isArray(proj.deliverables)) proj.deliverables = [];
    const title = String(deliverable.title || '').trim();
    const newDeliv = {
      delivId: 'DEL-' + Date.now().toString().slice(-6),
      stage: String(deliverable.stage || proj.stepName || '03 全案输出'),
      title: title.startsWith('《') ? title : `《${title}》`,
      fileType: String(deliverable.fileType || 'PDF / 全案交付文档'),
      fileName: String(deliverable.fileName || ''),
      fileUrl: String(deliverable.fileUrl || ''),
      deliverTime: nowStr(),
      status: '待客户验收',
      summary: String(deliverable.summary || '岩值咨询定制化交付成果')
    };
    proj.deliverables.unshift(newDeliv);
    proj.updateTime = nowStr();
    saveDemoDb(db);
    return { ok: true, project: proj };
  }

  async function updateDeliverable(projectId, delivId, patch) {
    if (getMode() === 'cloud') {
      return await callCloudHttp('pcUpdateDeliverable', { projectId, delivId, patch });
    }
    const db = getDemoDb();
    const proj = db.projects.find(p => p.id === projectId);
    if (!proj) throw new Error('项目不存在');
    const d = (proj.deliverables || []).find(x => x.delivId === delivId);
    if (!d) throw new Error('交付物不存在');
    Object.assign(d, patch);
    proj.updateTime = nowStr();
    saveDemoDb(db);
    return { ok: true, project: proj };
  }

  async function manageAccounts(op, payload = {}) {
    if (getMode() === 'cloud') {
      return await callCloudHttp('pcManageAccounts', { op, ...payload });
    }
    const db = getDemoDb();
    const sess = getSession();
    if (!sess || !sess.user || sess.user.roleType !== 'super') {
      throw new Error('仅主管理员可执行账号管理');
    }
    if (op === 'addAdmin') {
      const username = String(payload.username || '').trim();
      const name = String(payload.name || '').trim();
      const password = String(payload.password || '').trim();
      if (username.length < 3 || !/^[a-zA-Z0-9_-]+$/.test(username)) {
        throw new Error('账号至少 3 位且仅限字母/数字/_/-');
      }
      if (!name || password.length < 4) throw new Error('请填写姓名并设置至少 4 位密码');
      if (db.adminAccounts.some(a => a.username.toLowerCase() === username.toLowerCase())) {
        throw new Error(`账号 ${username} 已存在`);
      }
      db.adminAccounts.push({
        id: 'ADM-' + Date.now().toString().slice(-6),
        username,
        name,
        title: String(payload.title || '资深交付助教').trim(),
        password,
        roleType: payload.roleType === 'super' ? 'super' : 'staff',
        status: 'active',
        createTime: nowStr()
      });
      saveDemoDb(db);
      return { ok: true, adminAccounts: db.adminAccounts };
    }
    if (op === 'toggleAdminStatus') {
      const acc = db.adminAccounts.find(a => a.id === payload.id);
      if (!acc) throw new Error('账号不存在');
      if (acc.id === sess.user.id) throw new Error('不能停用当前登录主账号');
      acc.status = acc.status === 'active' ? 'disabled' : 'active';
      saveDemoDb(db);
      return { ok: true, adminAccounts: db.adminAccounts };
    }
    if (op === 'deleteAdmin') {
      if (payload.id === sess.user.id) throw new Error('不能删除当前登录主账号');
      db.adminAccounts = db.adminAccounts.filter(a => a.id !== payload.id);
      saveDemoDb(db);
      return { ok: true, adminAccounts: db.adminAccounts };
    }
    if (op === 'resetClientPassword') {
      const phone = String(payload.phone || '').trim();
      const newPass = String(payload.newPassword || '').trim() || String(Math.floor(100000 + Math.random() * 900000));
      if (!phone || newPass.length < 4) throw new Error('手机号与新密码格式不正确');
      db.clientPasswords[phone] = newPass;
      saveDemoDb(db);
      return { ok: true, phone, password: newPass, clientPasswords: db.clientPasswords };
    }
    throw new Error('不支持的操作: ' + op);
  }

  function resetDemoState() {
    const fresh = buildInitialDemoState();
    saveDemoDb(fresh);
    return fresh;
  }

  return {
    getCloudUrl,
    setCloudUrl,
    detectLocalProxy,
    getEffectiveCloudUrl,
    isUsingLocalProxy,
    getProxyInfo,
    getSession,
    setSession,
    getMode,
    testCloudHealth,
    login,
    logout,
    loadDashboard,
    createProject,
    updateProject,
    addSession,
    updateSession,
    replySession,
    addDeliverable,
    updateDeliverable,
    manageAccounts,
    resetDemoState
  };
});
