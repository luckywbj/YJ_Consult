// cloudfunctions/consultApi/index.js
const crypto = require('crypto');
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

const STATE_COLLECTION = 'yj_app_state';
const VISITS_COLLECTION = 'yj_brochure_visits';
const ALLOWED_STATE_KEYS = [
  'projects',
  'admin_accounts',
  'client_passwords',
  'brochure_config'
];

const PC_TOKEN_SECRET = process.env.PC_TOKEN_SECRET || 'yanzhi_consult_pc_secret_2026';
const PC_TOKEN_TTL_MS = 7 * 24 * 3600 * 1000;

const CORS_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

const DELIVERY_STEPS = [
  { step: 1, code: '01', title: '资质初筛' },
  { step: 2, code: '02', title: '深度问诊' },
  { step: 3, code: '03', title: '全案输出' },
  { step: 4, code: '04', title: '陪跑落地' },
  { step: 5, code: '05', title: '复盘迭代' }
];

function getDefaultAdminAccounts() {
  return [
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
  ];
}

function formatNow() {
  const now = new Date(Date.now() + 8 * 3600 * 1000);
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  const hh = String(now.getUTCHours()).padStart(2, '0');
  const mm = String(now.getUTCMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

function wrapResponse(isHttp, payload, statusCode = 200) {
  if (!isHttp) return payload;
  return {
    isBase64Encoded: false,
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(payload)
  };
}

function getHeaderInsensitive(headers, name) {
  if (!headers || typeof headers !== 'object') return '';
  const target = name.toLowerCase();
  const key = Object.keys(headers).find(k => k.toLowerCase() === target);
  return key ? String(headers[key] || '') : '';
}

function parseIncomingEvent(rawEvent) {
  const evt = rawEvent || {};
  const isHttp = !!(
    evt.httpMethod ||
    (evt.requestContext && evt.requestContext.http)
  );
  const method = (
    evt.httpMethod ||
    (evt.requestContext && evt.requestContext.http && evt.requestContext.http.method) ||
    'POST'
  ).toUpperCase();

  let payload = {};
  if (isHttp) {
    if (evt.queryStringParameters && typeof evt.queryStringParameters === 'object') {
      payload = { ...evt.queryStringParameters };
    }
    if (evt.body) {
      let rawBody = evt.body;
      if (typeof rawBody === 'string') {
        if (evt.isBase64Encoded) {
          rawBody = Buffer.from(rawBody, 'base64').toString('utf8');
        }
        try {
          const parsed = JSON.parse(rawBody);
          if (parsed && typeof parsed === 'object') {
            payload = { ...payload, ...parsed };
          }
        } catch (e) {
          // 非 JSON 请求体保持空对象
        }
      } else if (typeof rawBody === 'object') {
        payload = { ...payload, ...rawBody };
      }
    }
    const authHeader = getHeaderInsensitive(evt.headers, 'authorization');
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      payload._token = authHeader.slice(7).trim();
    } else if (payload.token) {
      payload._token = String(payload.token).trim();
    }
  } else {
    payload = { ...evt };
    if (payload.token) {
      payload._token = String(payload.token).trim();
    }
  }

  return { isHttp, method, payload };
}

function signPcToken(account) {
  const data = {
    id: account.id,
    username: account.username,
    roleType: account.roleType,
    exp: Date.now() + PC_TOKEN_TTL_MS
  };
  const encoded = Buffer.from(JSON.stringify(data), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', PC_TOKEN_SECRET)
    .update(encoded)
    .digest('hex');
  return `${encoded}.${sig}`;
}

function sanitizeAccount(acc) {
  if (!acc) return null;
  return {
    id: acc.id,
    username: acc.username,
    name: acc.name,
    title: acc.title,
    roleType: acc.roleType,
    status: acc.status,
    createTime: acc.createTime
  };
}

async function ensureCollection(name) {
  try {
    await db.createCollection(name);
  } catch (err) {
    // 集合已存在时忽略错误
  }
}

async function getStateDoc(key) {
  try {
    const res = await db.collection(STATE_COLLECTION).doc(key).get();
    return res && res.data ? res.data.value : null;
  } catch (err) {
    return null;
  }
}

async function setStateDoc(key, value) {
  await ensureCollection(STATE_COLLECTION);
  await db.collection(STATE_COLLECTION).doc(key).set({
    data: {
      value,
      updatedAt: formatNow(),
      updatedTs: Date.now()
    }
  });
}

async function getAdminAccountsFromDb() {
  let list = await getStateDoc('admin_accounts');
  if (!Array.isArray(list) || list.length === 0) {
    list = getDefaultAdminAccounts();
    await setStateDoc('admin_accounts', list);
  }
  return list;
}

async function verifyPcToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return { ok: false, statusCode: 401, msg: '未登录或登录凭证缺失，请先登录' };
  }
  const parts = token.split('.');
  if (parts.length !== 2) {
    return { ok: false, statusCode: 401, msg: '登录凭证格式无效' };
  }
  const [encoded, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', PC_TOKEN_SECRET)
    .update(encoded)
    .digest('hex');

  const sigBuf = Buffer.from(sig, 'utf8');
  const expBuf = Buffer.from(expectedSig, 'utf8');
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return { ok: false, statusCode: 401, msg: '登录凭证签名校验失败' };
  }

  let claims = null;
  try {
    claims = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  } catch (e) {
    return { ok: false, statusCode: 401, msg: '登录凭证已损坏' };
  }
  if (!claims || !claims.exp || claims.exp < Date.now()) {
    return { ok: false, statusCode: 401, msg: '登录状态已过期，请重新登录' };
  }

  const accounts = await getAdminAccountsFromDb();
  const matched = accounts.find(
    a => (a.id === claims.id || a.username === claims.username) && a.status === 'active'
  );
  if (!matched) {
    return { ok: false, statusCode: 401, msg: '账号已被停用或不存在，无法继续操作' };
  }

  return { ok: true, user: matched, accounts };
}

