// pages/admin/admin.js
const consultStore = require('../../utils/consultStore');

Page({
  data: {
    auth: { role: 'guest' },
    passInput: '',
    guardPhone: '',
    tenant: {},
    tenantStatus: {},
    portalPath: '',
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
    },
    brandForm: {},
    newCaseForm: {
      category: '',
      badge: '',
      title: '',
      summary: '',
      beforeVal: '',
      afterVal: '',
      coreStrategy: '',
      clientName: ''
    }
  },

  onLoad(options) {
    this.targetId = options && options.id ? options.id : '';
    if (options && options.tab !== undefined) {
      this.setData({ adminTab: Number(options.tab) });
    }
    this.loadAdminData();
  },

  onShow() {
    this.loadAdminData();
  },

  loadAdminData() {
    const auth = consultStore.getAuthSession();
    const brand = consultStore.getBrandConfig();
    const tenant = consultStore.getCurrentTenant();
    // 只读取「当前工作室」的客户项目，其他导师的数据完全不可见
    const all = auth.role === 'admin' ? consultStore.getVisibleProjects() : [];
    let proj = all[0] || null;
    if (this.targetId) {
      const found = all.find(p => p.id === this.targetId);
      if (found) proj = found;
    }
    this.targetId = proj ? proj.id : '';

    const servicesList = brand.services || consultStore.SERVICES_CATALOG;
    const update = {
      auth,
      tenant,
      tenantStatus: consultStore.getTenantStatus(tenant),
      portalPath: consultStore.getPortalPath(tenant.tenantId),
      brandForm: JSON.parse(JSON.stringify(brand)),
      planOptions: servicesList.map(s => s.name),
      allProjects: all,
      project: proj
    };
    if (proj) {
      update['sessionForm.participants'] = `${brand.mentorName}、${proj.name}及核心高管团队`;
      update.metricsForm = { ...proj.metrics };
    }
    this.setData(update);
    if (brand.navTitle) {
      wx.setNavigationBarTitle({ title: `${brand.navTitle} · 工作室后台` });
    }
  },

  onGuardPhoneInput(e) {
    this.setData({ guardPhone: e.detail.value });
  },

  goRegister() {
    wx.navigateTo({ url: '/pages/register/register' });
  },

  goToPortalHome() {
    wx.switchTab({ url: '/pages/index/index' });
  },

  copyPortalPath() {
    wx.setClipboardData({
      data: this.data.portalPath,
      success: () => {
        wx.showToast({ title: '已复制，可在公众平台生成小程序码', icon: 'none' });
      }
    });
  },

  // 导师点击「分享我的门户」：卡片带上 tenantId，客户打开即锁定为该工作室
  onShareAppMessage() {
    const brand = consultStore.getBrandConfig();
    return {
      title: `${brand.navTitle} · ${brand.philosophy}`,
      path: consultStore.getPortalPath()
    };
  },

  onGuardPassInput(e) {
    this.setData({ passInput: e.detail.value });
  },

  unlockAdmin() {
    const res = this.data.guardPhone
      ? consultStore.loginAsMentor(this.data.guardPhone, this.data.passInput)
      : consultStore.loginAsAdmin(this.data.passInput);
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
        participants: `${(this.data.brandForm && this.data.brandForm.mentorName) || '首席导师'}、${project.name}、销售主管及核心顾问`,
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
  },

  // ==================== 5. 标品白牌化装修中心操作 ====================

  // 一键切换三大行业标品母版
  onApplyPreset(e) {
    const presetKey = e.currentTarget.dataset.preset;
    const newBrand = consultStore.applyIndustryPreset(presetKey);
    this.loadAdminData();
    wx.showModal({
      title: '行业标品母版已切换',
      content: `全站已切换为【${newBrand.navTitle}】行业母版（含首页品牌、导师名片、3大服务套餐与案例库）。是否立即前往首页预览效果？`,
      confirmText: '预览新首页',
      cancelText: '留在本页',
      confirmColor: '#8D6238',
      success: (res) => {
        if (res.confirm) {
          wx.switchTab({ url: '/pages/index/index' });
        }
      }
    });
  },

  onBrandField(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`brandForm.${field}`]: e.detail.value
    });
  },

  saveBrandInfo() {
    consultStore.saveBrandConfig(this.data.brandForm);
    this.loadAdminData();
    wx.showModal({
      title: '品牌门户配置已生效',
      content: '首页品牌标题、使命愿景、导师名片及联系方式已实时更新！是否前往首页查看？',
      confirmText: '前往首页',
      cancelText: '继续配置',
      confirmColor: '#8D6238',
      success: (res) => {
        if (res.confirm) {
          wx.switchTab({ url: '/pages/index/index' });
        }
      }
    });
  },

  onPkgField(e) {
    const { idx, field } = e.currentTarget.dataset;
    let val = e.detail.value;
    const services = this.data.brandForm.services;
    if (field === 'price') {
      const num = Number(val) || 0;
      services[idx].price = num;
      services[idx].priceText = `¥${num.toLocaleString()} / 案`;
    } else if (field === 'deposit') {
      const num = Number(val) || 0;
      services[idx].deposit = num;
      services[idx].depositText = `¥${num.toLocaleString()}`;
    } else {
      services[idx][field] = val;
    }
    this.setData({ 'brandForm.services': services });
  },

  savePackagesConfig() {
    consultStore.saveBrandConfig(this.data.brandForm);
    this.loadAdminData();
    wx.showModal({
      title: '三大服务套餐已更新',
      content: '套餐名称、全案价格与立项定金已同步至「服务」页，是否前往查看？',
      confirmText: '查看服务页',
      cancelText: '留在本页',
      confirmColor: '#8D6238',
      success: (res) => {
        if (res.confirm) {
          wx.switchTab({ url: '/pages/services/services' });
        }
      }
    });
  },

  onCaseField(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`newCaseForm.${field}`]: e.detail.value
    });
  },

  fillDemoCase() {
    const { brandForm } = this.data;
    this.setData({
      newCaseForm: {
        category: '高客单私域',
        badge: '单场发售收款 420W',
        title: '某高端抗衰与私人健康管理中心：重构百万级会员阶梯，3天闭门会收现420万',
        summary: '告别传统渠道高额返佣，由导师团队重塑自有高净值私域池与全周期健康管家交付体系。',
        beforeVal: '渠道抽成50% · 留存低',
        afterVal: '自有私域客单 6.8万 · 复购62%',
        coreStrategy: '砍掉中间渠道商，建立主理人高势能专家IP与1V1尊享私人医生年度会员制。',
        clientName: `孙总（知名健康管理机构创始人 · ${brandForm.mentorName}私董学员）`
      }
    });
    wx.showToast({ title: '已填入示例新案例', icon: 'none' });
  },

  publishNewCase() {
    const { category, badge, title, beforeVal, afterVal, coreStrategy, clientName } = this.data.newCaseForm;
    if (!title.trim() || !beforeVal.trim() || !afterVal.trim()) {
      wx.showToast({ title: '请填写案例标题与前后对比数据', icon: 'none' });
      return;
    }

    consultStore.addBrandCase({
      ...this.data.newCaseForm,
      summary: this.data.newCaseForm.summary || coreStrategy
    });

    this.setData({
      newCaseForm: {
        category: '',
        badge: '',
        title: '',
        summary: '',
        beforeVal: '',
        afterVal: '',
        coreStrategy: '',
        clientName: ''
      }
    });
    this.loadAdminData();

    wx.showModal({
      title: '新案例已发布至案例页',
      content: '该实战案例已实时上架至小程序「案例」页，是否立即前往查看？',
      confirmText: '查看案例页',
      cancelText: '继续装修',
      confirmColor: '#8D6238',
      success: (res) => {
        if (res.confirm) {
          wx.switchTab({ url: '/pages/cases/cases' });
        }
      }
    });
  }
});
