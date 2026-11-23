// pages/services/services.js
const consultStore = require('../../utils/consultStore');

Page({
  data: {
    brand: {},
    currentPlan: 0,
    typeIndex: 0,
    payMode: 'deposit',
    typeOptions: [],
    formData: {
      name: '',
      phone: '',
      industry: '',
      ticketBefore: '',
      revenueBefore: '',
      problem: ''
    },
    servicesList: [],
    steps: consultStore.DELIVERY_STEPS
  },

  onLoad() {
    this.syncBrandServices();
  },

  onShow() {
    this.syncBrandServices();
  },

  syncBrandServices() {
    const brand = consultStore.getBrandConfig();
    const servicesList = brand.services || consultStore.SERVICES_CATALOG;
    if (brand && brand.navTitle) {
      wx.setNavigationBarTitle({ title: `${brand.navTitle} · 服务` });
    }
    this.setData({
      brand,
      servicesList,
      typeOptions: servicesList.map(s => s.name)
    });
  },

  onShareAppMessage() {
    const brand = consultStore.getBrandConfig();
    return {
      title: `${brand.navTitle} · 核心服务矩阵`,
      path: consultStore.getPortalPath()
    };
  },

  selectPlan(e) {
    const idx = e.currentTarget.dataset.index;
    this.setData({ currentPlan: idx, typeIndex: idx });
  },

  selectPayMode(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({ payMode: mode });
  },

  appointSpecificPlan(e) {
    const planName = e.currentTarget.dataset.name;
    const mode = e.currentTarget.dataset.mode || 'deposit';
    const idx = this.data.typeOptions.indexOf(planName);
    if (idx !== -1) {
      this.setData({ typeIndex: idx, currentPlan: idx, payMode: mode });
    }
    wx.pageScrollTo({
      selector: '#appointment-form',
      duration: 300
    });
  },

  bindTypeChange(e) {
    const idx = Number(e.detail.value);
    this.setData({ typeIndex: idx, currentPlan: idx });
  },

  bindName(e) { this.setData({ 'formData.name': e.detail.value }); },
  bindPhone(e) { this.setData({ 'formData.phone': e.detail.value }); },
  bindIndustry(e) { this.setData({ 'formData.industry': e.detail.value }); },
  bindTicketBefore(e) { this.setData({ 'formData.ticketBefore': e.detail.value }); },
  bindRevenueBefore(e) { this.setData({ 'formData.revenueBefore': e.detail.value }); },
  bindProblem(e) { this.setData({ 'formData.problem': e.detail.value }); },

  submitForm() {
    if (!consultStore.getCurrentTenantId()) {
      wx.showModal({
        title: '请先选择咨询工作室',
        content: '当前处于平台总入口，请先在「首页」或「我的」选择您要预约的导师工作室，或从导师分享链接进入后再下单。',
        confirmText: '去选择',
        confirmColor: '#8D6238',
        success: (res) => {
          if (res.confirm) wx.switchTab({ url: '/pages/index/index' });
        }
      });
      return;
    }
    const { name, phone, industry, ticketBefore, revenueBefore, problem } = this.data.formData;
    const { typeIndex, typeOptions, servicesList, payMode } = this.data;

    if (!name.trim()) {
      wx.showToast({ title: '请填写您的称呼', icon: 'none' });
      return;
    }
    if (!phone.trim()) {
      wx.showToast({ title: '请填写联系电话或微信', icon: 'none' });
      return;
    }
    if (!industry.trim()) {
      wx.showToast({ title: '请填写所在行业', icon: 'none' });
      return;
    }

    const currentService = servicesList[typeIndex];

    // 如果是支付定金或全款模式，唤起模拟微信支付收银台确认
    if (payMode === 'deposit' || payMode === 'full') {
      const amountText = payMode === 'full' ? `¥${currentService.price.toLocaleString()}` : currentService.depositText;
      wx.showModal({
        title: '微信支付 · 咨询立项确认',
        content: `服务方案：${currentService.name}\n立项支付金额：${amountText}\n\n支付后将立即为您开通「专属咨询交付空间」，记录每次咨询过程与交付结果。`,
        confirmText: '确认支付',
        cancelText: '暂不支付',
        confirmColor: '#8D6238',
        success: (res) => {
          if (res.confirm) {
            wx.showLoading({ title: '正在立项建档...' });
            setTimeout(() => {
              wx.hideLoading();
              const newOrder = consultStore.createOrder({
                name,
                phone,
                industry,
                ticketBefore,
                revenueBefore,
                problem,
                type: typeOptions[typeIndex],
                isPaid: true,
                payType: payMode
              });
              this.afterOrderCreated(newOrder, true);
            }, 500);
          }
        }
      });
    } else {
      // 免付定金初审模式
      const newOrder = consultStore.createOrder({
        name,
        phone,
        industry,
        ticketBefore,
        revenueBefore,
        problem,
        type: typeOptions[typeIndex],
        isPaid: false,
        payType: 'audit'
      });
      this.afterOrderCreated(newOrder, false);
    }
  },

  afterOrderCreated(newOrder, isPaid) {
    this.setData({
      formData: { name: '', phone: '', industry: '', ticketBefore: '', revenueBefore: '', problem: '' }
    });

    wx.showModal({
      title: isPaid ? '立项成功 · 交付空间已开启' : '预约申请已建档',
      content: isPaid
        ? `项目编号：${newOrder.id}\n已为您生成 5 步交付空间与首次 1V1 问诊准备清单，是否立即前往查看？`
        : `项目编号：${newOrder.id}\n您可以前往专属咨询空间查看初审进度、补充资料或随时在线支付立项。`,
      confirmText: '进入交付空间',
      cancelText: '留在本页',
      confirmColor: '#8D6238',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: `/pages/project/project?id=${newOrder.id}`
          });
        }
      }
    });
  },

  makePhoneCall() {
    const phone = (this.data.brand && this.data.brand.phone) ? this.data.brand.phone.replace(/-/g, '') : '4008809966';
    wx.makePhoneCall({
      phoneNumber: phone,
      fail: () => {
        wx.showToast({ title: '暂未唤起拨号', icon: 'none' });
      }
    });
  },

  copyWechat() {
    const wechat = (this.data.brand && this.data.brand.wechat) || 'yanjie_consulting';
    wx.setClipboardData({
      data: wechat,
      success: () => {
        wx.showToast({ title: '顾问微信号已复制', icon: 'success' });
      }
    });
  }
});
