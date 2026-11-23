// pages/platform/platform.js
const consultStore = require('../../utils/consultStore');

const PRESET_KEYS = ['yanjie', 'finance', 'aesthetics'];

Page({
  data: {
    isPlatform: false,
    passInput: '',
    tab: 0,
    tenants: [],
    summary: {},
    presetNames: ['商业咨询 / 知识 IP', '财税 / 股权 / 法律', '美业 / 大健康'],
    presetIndex: 0,
    planNames: ['标准独立品牌版（¥4,980/年）', '旗舰私董交付版（¥9,800/年）', '机构合伙人版（¥19,800/年）'],
    planIndex: 0,
    form: { studioName: '', mentorName: '', phone: '', password: '8888' }
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const isPlatform = consultStore.getAuthSession().role === 'platform';
    if (!isPlatform) {
      this.setData({ isPlatform });
      return;
    }
    const tenants = consultStore.getTenantStats();
    const paidTotal = tenants.reduce((s, t) => s + t.paidTotal, 0);
    this.setData({
      isPlatform,
      tenants,
      summary: {
        tenantCount: tenants.length,
        activeCount: tenants.filter(t => t.statusInfo.ok).length,
        projectCount: tenants.reduce((s, t) => s + t.projectCount, 0),
        paidTotalText: paidTotal >= 10000 ? (paidTotal / 10000).toFixed(1) + '万' : String(paidTotal)
      }
    });
  },

  onPassInput(e) {
    this.setData({ passInput: e.detail.value });
  },

  unlock() {
    const res = consultStore.loginAsPlatform(this.data.passInput);
    if (!res.ok) {
      wx.showToast({ title: res.msg, icon: 'none' });
      return;
    }
    this.refresh();
  },

  logoutPlatform() {
    consultStore.logout();
    this.setData({ isPlatform: false, passInput: '' });
  },

  switchTab(e) {
    this.setData({ tab: Number(e.currentTarget.dataset.tab) });
  },

  previewPortal(e) {
    consultStore.setCurrentTenant(e.currentTarget.dataset.id);
    wx.switchTab({ url: '/pages/index/index' });
  },

  enterTenant(e) {
    const t = consultStore.platformEnterTenant(e.currentTarget.dataset.id);
    if (!t) return;
    wx.navigateTo({ url: '/pages/admin/admin?tab=0' });
  },

  renew(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '续费 1 年',
      content: '确认已收到该工作室的续费款，延长有效期 365 天？',
      confirmColor: '#8D6238',
      success: (res) => {
        if (!res.confirm) return;
        const t = consultStore.renewTenant(id, 365, '标准独立品牌版');
        this.refresh();
        wx.showToast({ title: `已续至 ${t.expireTime}`, icon: 'none' });
      }
    });
  },

  toggleFreeze(e) {
    const t = consultStore.toggleFreezeTenant(e.currentTarget.dataset.id);
    this.refresh();
    wx.showToast({ title: t.status === 'frozen' ? '已冻结，导师无法登录' : '已解冻', icon: 'none' });
  },

  copyPath(e) {
    wx.setClipboardData({ data: consultStore.getPortalPath(e.currentTarget.dataset.id) });
  },

  onField(e) {
    this.setData({ [`form.${e.currentTarget.dataset.field}`]: e.detail.value });
  },

  onPresetChange(e) {
    this.setData({ presetIndex: Number(e.detail.value) });
  },

  onPlanChange(e) {
    this.setData({ planIndex: Number(e.detail.value) });
  },

  createTenant() {
    const { form, presetIndex, planIndex, planNames } = this.data;
    const res = consultStore.registerTenant(
      { ...form, presetKey: PRESET_KEYS[presetIndex], plan: planNames[planIndex].split('（')[0] },
      { byPlatform: true }
    );
    if (!res.ok) {
      wx.showToast({ title: res.msg, icon: 'none', duration: 2500 });
      return;
    }
    const t = res.tenant;
    this.setData({ tab: 0, form: { studioName: '', mentorName: '', phone: '', password: '8888' } });
    this.refresh();
    wx.showModal({
      title: '工作室已开通',
      content: `${t.studioName}\n登录账号：${t.ownerPhone}\n初始密码：${t.password}\n有效期至：${t.expireTime}\n\n点击「复制」把账号信息发给导师。`,
      confirmText: '复制',
      confirmColor: '#8D6238',
      success: (r) => {
        if (r.confirm) {
          wx.setClipboardData({
            data: `【${t.studioName}】工作室已开通\n打开小程序 →「我的」→「导师工作室登录」\n账号：${t.ownerPhone}\n密码：${t.password}\n有效期至：${t.expireTime}`
          });
        }
      }
    });
  }
});