// ==================== 原有小程序云函数接口（完整保留兼容） ====================

async function handleSyncAll(event, openid) {
  await ensureCollection(STATE_COLLECTION);
  const defaults = (event && event.defaults) || {};
  const mapping = [
    ['projects', 'projects'],
    ['admin_accounts', 'adminAccounts'],
    ['client_passwords', 'clientPasswords'],
    ['brochure_config', 'brochure']
  ];

  const data = {};
  for (const [docKey, fieldKey] of mapping) {
    let val = await getStateDoc(docKey);
    if (val === null || val === undefined) {
      if (defaults[fieldKey] !== undefined) {
        val = defaults[fieldKey];
        await setStateDoc(docKey, val);
      }
    }
    data[fieldKey] = val;
  }

  return {
    ok: true,
    openid,
    data
  };
}

async function handleSaveState(event) {
  const key = event && event.key;
  if (!ALLOWED_STATE_KEYS.includes(key)) {
    return { ok: false, msg: `不支持的状态键: ${key}` };
  }
  await setStateDoc(key, event.value);
  return { ok: true };
}

async function handleTrackBrochureEvent(event, openid) {
  await ensureCollection(VISITS_COLLECTION);
  await ensureCollection(STATE_COLLECTION);

  const eventType = (event && event.eventType) || 'view';
  const cardId = (event && event.cardId) || 'CARD-001';
  const fromOpenid = (event && event.fromOpenid) || '';
  const viewerName = ((event && event.viewerName) || '').trim();
  const viewerAccount = ((event && event.viewerAccount) || '').trim();
  const viewerRole = ((event && event.viewerRole) || 'guest').trim();
  const nowStr = formatNow();
  const nowTs = Date.now();
  const shortId = openid ? openid.slice(-4).toUpperCase() : '0000';

  let existing = null;
  try {
    const res = await db.collection(VISITS_COLLECTION).doc(openid).get();
    existing = res && res.data ? res.data : null;
  } catch (err) {
    existing = null;
  }

  const isFirstVisit = !existing;
  const viewDelta = eventType === 'view' ? 1 : 0;
  const shareDelta = eventType === 'share' ? 1 : 0;
  const wechatDelta = eventType === 'wechat' ? 1 : 0;
  const phoneDelta = eventType === 'phone' ? 1 : 0;

  if (isFirstVisit) {
    const newVisitor = {
      openid,
      shortId,
      viewerName: viewerName || `微信访客 #${shortId}`,
      viewerAccount,
      viewerRole,
      lastCardId: cardId,
      firstFromOpenid: fromOpenid && fromOpenid !== openid ? fromOpenid : '',
      viewCount: viewDelta || 1,
      shareCount: shareDelta,
      wechatClickCount: wechatDelta,
      phoneClickCount: phoneDelta,
      inviteCount: 0,
      firstVisitTime: nowStr,
      lastVisitTime: nowStr,
      lastVisitTs: nowTs
    };
    await db.collection(VISITS_COLLECTION).doc(openid).set({ data: newVisitor });

    if (fromOpenid && fromOpenid !== openid) {
      try {
        await db.collection(VISITS_COLLECTION).doc(fromOpenid).update({
          data: {
            inviteCount: _.inc(1)
          }
        });
      } catch (err) {
        // 推荐人文档不存在时忽略
      }
    }
  } else {
    const updateData = {
      lastCardId: cardId,
      lastVisitTime: nowStr,
      lastVisitTs: nowTs
    };
    if (viewerName) updateData.viewerName = viewerName;
    if (viewerAccount) updateData.viewerAccount = viewerAccount;
    if (viewerRole && viewerRole !== 'guest') updateData.viewerRole = viewerRole;
    if (viewDelta) updateData.viewCount = _.inc(viewDelta);
    if (shareDelta) updateData.shareCount = _.inc(shareDelta);
    if (wechatDelta) updateData.wechatClickCount = _.inc(wechatDelta);
    if (phoneDelta) updateData.phoneClickCount = _.inc(phoneDelta);

    await db.collection(VISITS_COLLECTION).doc(openid).update({ data: updateData });
  }

  // 同步累计宣传单上的全局阅读/转发数
  let brochure = await getStateDoc('brochure_config');
  if (brochure && (eventType === 'view' || eventType === 'share')) {
    if (eventType === 'view') {
      brochure.views = (Number(brochure.views) || 0) + 1;
    } else if (eventType === 'share') {
      brochure.shares = (Number(brochure.shares) || 0) + 1;
    }
    await setStateDoc('brochure_config', brochure);
  }

  return {
    ok: true,
    openid,
    views: brochure ? brochure.views : null,
    shares: brochure ? brochure.shares : null
  };
}

