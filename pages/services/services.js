// pages/services/services.js
const consultStore = require('../../utils/consultStore');

Page({
  data: {
    currentPlan: 0,
    typeIndex: 0,
    payMode: 'deposit', // 'deposit' | 'full' | 'audit'
    typeOptions: consultStore.SERVICES_CATALOG.map(s => s.name),
    formData: {
      name: '',
      phone: '',
      industry: '',
      ticketBefore: '',
      revenueBefore: '',
      problem: ''
    },
    servicesList: consultStore.SERVICES_CATALOG,
    steps: consultStore.DELIVERY_STEPS
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
    wx.makePhoneCall({
      phoneNumber: '4008809966',
      fail: () => {
        wx.showToast({ title: '暂未唤起拨号', icon: 'none' });
      }
    });
  },

  copyWechat() {
    wx.setClipboardData({
      data: 'yanjie_consulting',
      success: () => {
        wx.showToast({ title: '顾问微信号已复制', icon: 'success' });
      }
    });
  }
});
