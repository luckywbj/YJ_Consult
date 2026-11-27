// cloudfunctions/consultApi/index.js
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

function formatNow() {
  const now = new Date(Date.now() + 8 * 3600 * 1000);
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  const hh = String(now.getUTCHours()).padStart(2, '0');
  const mm = String(now.getUTCMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}`;
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

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID || '';
  const action = event && event.action;

  try {
    if (action === 'syncAll') {
      return await handleSyncAll(event, openid);
    }
    if (action === 'saveState') {
      return await handleSaveState(event);
    }
    if (action === 'trackBrochureEvent') {
      return await handleTrackBrochureEvent(event, openid);
    }
    if (action === 'getBrochureVisitors') {
      return await handleGetBrochureVisitors();
    }
    return { ok: false, msg: `未知 action: ${action}` };
  } catch (err) {
    console.error('consultApi error:', err);
    return { ok: false, msg: err.message || '云函数执行失败' };
  }
};