async function handleGetBrochureVisitors() {
  await ensureCollection(VISITS_COLLECTION);
  const res = await db
    .collection(VISITS_COLLECTION)
    .orderBy('lastVisitTs', 'desc')
    .limit(100)
    .get();

  const list = (res && res.data) || [];
  let totalViews = 0;
  let totalShares = 0;
  let totalInvites = 0;
  let totalLeads = 0;

  list.forEach(item => {
    totalViews += Number(item.viewCount) || 0;
    totalShares += Number(item.shareCount) || 0;
    totalInvites += Number(item.inviteCount) || 0;
    if ((Number(item.wechatClickCount) || 0) > 0 || (Number(item.phoneClickCount) || 0) > 0) {
      totalLeads += 1;
    }
  });

  return {
    ok: true,
    stats: {
      totalVisitors: list.length,
      totalViews,
      totalShares,
      totalInvites,
      totalLeads
    },
    list
  };
}

// ==================== PC 端顾问 / 助教交付后台接口 ====================

async function handlePcLogin(payload) {
  const username = String(payload.username || '').trim();
  const password = String(payload.password || '').trim();
  if (!username || !password) {
    return { ok: false, statusCode: 400, msg: '请输入顾问登录账号和密码' };
  }

  const accounts = await getAdminAccountsFromDb();
  const matched = accounts.find(
    a => String(a.username || '').toLowerCase() === username.toLowerCase() && a.password === password
  );
  if (!matched) {
    return { ok: false, statusCode: 401, msg: '顾问账号或密码不正确' };
  }
  if (matched.status !== 'active') {
    return { ok: false, statusCode: 403, msg: '该顾问账号已被停用，请联系管理员' };
  }

  const token = signPcToken(matched);
  return {
    ok: true,
    token,
    user: sanitizeAccount(matched)
  };
}

async function handlePcDashboard(authCtx) {
  const [projectsRaw, passMapRaw, brochure, visitorsRes] = await Promise.all([
    getStateDoc('projects'),
    getStateDoc('client_passwords'),
    getStateDoc('brochure_config'),
    handleGetBrochureVisitors()
  ]);

  const projects = Array.isArray(projectsRaw) ? projectsRaw : [];
  const clientPasswords = (passMapRaw && typeof passMapRaw === 'object') ? passMapRaw : {};
  const adminAccounts = (authCtx.accounts || []).map(sanitizeAccount);

  return {
    ok: true,
    user: sanitizeAccount(authCtx.user),
    projects,
    adminAccounts,
    clientPasswords,
    brochure: brochure || null,
    visitorStats: visitorsRes.stats,
    visitors: visitorsRes.list || []
  };
}

