// pages/index/index.js
const consultStore = require('../../utils/consultStore');

Page({
  data: {
    showModal: false,
    brand: {},
    auth: { role: 'guest' },
    tenantsList: [],
    latestProject: null,
    form: {
      name: '',
      phone: '',
      industry: '',
      problem: ''
    }
  },

  onLoad(options) {
    const tid = (options && options.tenantId) || (options && options.scene ? decodeURIComponent(options.scene) : '');
    if (tid) {
      consultStore.setCurrentTenant(tid);
    }
    this.refreshLatestProject();
  },

  onShow() {
    this.refreshLatestProject();
  },

  onShareAppMessage() {
    const brand = consultStore.getBrandConfig();
    return {
      title: `${brand.navTitle} · ${brand.philosophy}`,
      path: consultStore.getPortalPath()
    };
  },

  refreshLatestProject() {
    const brand = consultStore.getBrandConfig();
    const auth = consultStore.getAuthSession();
    const visibleProjects = consultStore.getVisibleProjects();
    const tenantsList = consultStore.getTenants();
    if (brand && brand.navTitle) {
      wx.setNavigationBarTitle({ title: brand.navTitle });
    }
    this.setData({
      brand,
      auth,
      tenantsList,
      latestProject: visibleProjects.length > 0 ? visibleProjects[0] : null
    });
  },

  enterStudioPortal(e) {
    const tid = e.currentTarget.dataset.id;
    consultStore.setCurrentTenant(tid);
    this.refreshLatestProject();
    wx.showToast({ title: `已进入「${this.data.brand.navTitle}」`, icon: 'none' });
  },

  exitCurrentStudio() {
    consultStore.logout({ exitStudio: true });
    this.refreshLatestProject();
    wx.showToast({ title: '已回到平台总入口', icon: 'none' });
  },

  goToRegister() {
    wx.navigateTo({ url: '/pages/register/register' });
  },

  goToLogin() {
    wx.setStorageSync('pending_login_modal', 'client');
    wx.switchTab({
      url: '/pages/mine/mine'
    });
  },

  goToLoginWithMode(e) {
    const mode = e.currentTarget.dataset.mode || 'client';
    wx.setStorageSync('pending_login_modal', mode);
    wx.switchTab({
      url: '/pages/mine/mine'
    });
  },

  goToLatestProject() {
    if (!this.data.latestProject) return;
    wx.navigateTo({
      url: `/pages/project/project?id=${this.data.latestProject.id}`
    });
  },

  goToAdmin() {
    const id = this.data.latestProject ? this.data.latestProject.id : '';
    wx.navigateTo({
      url: `/pages/admin/admin?id=${id}`
    });
  },

  openConsultModal() {
    if (!consultStore.getCurrentTenantId()) {
      wx.showToast({ title: '请先在上方选择一个导师工作室进入', icon: 'none' });
      return;
    }
    this.setData({ showModal: true });
  },

  closeConsultModal() {
    this.setData({ showModal: false });
  },

  preventBubble() {},

  onInputName(e) {
    this.setData({ 'form.name': e.detail.value });
  },

  onInputPhone(e) {
    this.setData({ 'form.phone': e.detail.value });
  },

  onInputIndustry(e) {
    this.setData({ 'form.industry': e.detail.value });
  },

  onInputProblem(e) {
    this.setData({ 'form.problem': e.detail.value });
  },

  submitAppointment() {
    const { name, phone, industry, problem } = this.data.form;
    if (!name || !name.trim()) {
      wx.showToast({ title: '请填写称呼', icon: 'none' });
      return;
    }
    if (!phone || !phone.trim()) {
      wx.showToast({ title: '请填写手机号（用于登录查询交付进度）', icon: 'none' });
      return;
    }

    const services = (this.data.brand && this.data.brand.services) || consultStore.SERVICES_CATALOG;
    const newOrder = consultStore.createOrder({
      name: name.trim(),
      phone: phone.trim(),
      industry: industry.trim() || '未注明行业',
      problem: problem.trim() || '期待1V1商业模式诊断与客单价破局',
      type: services[0].name,
      isPaid: true,
      payType: 'deposit'
    });

    this.setData({
      showModal: false,
      form: { name: '', phone: '', industry: '', problem: '' }
    });
    this.refreshLatestProject();

    wx.showModal({
      title: '预约立项成功',
      content: `已为您自动绑定手机号（${newOrder.phone}）并开通专属咨询交付空间，仅您本人可查阅。`,
      confirmText: '进入我的空间',
      cancelText: '稍后查看',
      confirmColor: '#8D6238',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: `/pages/project/project?id=${newOrder.id}`
          });
        }
      }
    });
  }
});
