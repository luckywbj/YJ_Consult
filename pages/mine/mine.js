// pages/mine/mine.js
const consultStore = require('../../utils/consultStore');

Page({
  data: {
    auth: { role: 'guest' },
    appointments: [],
    loginModal: {
      visible: false,
      mode: 'client', // 'client' | 'admin'
      phone: '',
      code: '',
      adminUser: '',
      adminPass: ''
    },
    changePassModal: {
      visible: false,
      oldPass: '',
      newPass: '',
      confirmPass: ''
    },
    faqList: [
      {
        q: '我的商业咨询记录和交付方案会被其他人看到吗？',
        a: '绝对不会！系统实行严格的一客一档权限隔离。未登录访客无法查看任何项目；您使用下单手机号登录后，仅能查阅您本人名下的咨询过程与交付方案，其他客户无法访问。',
        open: true
      },
      {
        q: '下单立项后如何查看每次咨询过程与交付结果？',
        a: '您在线下单后系统会自动绑定您的手机号并开通「专属咨询交付空间」，点击上方订单即可查看 5 步里程碑进度、每次咨询的痛点诊断与破局方案、课后行动打卡清单以及阶段交付文档。',
        open: false
      },
      {
        q: '没有奢侈品行业背景，也能运用奢侈品思维吗？',
        a: '当然！奢侈品思维的本质是“制造稀缺价值、建立深层情感认同与定价权”。无论是美业、知识IP、定制家居还是传统制造业，都可以用这套底层逻辑打破价格战。',
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
    const auth = consultStore.getAuthSession();
    const visibleList = consultStore.getVisibleProjects();
    this.setData({
      auth,
      appointments: visibleList
    });
  },

  openLoginModal(e) {
    const mode = (e && e.currentTarget && e.currentTarget.dataset.mode) || 'client';
    this.setData({
      loginModal: {
        visible: true,
        mode,
        phone: '',
        code: '',
        adminUser: '',
        adminPass: ''
      }
    });
  },

  closeLoginModal() {
    this.setData({ 'loginModal.visible': false });
  },

  preventBubble() {},

  switchLoginMode(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({
      'loginModal.mode': mode
    });
  },

  onLoginPhoneInput(e) {
    this.setData({ 'loginModal.phone': e.detail.value });
  },

  onLoginCodeInput(e) {
    this.setData({ 'loginModal.code': e.detail.value });
  },

  onAdminUserInput(e) {
    this.setData({ 'loginModal.adminUser': e.detail.value });
  },

  onAdminPassInput(e) {
    this.setData({ 'loginModal.adminPass': e.detail.value });
  },

  quickFillClient(e) {
    const phone = e.currentTarget.dataset.phone;
    const currentPass = consultStore.getClientPassword(phone);
    this.setData({
      'loginModal.phone': phone,
      'loginModal.code': currentPass
    });
  },

  quickFillAdmin(e) {
    const username = e.currentTarget.dataset.user;
    const accounts = consultStore.getAdminAccounts();
    const matched = accounts.find(a => a.username === username);
    this.setData({
      'loginModal.adminUser': username,
      'loginModal.adminPass': matched ? matched.password : ''
    });
  },

  openChangePassModal() {
    if (this.data.auth.role === 'guest') return;
    this.setData({
      changePassModal: {
        visible: true,
        oldPass: '',
        newPass: '',
        confirmPass: ''
      }
    });
  },

  closeChangePassModal() {
    this.setData({ 'changePassModal.visible': false });
  },

  onOldPassInput(e) { this.setData({ 'changePassModal.oldPass': e.detail.value }); },
  onNewPassInput(e) { this.setData({ 'changePassModal.newPass': e.detail.value }); },
  onConfirmPassInput(e) { this.setData({ 'changePassModal.confirmPass': e.detail.value }); },

  submitChangePassword() {
    const { oldPass, newPass, confirmPass } = this.data.changePassModal;
    if (!oldPass.trim() || !newPass.trim()) {
      wx.showToast({ title: '请填写原密码与新密码', icon: 'none' });
      return;
    }
    if (newPass.trim() !== confirmPass.trim()) {
      wx.showToast({ title: '两次输入的新密码不一致', icon: 'none' });
      return;
    }
    const { auth } = this.data;
    const res = auth.role === 'admin'
      ? consultStore.changeAdminPassword(auth.staffUsername, oldPass.trim(), newPass.trim())
      : consultStore.changeClientPassword(auth.clientPhone, oldPass.trim(), newPass.trim());
    if (!res.ok) {
      wx.showToast({ title: res.msg, icon: 'none' });
      return;
    }
    this.setData({ 'changePassModal.visible': false });
    wx.showToast({ title: '登录密码修改成功', icon: 'success' });
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
    const { adminUser, adminPass } = this.data.loginModal;
    const res = consultStore.loginAsAdmin(adminUser, adminPass);
    if (!res.ok) {
      wx.showToast({ title: res.msg, icon: 'none', duration: 2500 });
      return;
    }
    this.setData({ 'loginModal.visible': false });
    this.refreshState();
    wx.showToast({
      title: `欢迎回来，${res.session.staffName}`,
      icon: 'success'
    });
  },

  openAccountManager() {
    wx.navigateTo({
      url: '/pages/accounts/accounts'
    });
  },

  openBrochure() {
    wx.navigateTo({
      url: '/pages/brochure/brochure'
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

  openProjectSpace(e) {
    const { id, tab } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/project/project?id=${id}&tab=${tab || 0}`
    });
  },

  openAdminWorkspace() {
    wx.navigateTo({
      url: '/pages/admin/admin'
    });
  },

  resetDemo() {
    wx.showModal({
      title: '重置演示数据',
      content: '确定恢复为初始的 2 个完整演示咨询项目吗？',
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
    wx.setClipboardData({
      data: 'yanjie_consulting',
      success: () => {
        wx.showToast({ title: '顾问微信号已复制', icon: 'success' });
      }
    });
  },

  callHotline() {
    wx.makePhoneCall({
      phoneNumber: '4008809966',
      fail: () => {
        wx.showToast({ title: '暂未唤起拨号', icon: 'none' });
      }
    });
  }
});