function defaultPasswordFromPhone(phone) {
  const clean = String(phone || '').replace(/\s+/g, '');
  return clean.length >= 6 ? clean.slice(-6) : '123456';
}

async function handlePcCreateProject(payload, authCtx) {
  const name = String(payload.name || '').trim();
  const phone = String(payload.phone || '').trim();
  const industry = String(payload.industry || '').trim();
  if (!name || !phone || !industry) {
    return { ok: false, statusCode: 400, msg: '请填写客户姓名、手机号与所属行业' };
  }

  const projectsRaw = await getStateDoc('projects');
  const projects = Array.isArray(projectsRaw) ? projectsRaw : [];
  const passMapRaw = await getStateDoc('client_passwords');
  const passMap = (passMapRaw && typeof passMapRaw === 'object') ? { ...passMapRaw } : {};

  const nowStr = formatNow();
  const totalPrice = Number(payload.totalPrice) || 128000;
  const paidAmount = payload.paidAmount !== undefined ? Number(payload.paidAmount) : totalPrice;
  const planName = String(payload.type || 'IP实战陪跑营 · 年度顾问全案').trim();
  const stepNum = Number(payload.currentStep) || 2;
  const stepObj = DELIVERY_STEPS.find(s => s.step === stepNum) || DELIVERY_STEPS[1];

  const newOrder = {
    id: 'YY' + Date.now().toString().slice(-8),
    name,
    phone,
    industry,
    problem: String(payload.problem || '希望梳理个人品牌定位、打造高客单爆品并跑通成交闭环').trim(),
    type: planName,
    planId: String(payload.planId || 's2'),
    totalPrice,
    paidAmount,
    payMode: String(payload.payMode || `已付全款 ¥${totalPrice.toLocaleString()}`),
    status: stepObj.step === 5 ? '已交付结案' : '服务进行中',
    currentStep: stepObj.step,
    stepName: `${stepObj.code} ${stepObj.title}`,
    consultant: String(payload.consultant || `${authCtx.user.name} · 岩值咨询操盘团队`),
    createTime: nowStr,
    updateTime: nowStr,
    metrics: payload.metrics || {
      ticketBefore: String(payload.ticketBefore || '待首次梳理录入'),
      ticketAfter: '陪跑推进中',
      marginBefore: '待调研',
      marginAfter: '陪跑推进中',
      revenueBefore: String(payload.revenueBefore || '待首次梳理录入'),
      revenueAfter: '陪跑推进中',
      conversionBefore: '待调研',
      conversionAfter: '陪跑推进中',
      highlightSummary: `${authCtx.user.name}已为学员【${name}】在 PC 交付后台完成建档并开启 IP 实战陪跑营全流程。`
    },
    campPipeline: Array.isArray(payload.campPipeline) ? payload.campPipeline : [],
    cockpitProgress: (payload.cockpitProgress && typeof payload.cockpitProgress === 'object') ? payload.cockpitProgress : {},
    cockpitReviews: Array.isArray(payload.cockpitReviews) ? payload.cockpitReviews : [],
    sessions: [
      {
        sessionId: 'SES-' + Date.now().toString().slice(-5),
        sessionNo: 1,
        title: 'IP实战陪跑营入营审定与商业梳理排期筹备',
        date: nowStr + '（预约排期）',
        mode: '线上预沟通 + 1V1 闭门深度问诊',
        participants: `${authCtx.user.name}、${name}`,
        diagnosis: `学员核心诉求：${String(payload.problem || '建立个人品牌定位与爆品发售体系').trim()}`,
        solution: '首先完成【入学准备】及《个人品牌商业梳理（学员版）》表格，随后安排 1V1 商业定位梳理会。',
        consultantNote: '已在 PC 端交付后台同步立项，等待学员激活驾驶舱并上传梳理表。',
        clientRating: 0,
        clientFeedback: '',
        clientFeedbackTime: '',
        consultantReply: '',
        consultantReplyTime: '',
        actionItems: [
          {
            id: 'ACT-' + Date.now().toString().slice(-4) + '1',
            text: '完善个人学籍档案并完成学员群自我介绍',
            done: false,
            feedback: ''
          },
          {
            id: 'ACT-' + Date.now().toString().slice(-4) + '2',
            text: '填写并上传《个人品牌商业梳理（学员版）》前置准备表',
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
        title: `《${industry} · 岩值咨询入营录取与 12 板块陪跑说明书》`,
        fileType: 'PDF / 立项清单',
        deliverTime: nowStr,
        status: '待客户验收',
        summary: `针对【${planName}】定制的入营准备指南、商业梳理采集模板及双线交付排期计划。`
      }
    ],
    clientReview: ''
  };

  projects.unshift(newOrder);
  await setStateDoc('projects', projects);

  const customPass = String(payload.clientPassword || '').trim();
  if (customPass.length >= 4) {
    passMap[phone] = customPass;
  } else if (!passMap[phone]) {
    passMap[phone] = defaultPasswordFromPhone(phone);
  }
  await setStateDoc('client_passwords', passMap);

  return {
    ok: true,
    project: newOrder,
    assignedPassword: passMap[phone]
  };
}

async function handlePcUpdateProject(payload) {
  const projectId = String(payload.projectId || '').trim();
  const patch = (payload.patch && typeof payload.patch === 'object') ? payload.patch : payload;
  if (!projectId) {
    return { ok: false, statusCode: 400, msg: '缺少 projectId 参数' };
  }

  const projectsRaw = await getStateDoc('projects');
  const projects = Array.isArray(projectsRaw) ? projectsRaw : [];
  const idx = projects.findIndex(p => p.id === projectId);
  if (idx === -1) {
    return { ok: false, statusCode: 404, msg: `未找到项目 ${projectId}` };
  }

  const current = { ...projects[idx] };
  const allowedFields = [
    'name',
    'phone',
    'industry',
    'problem',
    'type',
    'status',
    'currentStep',
    'stepName',
    'totalPrice',
    'paidAmount',
    'payMode',
    'consultant',
    'metrics',
    'campPipeline',
    'cockpitProgress',
    'cockpitReviews',
    'clientReview',
    'deliverables',
    'sessions'
  ];

  allowedFields.forEach(field => {
    if (patch[field] !== undefined) {
      current[field] = patch[field];
    }
  });

  if (patch.currentStep !== undefined) {
    const stepObj = DELIVERY_STEPS.find(s => s.step === Number(patch.currentStep));
    if (stepObj) {
      current.currentStep = stepObj.step;
      current.stepName = `${stepObj.code} ${stepObj.title}`;
      if (!patch.status) {
        current.status = stepObj.step === 5 ? '已交付结案' : '服务进行中';
      }
    }
  }

  current.updateTime = formatNow();
  projects[idx] = current;
  await setStateDoc('projects', projects);

  return {
    ok: true,
    project: current
  };
}

async function handlePcAddSession(payload, authCtx) {
  const projectId = String(payload.projectId || '').trim();
  const sessionData = payload.session || payload;
  if (!projectId || !sessionData.title || !sessionData.diagnosis || !sessionData.solution) {
    return { ok: false, statusCode: 400, msg: '请填写项目 ID、咨询主题、核心诊断与破局解法' };
  }

  const projectsRaw = await getStateDoc('projects');
  const projects = Array.isArray(projectsRaw) ? projectsRaw : [];
  const proj = projects.find(p => p.id === projectId);
  if (!proj) {
    return { ok: false, statusCode: 404, msg: '项目不存在' };
  }

  if (!Array.isArray(proj.sessions)) proj.sessions = [];
  const nextNo = proj.sessions.length + 1;
  const nowStr = formatNow();
  const rawActions = String(sessionData.actionsText || '')
    .split(/[\n；;]/)
    .map(s => s.trim())
    .filter(Boolean);

  const actionItems = (rawActions.length > 0 ? rawActions : ['按本次推演方案完成团队对齐与首轮落地测试']).map((txt, i) => ({
    id: 'ACT-' + Date.now().toString().slice(-5) + i,
    text: txt,
    done: false,
    feedback: ''
  }));

  const newSession = {
    sessionId: 'SES-' + Date.now().toString().slice(-6),
    sessionNo: nextNo,
    title: String(sessionData.title).trim(),
    date: String(sessionData.date || '').trim() || nowStr,
    mode: String(sessionData.mode || '腾讯会议 1V1 深度梳理').trim(),
    participants: String(sessionData.participants || `${authCtx.user.name}、${proj.name}`).trim(),
    diagnosis: String(sessionData.diagnosis).trim(),
    solution: String(sessionData.solution).trim(),
    consultantNote: String(sessionData.consultantNote || '请按课后行动清单推进执行，并在小程序打卡反馈。').trim(),
    clientRating: 0,
    clientFeedback: '',
    clientFeedbackTime: '',
    consultantReply: '',
    consultantReplyTime: '',
    actionItems
  };

  proj.sessions.unshift(newSession);
  proj.updateTime = nowStr;
  if (proj.status === '待初审') {
    proj.status = '服务进行中';
  }
  await setStateDoc('projects', projects);
  return { ok: true, project: proj };
}

async function handlePcUpdateSession(payload) {
  const projectId = String(payload.projectId || '').trim();
  const sessionId = String(payload.sessionId || '').trim();
  const sessionData = payload.session || payload;
  if (!projectId || !sessionId) {
    return { ok: false, statusCode: 400, msg: '缺少 projectId 或 sessionId' };
  }

  const projectsRaw = await getStateDoc('projects');
  const projects = Array.isArray(projectsRaw) ? projectsRaw : [];
  const proj = projects.find(p => p.id === projectId);
  if (!proj || !Array.isArray(proj.sessions)) {
    return { ok: false, statusCode: 404, msg: '项目或场次不存在' };
  }
  const ses = proj.sessions.find(s => s.sessionId === sessionId);
  if (!ses) {
    return { ok: false, statusCode: 404, msg: '未找到指定咨询场次' };
  }

  if (typeof sessionData.title === 'string' && sessionData.title.trim()) ses.title = sessionData.title.trim();
  if (typeof sessionData.date === 'string' && sessionData.date.trim()) ses.date = sessionData.date.trim();
  if (typeof sessionData.mode === 'string') ses.mode = sessionData.mode.trim() || ses.mode;
  if (typeof sessionData.participants === 'string') ses.participants = sessionData.participants.trim() || ses.participants;
  if (typeof sessionData.diagnosis === 'string') ses.diagnosis = sessionData.diagnosis.trim();
  if (typeof sessionData.solution === 'string') ses.solution = sessionData.solution.trim();
  if (typeof sessionData.consultantNote === 'string') ses.consultantNote = sessionData.consultantNote.trim();

  if (typeof sessionData.actionsText === 'string') {
    const rawActions = sessionData.actionsText
      .split(/[\n；;]/)
      .map(s => s.trim())
      .filter(Boolean);
    if (rawActions.length > 0) {
      const existing = Array.isArray(ses.actionItems) ? ses.actionItems : [];
      ses.actionItems = rawActions.map((txt, i) => {
        const matched = existing.find(item => item.text === txt);
        return matched || {
          id: 'ACT-' + Date.now().toString().slice(-5) + i,
          text: txt,
          done: false,
          feedback: ''
        };
      });
    }
  }

  proj.updateTime = formatNow();
  await setStateDoc('projects', projects);
  return { ok: true, project: proj };
}

async function handlePcReplySession(payload) {
  const projectId = String(payload.projectId || '').trim();
  const sessionId = String(payload.sessionId || '').trim();
  const replyText = String(payload.replyText || '').trim();
  if (!projectId || !sessionId || !replyText) {
    return { ok: false, statusCode: 400, msg: '请填写完整的回复内容' };
  }

  const projectsRaw = await getStateDoc('projects');
  const projects = Array.isArray(projectsRaw) ? projectsRaw : [];
  const proj = projects.find(p => p.id === projectId);
  if (!proj || !Array.isArray(proj.sessions)) {
    return { ok: false, statusCode: 404, msg: '项目不存在' };
  }
  const ses = proj.sessions.find(s => s.sessionId === sessionId);
  if (!ses) {
    return { ok: false, statusCode: 404, msg: '未找到指定咨询场次' };
  }

  const nowStr = formatNow();
  ses.consultantReply = replyText;
  ses.consultantReplyTime = nowStr;
  proj.updateTime = nowStr;
  await setStateDoc('projects', projects);
  return { ok: true, project: proj };
}

async function handlePcAddDeliverable(payload) {
  const projectId = String(payload.projectId || '').trim();
  const deliv = payload.deliverable || payload;
  if (!projectId || !deliv.title) {
    return { ok: false, statusCode: 400, msg: '请填写项目 ID 与交付文档标题' };
  }

  const projectsRaw = await getStateDoc('projects');
  const projects = Array.isArray(projectsRaw) ? projectsRaw : [];
  const proj = projects.find(p => p.id === projectId);
  if (!proj) {
    return { ok: false, statusCode: 404, msg: '项目不存在' };
  }
  if (!Array.isArray(proj.deliverables)) proj.deliverables = [];

  const nowStr = formatNow();
  const rawTitle = String(deliv.title).trim();
  const newDeliv = {
    delivId: 'DEL-' + Date.now().toString().slice(-6),
    stage: String(deliv.stage || proj.stepName || '03 全案输出').trim(),
    title: rawTitle.startsWith('《') ? rawTitle : `《${rawTitle}》`,
    fileType: String(deliv.fileType || 'PDF / 核心交付方案').trim(),
    fileName: String(deliv.fileName || '').trim(),
    fileUrl: String(deliv.fileUrl || '').trim(),
    fileId: String(deliv.fileId || '').trim(),
    deliverTime: nowStr,
    status: String(deliv.status || '待客户验收').trim(),
    summary: String(deliv.summary || '岩值咨询团队定制输出的高客单商业操盘交付文档。').trim()
  };

  proj.deliverables.unshift(newDeliv);
  proj.updateTime = nowStr;
  await setStateDoc('projects', projects);
  return { ok: true, project: proj };
}

async function handlePcUpdateDeliverable(payload) {
  const projectId = String(payload.projectId || '').trim();
  const delivId = String(payload.delivId || '').trim();
  const patch = payload.patch || payload;
  if (!projectId || !delivId) {
    return { ok: false, statusCode: 400, msg: '缺少 projectId 或 delivId' };
  }

  const projectsRaw = await getStateDoc('projects');
  const projects = Array.isArray(projectsRaw) ? projectsRaw : [];
  const proj = projects.find(p => p.id === projectId);
  if (!proj || !Array.isArray(proj.deliverables)) {
    return { ok: false, statusCode: 404, msg: '项目或交付物不存在' };
  }
  const deliv = proj.deliverables.find(d => d.delivId === delivId);
  if (!deliv) {
    return { ok: false, statusCode: 404, msg: '未找到指定交付文档' };
  }

  ['stage', 'title', 'fileType', 'fileName', 'fileUrl', 'fileId', 'status', 'summary'].forEach(k => {
    if (patch[k] !== undefined) deliv[k] = patch[k];
  });
  proj.updateTime = formatNow();
  await setStateDoc('projects', projects);
  return { ok: true, project: proj };
}

async function handlePcManageAccounts(payload, authCtx) {
  if (!authCtx.user || authCtx.user.roleType !== 'super') {
    return { ok: false, statusCode: 403, msg: '仅主管理员可执行账号与密码管理操作' };
  }

  const op = String(payload.op || '').trim();
  const accounts = await getAdminAccountsFromDb();

  if (op === 'addAdmin') {
    const username = String(payload.username || '').trim();
    const name = String(payload.name || '').trim();
    const title = String(payload.title || '资深交付助教').trim();
    const password = String(payload.password || '').trim();
    const roleType = payload.roleType === 'super' ? 'super' : 'staff';

    if (username.length < 3 || !/^[a-zA-Z0-9_-]+$/.test(username)) {
      return { ok: false, statusCode: 400, msg: '登录账号需至少 3 位，仅支持字母、数字、下划线或短横线' };
    }
    if (!name || password.length < 4) {
      return { ok: false, statusCode: 400, msg: '请填写姓名并设置至少 4 位的初始密码' };
    }
    if (accounts.some(a => String(a.username || '').toLowerCase() === username.toLowerCase())) {
      return { ok: false, statusCode: 409, msg: `账号 ${username} 已存在` };
    }
    const newAcc = {
      id: 'ADM-' + Date.now().toString().slice(-6),
      username,
      name,
      title,
      password,
      roleType,
      status: 'active',
      createTime: formatNow()
    };
    accounts.push(newAcc);
    await setStateDoc('admin_accounts', accounts);
    return { ok: true, adminAccounts: accounts.map(sanitizeAccount), account: sanitizeAccount(newAcc) };
  }

  if (op === 'toggleAdminStatus') {
    const id = String(payload.id || '').trim();
    const target = accounts.find(a => a.id === id);
    if (!target) return { ok: false, statusCode: 404, msg: '未找到该顾问账号' };
    if (target.id === authCtx.user.id) return { ok: false, statusCode: 400, msg: '不能停用当前正在使用的主账号' };
    target.status = target.status === 'active' ? 'disabled' : 'active';
    await setStateDoc('admin_accounts', accounts);
    return { ok: true, adminAccounts: accounts.map(sanitizeAccount) };
  }

  if (op === 'deleteAdmin') {
    const id = String(payload.id || '').trim();
    const target = accounts.find(a => a.id === id);
    if (!target) return { ok: false, statusCode: 404, msg: '未找到该顾问账号' };
    if (target.id === authCtx.user.id) return { ok: false, statusCode: 400, msg: '不能删除当前正在使用的主账号' };
    const next = accounts.filter(a => a.id !== id);
    await setStateDoc('admin_accounts', next);
    return { ok: true, adminAccounts: next.map(sanitizeAccount) };
  }

  if (op === 'resetClientPassword') {
    const phone = String(payload.phone || '').trim();
    if (!phone) return { ok: false, statusCode: 400, msg: '缺少客户手机号' };
    const newPass = String(payload.newPassword || '').trim() || String(Math.floor(100000 + Math.random() * 900000));
    if (newPass.length < 4) return { ok: false, statusCode: 400, msg: '新密码不能少于 4 位' };
    const passMapRaw = await getStateDoc('client_passwords');
    const passMap = (passMapRaw && typeof passMapRaw === 'object') ? { ...passMapRaw } : {};
    passMap[phone] = newPass;
    await setStateDoc('client_passwords', passMap);
    return { ok: true, phone, password: newPass, clientPasswords: passMap };
  }

  return { ok: false, statusCode: 400, msg: `不支持的账号管理操作: ${op}` };
}

exports.main = async (event, context) => {
  const { isHttp, method, payload } = parseIncomingEvent(event);

  if (isHttp && method === 'OPTIONS') {
    return {
      isBase64Encoded: false,
      statusCode: 204,
      headers: CORS_HEADERS,
      body: ''
    };
  }

  const wxContext = cloud.getWXContext();
  const openid = (wxContext && wxContext.OPENID) || '';
  const action = payload && payload.action;

  try {
    // 原有小程序免 Token 动作（仅走 wx.cloud.callFunction 或公开只读）
    if (action === 'syncAll') {
      return wrapResponse(isHttp, await handleSyncAll(payload, openid));
    }
    if (action === 'saveState') {
      return wrapResponse(isHttp, await handleSaveState(payload));
    }
    if (action === 'trackBrochureEvent') {
      return wrapResponse(isHttp, await handleTrackBrochureEvent(payload, openid));
    }
    if (action === 'getBrochureVisitors') {
      return wrapResponse(isHttp, await handleGetBrochureVisitors());
    }

    // PC 端公开接口
    if (action === 'pcHealth') {
      return wrapResponse(isHttp, { ok: true, service: 'consultApi', time: formatNow() });
    }
    if (action === 'pcLogin') {
      const res = await handlePcLogin(payload);
      return wrapResponse(isHttp, res, res.statusCode || 200);
    }

    // PC 端受保护接口（必须携带有效顾问/助教 Token）
    if (action && action.startsWith('pc')) {
      const authCtx = await verifyPcToken(payload._token);
      if (!authCtx.ok) {
        return wrapResponse(isHttp, { ok: false, msg: authCtx.msg }, authCtx.statusCode || 401);
      }

      let res = null;
      if (action === 'pcDashboard') res = await handlePcDashboard(authCtx);
      else if (action === 'pcCreateProject') res = await handlePcCreateProject(payload, authCtx);
      else if (action === 'pcUpdateProject') res = await handlePcUpdateProject(payload);
      else if (action === 'pcAddSession') res = await handlePcAddSession(payload, authCtx);
      else if (action === 'pcUpdateSession') res = await handlePcUpdateSession(payload);
      else if (action === 'pcReplySession') res = await handlePcReplySession(payload);
      else if (action === 'pcAddDeliverable') res = await handlePcAddDeliverable(payload);
      else if (action === 'pcUpdateDeliverable') res = await handlePcUpdateDeliverable(payload);
      else if (action === 'pcManageAccounts') res = await handlePcManageAccounts(payload, authCtx);
      else res = { ok: false, statusCode: 400, msg: `未知 PC action: ${action}` };

      return wrapResponse(isHttp, res, res.statusCode || 200);
    }

    return wrapResponse(isHttp, { ok: false, msg: `未知 action: ${action}` }, 400);
  } catch (err) {
    console.error('consultApi error:', err);
    return wrapResponse(isHttp, { ok: false, msg: err.message || '云函数执行失败' }, 500);
  }
};
