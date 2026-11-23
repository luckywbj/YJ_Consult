// pages/mine/mine.js
const consultStore = require('../../utils/consultStore');

Page({
  data: {
    brand: {},
    auth: { role: 'guest' },
    appointments: [],
    demoClients: [],
    tenantsList: [],
    trialDays: consultStore.TRIAL_DAYS,
    loginModal: {
      visible: false,
      mode: 'client', // 'client' | 'admin'
      phone: '',
      code: '6666',
      mentorPhone: '',
      adminPass: ''
    },
    faqList: [
      {
        q: '我的商业咨询记录和交付方案会被其他人看到吗？',
        a: '绝对不会！系统实行「工作室隔离 + 一客一档」双重加密隔离。未登录访客无法查看任何项目；您使用下单手机号登录后，仅能查阅您本人名下的咨询过程与交付方案，其他客户与其他工作室均无法访问。',
        open: true
      },
      {
        q: '导师入驻需要自己注册微信小程序和买服务器吗？',
        a: '完全不需要！导师只需在小程序内开通一个工作室账号（10秒即开），即可拥有独立品牌门户、套餐定价、案例库与交付后台，并支持生成专属分享链接发送给自己的客户。',
        open: false
      },
      {
        q: '下单立项后如何查看每次咨询过程与交付结果？',
        a: '您在线下单后系统会自动绑定您的手机号并开通「专属咨询交付空间」，点击上方订单即可查看 5 步里程碑进度、每次咨询的痛点诊断与破局方案、课后行动打卡清单以及阶段交付文档。',
        open: false
      }
    ]
  },

  onShow() {
    this.refreshState();
    const pendingLoginMode = wx.getStorageSync('pending_login_modal');
    if (pendingLoginMode) {
      wx.removeStorageSync('pending_login_modal');
      this.openLoginModal({ currentTarget: { dataset: { mode: pendingLoginMode } } });
    }
  },

  refreshState() {
    const brand = consultStore.getBrandConfig();
    const auth = consultStore.getAuthSession();
    const visibleList = consultStore.getVisibleProjects();
    const demoClients = consultStore.getDemoClientHints();
    const tenantsList = consultStore.getTenants();
    if (brand && brand.navTitle) {
      wx.setNavigationBarTitle({ title: `${brand.navTitle} · 我的` });
    }
    this.setData({
      brand,
      auth,
      appointments: visibleList,
      demoClients,
      tenantsList
    });
  },

  enterStudio(e) {
    const tid = e.currentTarget.dataset.id;
    consultStore.setCurrentTenant(tid);
    this.refreshState();
    wx.showToast({ title: `已进入「${this.data.brand.navTitle}」`, icon: 'none' });
  },

  exitStudioToPlatform() {
    consultStore.logout({ exitStudio: true });
    this.refreshState();
    wx.showToast({ title: '已回到平台通用入口', icon: 'none' });
  },

  onShareAppMessage() {
    const brand = consultStore.getBrandConfig();
    return {
      title: `${brand.navTitle} · ${brand.philosophy}`,
      path: consultStore.getPortalPath()
    };
  },

  openLoginModal(e) {
    const mode = (e && e.currentTarget && e.currentTarget.dataset.mode) || 'client';
    const tenant = consultStore.getCurrentTenant();
    this.setData({
      loginModal: {
        visible: true,
        mode,
        phone: '',
        code: '6666',
        mentorPhone: mode === 'admin' && tenant ? tenant.ownerPhone : '',
        adminPass: mode === 'admin' ? '8888' : ''
      }
    });
  },

  closeLoginModal() {
    this.setData({ 'loginModal.visible': false });
  },

  preventBubble() {},

  switchLoginMode(e) {
    const mode = e.currentTarget.dataset.mode;
    const tenant = consultStore.getCurrentTenant();
    this.setData({
      'loginModal.mode': mode,
      'loginModal.mentorPhone': mode === 'admin' && !this.data.loginModal.mentorPhone && tenant ? tenant.ownerPhone : this.data.loginModal.mentorPhone,
      'loginModal.adminPass': mode === 'admin' && !this.data.loginModal.adminPass ? '8888' : this.data.loginModal.adminPass
    });
  },

  onLoginPhoneInput(e) {
    this.setData({ 'loginModal.phone': e.detail.value });
  },

  onLoginCodeInput(e) {
    this.setData({ 'loginModal.code': e.detail.value });
  },

  onMentorPhoneInput(e) {
    this.setData({ 'loginModal.mentorPhone': e.detail.value });
  },

  onAdminPassInput(e) {
    this.setData({ 'loginModal.adminPass': e.detail.value });
  },

  quickFillClient(e) {
    const phone = e.currentTarget.dataset.phone;
    this.setData({
      'loginModal.phone': phone,
      'loginModal.code': '6666'
    });
  },

  quickFillMentor(e) {
    const phone = e.currentTarget.dataset.phone;
    this.setData({
      'loginModal.mentorPhone': phone,
      'loginModal.adminPass': '8888'
    });
  },

  submitClientLogin() {
    const { phone, code } = this.data.loginModal;
    const res = consultStore.loginAsClient(phone, code);
    if (!res.ok) {
      wx.showToast({ title: res.msg, icon: 'none', duration: 2500 });
      return;
    }
    this.setData({ 'loginModal.visible': false });
    this.refreshState();
    wx.showToast({
      title: `欢迎您，${res.session.clientName}`,
      icon: 'success'
    });
  },

  submitAdminLogin() {
    const { mentorPhone, adminPass } = this.data.loginModal;
    const res = consultStore.loginAsMentor(mentorPhone, adminPass);
    if (!res.ok) {
      wx.showToast({ title: res.msg, icon: 'none', duration: 2500 });
      return;
    }
    this.setData({ 'loginModal.visible': false });
    this.refreshState();
    wx.showToast({
      title: `已进入「${res.tenant.studioName}」`,
      icon: 'success'
    });
  },

  handleLogout() {
    wx.showModal({
      title: '退出当前身份',
      content: '退出后将回到未登录访客视角，所有私密咨询项目将被隐藏保护。确定退出吗？',
      confirmColor: '#8D6238',
      success: (res) => {
        if (res.confirm) {
          consultStore.logout();
          this.refreshState();
          wx.showToast({ title: '已退出登录', icon: 'none' });
        }
      }
    });
  },

  goToServices() {
    wx.switchTab({ url: '/pages/services/services' });
  },

  goToRegister() {
    this.setData({ 'loginModal.visible': false });
    wx.navigateTo({ url: '/pages/register/register' });
  },

  goToPlatform() {
    wx.navigateTo({ url: '/pages/platform/platform' });
  },

  openProjectSpace(e) {
    const { id, tab } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/project/project?id=${id}&tab=${tab || 0}`
    });
  },

  openAdminWorkspace() {
    wx.navigateTo({
      url: '/pages/admin/admin?tab=0'
    });
  },

  openBrandConfig() {
    wx.navigateTo({
      url: '/pages/admin/admin?tab=4'
    });
  },

  resetDemo() {
    wx.showModal({
      title: '重置当前工作室数据',
      content: '仅恢复当前工作室的初始演示项目与品牌配置，不影响其他导师工作室。确定吗？',
      confirmColor: '#8D6238',
      success: (res) => {
        if (res.confirm) {
          consultStore.resetDemoData();
          this.refreshState();
          wx.showToast({ title: '已恢复演示数据', icon: 'success' });
        }
      }
    });
  },

  toggleFaq(e) {
    const idx = e.currentTarget.dataset.index;
    const list = this.data.faqList;
    list[idx].open = !list[idx].open;
    this.setData({ faqList: list });
  },

  copyWechat() {
    const wechat = (this.data.brand && this.data.brand.wechat) || 'yanjie_consulting';
    wx.setClipboardData({
      data: wechat,
      success: () => {
        wx.showToast({ title: '顾问微信号已复制', icon: 'success' });
      }
    });
  },

  callHotline() {
    const phone = (this.data.brand && this.data.brand.phone) ? this.data.brand.phone.replace(/-/g, '') : '4008809966';
    wx.makePhoneCall({
      phoneNumber: phone,
      fail: () => {
        wx.showToast({ title: '暂未唤起拨号', icon: 'none' });
      }
    });
  }
});
