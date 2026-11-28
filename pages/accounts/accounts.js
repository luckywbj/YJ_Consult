// pages/accounts/accounts.js
const consultStore = require('../../utils/consultStore');

Page({
  data: {
    auth: { role: 'guest' },
    activeTab: 0, // 0: 顾问团队账号, 1: 客户账号管理
    adminAccounts: [],
    clientAccounts: [],
    showAddForm: false,
    roleLabels: ['普通顾问 / 助教', '主管理员'],
    newAdminForm: {
      username: '',
      name: '',
      title: '资深咨询顾问',
      roleIndex: 0,
      password: ''
    }
  },

  onLoad() {
    this.setData({
      'newAdminForm.password': consultStore.generateRandomPassword()
    });
    this.loadAccounts();
  },

  onShow() {
    this.loadAccounts();
    consultStore.syncFromCloud().then(res => {
      if (res && res.ok) {
        this.loadAccounts();
      }
    });
  },

  loadAccounts() {
    const auth = consultStore.getAuthSession();
    if (auth.role !== 'admin') {
      this.setData({ auth, adminAccounts: [], clientAccounts: [] });
      wx.showModal({
        title: '无权限访问',
        content: '账号管理仅限顾问后台管理员登录使用，请先登录顾问账号。',
        showCancel: false,
        confirmText: '前往登录',
        confirmColor: '#8D6238',
        success: () => {
          wx.switchTab({ url: '/pages/mine/mine' });
        }
      });
      return;
    }

    const adminAccounts = consultStore.getAdminAccounts();
    const clientAccounts = consultStore.getAllClientAccounts();
    this.setData({
      auth,
      adminAccounts,
      clientAccounts
    });
  },

  switchTab(e) {
    this.setData({ activeTab: Number(e.currentTarget.dataset.tab) });
  },

  toggleAddForm() {
    this.setData({ showAddForm: !this.data.showAddForm });
  },

  onNewUsername(e) { this.setData({ 'newAdminForm.username': e.detail.value }); },
  onNewName(e) { this.setData({ 'newAdminForm.name': e.detail.value }); },
  onNewTitle(e) { this.setData({ 'newAdminForm.title': e.detail.value }); },
  onNewRoleChange(e) { this.setData({ 'newAdminForm.roleIndex': Number(e.detail.value) }); },
  onNewPassword(e) { this.setData({ 'newAdminForm.password': e.detail.value }); },

  regenerateAdminPass() {
    this.setData({ 'newAdminForm.password': consultStore.generateRandomPassword() });
    wx.showToast({ title: '已生成随机密码', icon: 'none' });
  },

  submitAddAdmin() {
    if (this.data.auth.staffRoleType !== 'super') {
      wx.showToast({ title: '仅主管理员可新增团队账号', icon: 'none' });
      return;
    }

    const { username, name, title, roleIndex, password } = this.data.newAdminForm;
    const res = consultStore.addAdminAccount({
      username,
      name,
      title,
      password,
      roleType: roleIndex === 1 ? 'super' : 'staff'
    });
    if (!res.ok) {
      wx.showToast({ title: res.msg, icon: 'none' });
      return;
    }

    const acc = res.account;
    this.setData({
      showAddForm: false,
      newAdminForm: {
        username: '',
        name: '',
        title: '资深咨询顾问',
        roleIndex: 0,
        password: consultStore.generateRandomPassword()
      }
    });
    this.loadAccounts();

    wx.showModal({
      title: '顾问账号开通成功',
      content: `姓名：${acc.name}（${acc.title}）\n登录账号：${acc.username}\n初始密码：${acc.password}`,
      confirmText: '复制发给顾问',
      cancelText: '知道了',
      confirmColor: '#8D6238',
      success: (mRes) => {
        if (mRes.confirm) {
          this.copyAdminText(acc);
        }
      }
    });
  },

  copyAdminText(acc) {
    const text = `【岩值商业咨询 · 顾问工作台账号】\n姓名：${acc.name}\n登录账号：${acc.username}\n登录密码：${acc.password}\n（登录后可在「我的-修改我的登录密码」自行修改）`;
    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({ title: '顾问账号密码已复制', icon: 'success' });
      }
    });
  },

  onCopyAdminCred(e) {
    const id = e.currentTarget.dataset.id;
    const acc = this.data.adminAccounts.find(a => a.id === id);
    if (acc) this.copyAdminText(acc);
  },

  onResetAdminPass(e) {
    const id = e.currentTarget.dataset.id;
    const acc = this.data.adminAccounts.find(a => a.id === id);
    if (!acc) return;

    wx.showModal({
      title: '重置顾问登录密码',
      content: `确定要为【${acc.name} (${acc.username})】重新生成 6 位随机登录密码吗？旧密码将立即失效。`,
      confirmText: '确认重置',
      confirmColor: '#8D6238',
      success: (res) => {
        if (!res.confirm) return;
        const result = consultStore.resetAdminPassword(id);
        if (!result.ok) {
          wx.showToast({ title: result.msg, icon: 'none' });
          return;
        }
        this.loadAccounts();
        wx.showModal({
          title: '顾问密码已重置',
          content: `账号：${acc.username}\n新密码：${result.password}`,
          confirmText: '复制密码',
          cancelText: '知道了',
          confirmColor: '#8D6238',
          success: (mRes) => {
            if (mRes.confirm) {
              this.copyAdminText(result.account);
            }
          }
        });
      }
    });
  },

  onToggleAdminStatus(e) {
    const id = e.currentTarget.dataset.id;
    const acc = this.data.adminAccounts.find(a => a.id === id);
    if (!acc) return;
    const nextAction = acc.status === 'active' ? '停用' : '启用';
    wx.showModal({
      title: `${nextAction}顾问账号`,
      content: `确定要${nextAction}【${acc.name} (${acc.username})】的登录权限吗？`,
      confirmColor: '#8D6238',
      success: (res) => {
        if (!res.confirm) return;
        const result = consultStore.toggleAdminAccountStatus(id);
        if (!result.ok) {
          wx.showToast({ title: result.msg, icon: 'none' });
          return;
        }
        this.loadAccounts();
        wx.showToast({ title: `已${nextAction}`, icon: 'success' });
      }
    });
  },

  onDeleteAdmin(e) {
    const id = e.currentTarget.dataset.id;
    const acc = this.data.adminAccounts.find(a => a.id === id);
    if (!acc) return;
    wx.showModal({
      title: '删除顾问账号',
      content: `确定永久删除【${acc.name} (${acc.username})】吗？删除后该账号无法再登录后台。`,
      confirmText: '确认删除',
      confirmColor: '#B84A39',
      success: (res) => {
        if (!res.confirm) return;
        const result = consultStore.deleteAdminAccount(id);
        if (!result.ok) {
          wx.showToast({ title: result.msg, icon: 'none' });
          return;
        }
        this.loadAccounts();
        wx.showToast({ title: '账号已删除', icon: 'success' });
      }
    });
  },

  onCopyClientCred(e) {
    const phone = e.currentTarget.dataset.phone;
    const client = this.data.clientAccounts.find(c => c.phone === phone);
    if (!client) return;
    const text = `【岩值商业咨询】专属交付空间账号\n登录手机号：${client.phone}\n登录密码：${client.password}\n（登录后可在「我的-修改我的登录密码」自行修改）`;
    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({ title: '客户账号密码已复制', icon: 'success' });
      }
    });
  },

  onResetClientPass(e) {
    const phone = e.currentTarget.dataset.phone;
    const client = this.data.clientAccounts.find(c => c.phone === phone);
    if (!client) return;

    wx.showModal({
      title: '重置客户登录密码',
      content: `确定要为【${client.name} (${client.phone})】重新生成 6 位随机密码吗？旧密码将立即失效。`,
      confirmText: '确认重置',
      confirmColor: '#8D6238',
      success: (res) => {
        if (!res.confirm) return;
        const result = consultStore.resetClientPassword(phone);
        if (!result.ok) {
          wx.showToast({ title: result.msg, icon: 'none' });
          return;
        }
        this.loadAccounts();
        wx.showModal({
          title: '客户密码已重置',
          content: `客户：${client.name}\n手机号：${client.phone}\n新密码：${result.password}`,
          confirmText: '复制发给客户',
          cancelText: '知道了',
          confirmColor: '#8D6238',
          success: (mRes) => {
            if (mRes.confirm) {
              this.onCopyClientCred({ currentTarget: { dataset: { phone } } });
            }
          }
        });
      }
    });
  }
});
