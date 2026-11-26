// pages/index/index.js
const consultStore = require('../../utils/consultStore');

Page({
  data: {
    showModal: false,
    auth: { role: 'guest' },
    latestProject: null,
    form: {
      name: '',
      phone: '',
      industry: '',
      problem: ''
    }
  },

  onLoad() {
    this.refreshLatestProject();
  },

  onShow() {
    this.refreshLatestProject();
  },

  refreshLatestProject() {
    const auth = consultStore.getAuthSession();
    const visibleProjects = consultStore.getVisibleProjects();
    this.setData({
      auth,
      latestProject: visibleProjects.length > 0 ? visibleProjects[0] : null
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

    const newOrder = consultStore.createOrder({
      name: name.trim(),
      phone: phone.trim(),
      industry: industry.trim() || '未注明行业',
      problem: problem.trim() || '期待1V1商业模式诊断与客单价破局',
      type: '1对1 商业闭门深度私董会',
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
      content: `已为您自动绑定账号（${newOrder.phone}）并开通专属咨询交付空间。\n初始登录密码：${newOrder.assignedPassword}（可在「我的-修改登录密码」修改）`,
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
