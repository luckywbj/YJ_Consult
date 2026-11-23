// pages/admin/admin.js
const consultStore = require('../../utils/consultStore');

Page({
  data: {
    auth: { role: 'guest' },
    passInput: '8888',
    allProjects: [],
    project: null,
    adminTab: 0,
    steps: consultStore.DELIVERY_STEPS,
    stageOptions: consultStore.DELIVERY_STEPS.map(s => `${s.code} ${s.title}`),
    planOptions: consultStore.SERVICES_CATALOG.map(s => s.name),
    sessionForm: {
      title: '',
      mode: '1V1 闭门私董推演',
      participants: '',
      diagnosis: '',
      solution: '',
      actionsText: '',
      consultantNote: ''
    },
    delivForm: {
      title: '',
      stageIndex: 2,
      fileType: 'PDF / 操盘全案',
      summary: ''
    },
    metricsForm: {
      ticketBefore: '',
      ticketAfter: '',
      marginBefore: '',
      marginAfter: '',
      revenueBefore: '',
      revenueAfter: '',
      conversionBefore: '',
      conversionAfter: '',
      highlightSummary: ''
    },
    newClientForm: {
      name: '',
      phone: '',
      industry: '',
      planIndex: 0,
      ticketBefore: '',
      revenueBefore: '',
      problem: ''
    }
  },

  onLoad(options) {
    this.targetId = options && options.id ? options.id : '';
    this.loadAdminData();
  },

  onShow() {
    this.loadAdminData();
  },

  loadAdminData() {
    const auth = consultStore.getAuthSession();
    const all = consultStore.getProjects();
    let proj = all[0] || null;
    if (this.targetId) {
      const found = all.find(p => p.id === this.targetId);
      if (found) proj = found;
    }
    if (!proj) return;

    this.targetId = proj.id;
    this.setData({
      auth,
      allProjects: all,
      project: proj,
      'sessionForm.participants': `岩姐、${proj.name}及核心高管团队`,
      metricsForm: { ...proj.metrics }
    });
  },

  onGuardPassInput(e) {
    this.setData({ passInput: e.detail.value });
  },

  unlockAdmin() {
    const res = consultStore.loginAsAdmin(this.data.passInput);
    if (!res.ok) {
      wx.showToast({ title: res.msg, icon: 'none' });
      return;
    }
    this.loadAdminData();
    wx.showToast({ title: '已解锁顾问工作台', icon: 'success' });
  },

  goBackClient() {
    wx.switchTab({ url: '/pages/index/index' });
  },

  selectProject(e) {
    const id = e.currentTarget.dataset.id;
    this.targetId = id;
    this.loadAdminData();
  },

  switchAdminTab(e) {
    this.setData({ adminTab: Number(e.currentTarget.dataset.tab) });
  },

  goToClientPortal() {
    if (!this.data.project) return;
    wx.navigateTo({
      url: `/pages/project/project?id=${this.data.project.id}`
    });
  },

  // 一键填入示例咨询过程纪要
  fillDemoSession() {
    const { project } = this.data;
    const nextNo = project.sessions.length + 1;
    this.setData({
      sessionForm: {
        title: `第 ${nextNo} 次：高客单私享会收单复盘与百万级转介绍裂变机制植入`,
        mode: '线下闭门复盘 + 销冠团队督导',
        participants: `岩姐、${project.name}、销售主管及核心顾问`,
        diagnosis: '首场高客单发售虽已跑通，但已成交的高净值老客缺乏“圈层身份特权感”，转介绍率尚未被充分激活。',
        solution: '设计「黑卡创始会员私享家宴」与“老带新双享尊荣礼遇”，将每一位成交客户转化为品牌野生代言人，构建零获客成本的高客单自循环系统。',
        actionsText: '为首批已成交高客单客户寄送定制烫金黑卡与主理人亲笔感谢信\n建立核心高客单客户 3V1 专属管家服务微信群\n在本周日前完成首场私享家宴的 10 位种子客户与闺蜜邀约',
        consultantNote: '本次复盘后，团队高客单交付标准已具备奢侈品级质感，重点抓好成交后72小时峰值体验。'
      }
    });
    wx.showToast({ title: '已填入示例内容', icon: 'none' });
  },

  onSesTitle(e) { this.setData({ 'sessionForm.title': e.detail.value }); },
  onSesMode(e) { this.setData({ 'sessionForm.mode': e.detail.value }); },
  onSesParticipants(e) { this.setData({ 'sessionForm.participants': e.detail.value }); },
  onSesDiagnosis(e) { this.setData({ 'sessionForm.diagnosis': e.detail.value }); },
  onSesSolution(e) { this.setData({ 'sessionForm.solution': e.detail.value }); },
  onSesActions(e) { this.setData({ 'sessionForm.actionsText': e.detail.value }); },
  onSesNote(e) { this.setData({ 'sessionForm.consultantNote': e.detail.value }); },

  submitNewSession() {
    const { title, diagnosis, solution } = this.data.sessionForm;
    if (!title.trim() || !diagnosis.trim() || !solution.trim()) {
      wx.showToast({ title: '请填写主题、诊断与破局解法', icon: 'none' });
      return;
    }

    consultStore.addConsultSession(this.data.project.id, this.data.sessionForm);
    this.setData({
      'sessionForm.title': '',
      'sessionForm.diagnosis': '',
      'sessionForm.solution': '',
      'sessionForm.actionsText': '',
      'sessionForm.consultantNote': ''
    });
    this.loadAdminData();

    wx.showModal({
      title: '咨询过程记录已发布',
      content: '该次咨询推演与课后行动清单已实时同步至客户专属空间，是否立即前往查看？',
      confirmText: '查看客户空间',
      cancelText: '继续录入',
      confirmColor: '#8D6238',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: `/pages/project/project?id=${this.data.project.id}&tab=0`
          });
        }
      }
    });
  },

  // 一键填入示例交付方案
  fillDemoDeliverable() {
    const { project } = this.data;
    this.setData({
      delivForm: {
        title: `《${project.name}团队 · 千万级高客单销冠考核与高激励分润机制全案》`,
        stageIndex: 3,
        fileType: 'PDF / 组织与薪酬制度',
        summary: '包含高客单顾问阶梯提成模型、周度私享会军令状PK机制、高净值客户365天全生命周期维护日历及转介绍奖励标准。'
      }
    });
    wx.showToast({ title: '已填入示例交付方案', icon: 'none' });
  },

  onDelivTitle(e) { this.setData({ 'delivForm.title': e.detail.value }); },
  onDelivStageChange(e) { this.setData({ 'delivForm.stageIndex': Number(e.detail.value) }); },
  onDelivType(e) { this.setData({ 'delivForm.fileType': e.detail.value }); },
  onDelivSummary(e) { this.setData({ 'delivForm.summary': e.detail.value }); },

  submitNewDeliverable() {
    const { title, stageIndex, fileType, summary } = this.data.delivForm;
    if (!title.trim() || !summary.trim()) {
      wx.showToast({ title: '请填写交付方案标题与摘要', icon: 'none' });
      return;
    }

    consultStore.addDeliverable(this.data.project.id, {
      title: title.trim(),
      stage: this.data.stageOptions[stageIndex],
      fileType: fileType.trim(),
      summary: summary.trim()
    });

    this.setData({
      'delivForm.title': '',
      'delivForm.summary': ''
    });
    this.loadAdminData();

    wx.showModal({
      title: '交付成果已发布',
      content: '新交付方案已上传至客户交付看板，客户可在线查阅并点击确认验收。是否前往查看？',
      confirmText: '查看交付看板',
      cancelText: '留在本页',
      confirmColor: '#8D6238',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: `/pages/project/project?id=${this.data.project.id}&tab=1`
          });
        }
      }
    });
  },

  onChangeStep(e) {
    const step = Number(e.currentTarget.dataset.step);
    consultStore.updateProjectStep(this.data.project.id, step);
    this.loadAdminData();
    wx.showToast({
      title: step === 5 ? '已推进至结案阶段' : `已推进至第 ${step} 阶段`,
      icon: 'success'
    });
  },

  onMetTicketBefore(e) { this.setData({ 'metricsForm.ticketBefore': e.detail.value }); },
  onMetTicketAfter(e) { this.setData({ 'metricsForm.ticketAfter': e.detail.value }); },
  onMetMarginBefore(e) { this.setData({ 'metricsForm.marginBefore': e.detail.value }); },
  onMetMarginAfter(e) { this.setData({ 'metricsForm.marginAfter': e.detail.value }); },
  onMetRevBefore(e) { this.setData({ 'metricsForm.revenueBefore': e.detail.value }); },
  onMetRevAfter(e) { this.setData({ 'metricsForm.revenueAfter': e.detail.value }); },
  onMetConvBefore(e) { this.setData({ 'metricsForm.conversionBefore': e.detail.value }); },
  onMetConvAfter(e) { this.setData({ 'metricsForm.conversionAfter': e.detail.value }); },
  onMetSummary(e) { this.setData({ 'metricsForm.highlightSummary': e.detail.value }); },

  saveMetricsUpdate() {
    consultStore.updateProjectMetrics(this.data.project.id, this.data.metricsForm);
    this.loadAdminData();
    wx.showToast({ title: '战果数据已更新', icon: 'success' });
  },

  // 4. 顾问为线下签约新客户建档立项
  onNewClientName(e) { this.setData({ 'newClientForm.name': e.detail.value }); },
  onNewClientPhone(e) { this.setData({ 'newClientForm.phone': e.detail.value }); },
  onNewClientIndustry(e) { this.setData({ 'newClientForm.industry': e.detail.value }); },
  onNewClientPlanChange(e) { this.setData({ 'newClientForm.planIndex': Number(e.detail.value) }); },
  onNewClientTicket(e) { this.setData({ 'newClientForm.ticketBefore': e.detail.value }); },
  onNewClientRev(e) { this.setData({ 'newClientForm.revenueBefore': e.detail.value }); },
  onNewClientProblem(e) { this.setData({ 'newClientForm.problem': e.detail.value }); },

  createOfflineClientOrder() {
    const { name, phone, industry, planIndex, ticketBefore, revenueBefore, problem } = this.data.newClientForm;
    if (!name.trim() || !phone.trim() || !industry.trim()) {
      wx.showToast({ title: '请填写客户姓名、手机号与行业', icon: 'none' });
      return;
    }

    const newProj = consultStore.createOrder({
      name: name.trim(),
      phone: phone.trim(),
      industry: industry.trim(),
      ticketBefore: ticketBefore.trim(),
      revenueBefore: revenueBefore.trim(),
      problem: problem.trim(),
      type: this.data.planOptions[planIndex],
      isPaid: true,
      payType: 'full',
      fromAdmin: true
    });

    this.targetId = newProj.id;
    this.setData({
      adminTab: 0,
      newClientForm: {
        name: '',
        phone: '',
        industry: '',
        planIndex: 0,
        ticketBefore: '',
        revenueBefore: '',
        problem: ''
      }
    });
    this.loadAdminData();

    wx.showModal({
      title: '新客户建档成功',
      content: `已为【${newProj.name}】开通专属交付空间！\n客户只需在小程序「我的」页面输入手机号 ${newProj.phone} 登录，即可查看专属过程与交付结果。`,
      showCancel: false,
      confirmText: '开始录入咨询',
      confirmColor: '#8D6238'
    });
  }
});
