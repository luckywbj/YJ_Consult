// pages/index/index.js
const consultStore = require('../../utils/consultStore');

Page({
  data: {
    showModal: false,
    brand: {},
    auth: { role: 'guest' },
    mentorsList: [],
    mentorPickerOptions: [],
    selectedMentorIndex: 0,
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
    const mentorsList = consultStore.getPublicMentors();
    const mentorPickerOptions = ['由臻言平台顾问智能匹配'].concat(
      mentorsList.map(m => `${m.mentorName} · ${m.studioName}`)
    );
    if (brand && brand.navTitle) {
      wx.setNavigationBarTitle({ title: brand.navTitle });
    }
    this.setData({
      brand,
      auth,
      mentorsList,
      mentorPickerOptions,
      latestProject: visibleProjects.length > 0 ? visibleProjects[0] : null
    });
  },

  viewMentorProfile(e) {
    const tid = e.currentTarget.dataset.id;
    if (!tid) return;
    wx.navigateTo({
      url: `/pages/brochure/brochure?tenantId=${encodeURIComponent(tid)}&preview=1`
    });
  },

  onMentorPickChange(e) {
    this.setData({ selectedMentorIndex: Number(e.detail.value) || 0 });
  },

  exitCurrentStudio() {
    consultStore.logout({ exitStudio: true });
    this.refreshLatestProject();
    wx.showToast({ title: '已回到平台总入口', icon: 'none' });
  },

  goToRegister() {
    wx.navigateTo({ url: '/pages/register/register' });
  },

  goToBrochure() {
    wx.navigateTo({ url: '/pages/brochure/brochure' });
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

    const currentTid = consultStore.getCurrentTenantId();
    const { mentorsList, selectedMentorIndex } = this.data;
    let targetTenantId = currentTid;
    if (!targetTenantId && mentorsList.length > 0) {
      targetTenantId = selectedMentorIndex > 0 && mentorsList[selectedMentorIndex - 1]
        ? mentorsList[selectedMentorIndex - 1].tenantId
        : mentorsList[0].tenantId;
    }

    const targetBrand = consultStore.getBrandConfig(targetTenantId);
    const services = (targetBrand && targetBrand.services) || consultStore.SERVICES_CATALOG;
    const newOrder = consultStore.createOrder({
      tenantId: targetTenantId,
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
      selectedMentorIndex: 0,
      form: { name: '', phone: '', industry: '', problem: '' }
    });
    this.refreshLatestProject();

    wx.showModal({
      title: '预约立项成功',
      content: `已为您自动绑定账号（${newOrder.phone}）并开通专属咨询交付空间。\n初始登录密码：${newOrder.assignedPassword}（可在「我的-修改我的登录密码」修改）`,
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
