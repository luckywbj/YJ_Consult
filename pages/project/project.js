// pages/project/project.js
const consultStore = require('../../utils/consultStore');

Page({
  data: {
    brand: {},
    auth: { role: 'guest' },
    allProjects: [],
    projectTitles: [],
    currentProjIndex: 0,
    project: null,
    activeTab: 0,
    steps: consultStore.DELIVERY_STEPS,
    reviewDraft: '',
    feedbackModal: {
      visible: false,
      sessionId: '',
      actionId: '',
      taskTitle: '',
      text: ''
    }
  },

  onLoad(options) {
    this.targetId = options && options.id ? options.id : '';
    if (options && options.tab) {
      this.setData({ activeTab: Number(options.tab) });
    }
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  loadData() {
    const brand = consultStore.getBrandConfig();
    const auth = consultStore.getAuthSession();
    // 严格只读取当前登录身份有权查看的项目
    const visible = consultStore.getVisibleProjects();

    if (auth.role === 'guest' || visible.length === 0) {
      this.setData({ brand, auth, project: null, allProjects: [] });
      wx.showModal({
        title: '请先登录验证身份',
        content: '为保护客户商业咨询机密，请先使用下单手机号登录，或前往服务页下单立项。',
        confirmText: '前往登录',
        showCancel: false,
        confirmColor: '#8D6238',
        success: () => {
          wx.switchTab({ url: '/pages/mine/mine' });
        }
      });
      return;
    }

    let idx = 0;
    if (this.targetId) {
      const foundIdx = visible.findIndex(p => p.id === this.targetId);
      if (foundIdx !== -1) idx = foundIdx;
    }
    const proj = visible[idx] || null;
    this.setData({
      brand,
      auth,
      allProjects: visible,
      projectTitles: visible.map(p => `${p.name} · ${p.type} (${p.status})`),
      currentProjIndex: idx,
      project: proj,
      reviewDraft: proj ? (proj.clientReview || '') : ''
    });
  },

  onSwitchProject(e) {
    const idx = Number(e.detail.value);
    const proj = this.data.allProjects[idx];
    if (proj) {
      this.targetId = proj.id;
      this.loadData();
    }
  },

  switchTab(e) {
    const tab = Number(e.currentTarget.dataset.tab);
    this.setData({ activeTab: tab });
  },

  handlePayNow() {
    const { project } = this.data;
    if (!project) return;
    wx.showModal({
      title: '微信支付 · 激活专属咨询空间',
      content: `确认为【${project.type}】支付立项定金并立即启动 1V1 深度问诊排期吗？`,
      confirmText: '确认支付',
      confirmColor: '#8D6238',
      success: (res) => {
        if (res.confirm) {
          consultStore.payForProject(project.id, 'deposit');
          this.loadData();
          wx.showToast({ title: '已立项开启问诊', icon: 'success' });
        }
      }
    });
  },

  onToggleAction(e) {
    const { ses, act } = e.currentTarget.dataset;
    consultStore.toggleActionItem(this.data.project.id, ses, act);
    this.loadData();
    wx.showToast({ title: '行动进度已更新', icon: 'none' });
  },

  openFeedbackModal(e) {
    const { ses, act, old, title } = e.currentTarget.dataset;
    this.setData({
      feedbackModal: {
        visible: true,
        sessionId: ses,
        actionId: act,
        taskTitle: title,
        text: old || ''
      }
    });
  },

  closeFeedbackModal() {
    this.setData({ 'feedbackModal.visible': false });
  },

  preventBubble() {},

  onFeedbackInput(e) {
    this.setData({ 'feedbackModal.text': e.detail.value });
  },

  saveActionFeedback() {
    const { sessionId, actionId, text } = this.data.feedbackModal;
    consultStore.toggleActionItem(this.data.project.id, sessionId, actionId, text.trim());
    this.setData({ 'feedbackModal.visible': false });
    this.loadData();
    wx.showToast({ title: '落地反馈已保存', icon: 'success' });
  },

  previewDeliverable(e) {
    const delivId = e.currentTarget.dataset.id;
    const item = this.data.project.deliverables.find(d => d.delivId === delivId);
    if (!item) return;

    wx.showModal({
      title: item.title,
      content: `【所属阶段】${item.stage}\n【文件类型】${item.fileType}\n【交付时间】${item.deliverTime}\n\n【核心方案内容摘要】\n${item.summary}\n\n（注：接入云存储后可直接调用 wx.openDocument 在线打开完整 PDF 方案）`,
      showCancel: false,
      confirmText: '我已查阅',
      confirmColor: '#8D6238'
    });
  },

  onAcceptDeliverable(e) {
    const delivId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认验收交付成果',
      content: '确认已审阅该阶段交付方案并签署验收吗？',
      confirmText: '确认验收',
      confirmColor: '#8D6238',
      success: (res) => {
        if (res.confirm) {
          consultStore.acceptDeliverable(this.data.project.id, delivId);
          this.loadData();
          wx.showToast({ title: '已确认验收', icon: 'success' });
        }
      }
    });
  },

  onReviewInput(e) {
    this.setData({ reviewDraft: e.detail.value });
  },

  submitReview() {
    if (!this.data.reviewDraft.trim()) {
      wx.showToast({ title: '请先输入评价内容', icon: 'none' });
      return;
    }
    consultStore.saveClientReview(this.data.project.id, this.data.reviewDraft);
    this.loadData();
    wx.showToast({ title: '验收评价已保存', icon: 'success' });
  },

  contactConsultant() {
    const wechat = (this.data.brand && this.data.brand.wechat) || 'yanjie_consulting';
    wx.setClipboardData({
      data: wechat,
      success: () => {
        wx.showToast({ title: '顾问微信已复制', icon: 'success' });
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
  },

  goToConsultantAdmin() {
    if (this.data.auth.role !== 'admin') return;
    wx.navigateTo({
      url: `/pages/admin/admin?id=${this.data.project.id}`
    });
  }
});
