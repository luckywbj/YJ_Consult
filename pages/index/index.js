// pages/index/index.js
const app = getApp();

Page({
  data: {
    showModal: false,
    form: {
      name: '',
      phone: '',
      industry: '',
      problem: ''
    }
  },

  onLoad() {
    console.log('首页加载完成');
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
      wx.showToast({ title: '请填写联系方式', icon: 'none' });
      return;
    }

    const newAppointment = {
      id: 'YY' + Date.now().toString().slice(-8),
      name: name.trim(),
      phone: phone.trim(),
      industry: industry.trim() || '未注明',
      problem: problem.trim() || '期待商业诊断',
      type: '1对1商业闭门私董会',
      status: '审核中',
      createTime: new Date().toLocaleString()
    };

    // 保存到本地 Storage
    const list = wx.getStorageSync('my_consult_appointments') || [];
    list.unshift(newAppointment);
    wx.setStorageSync('my_consult_appointments', list);

    wx.showToast({
      title: '预约申请已提交',
      icon: 'success',
      duration: 2000
    });

    this.setData({
      showModal: false,
      form: { name: '', phone: '', industry: '', problem: '' }
    });
  }
});
