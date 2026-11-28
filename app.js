// app.js
const consultStore = require('./utils/consultStore');

// 从启动参数中解析工作室 ID：
// 1. 分享卡片 / 普通链接：path?tenantId=xxx
// 2. 小程序码（wxacode.getUnlimited）：scene=xxx（scene 最长 32 字符，直接放 tenantId）
function resolveTenantId(options) {
  const query = (options && options.query) || {};
  if (query.tenantId) return query.tenantId;
  if (query.scene) return decodeURIComponent(query.scene);
  return '';
}

App({
  onLaunch(options) {
    consultStore.getTenants();
    consultStore.getProjects();
    this.applyTenantFromOptions(options);
  },

  // 热启动（从分享卡片再次进入）时也要切换到对应工作室
  onShow(options) {
    this.applyTenantFromOptions(options);
  },

  applyTenantFromOptions(options) {
    const tenantId = resolveTenantId(options);
    if (tenantId) {
      consultStore.setCurrentTenant(tenantId);
    }
  },

  globalData: {
    platformName: '臻言咨询',
    platformSubtitle: 'ZHENYAN ADVISORY PLATFORM'
  }
});
