// pages/register/register.js
const consultStore = require('../../utils/consultStore');

Page({
  data: {
    trialDays: consultStore.TRIAL_DAYS,
    form: {
      studioName: '',
      mentorName: '',
      phone: '',
      password: '',
      wechat: '',
      presetKey: 'yanjie'
    },
    presetOptions: [
      { key: 'yanjie', name: '商业咨询 / 知识 IP', desc: '私董会、营销操盘、个人品牌' },
      { key: 'finance', name: '财税 / 股权 / 法律', desc: '财税筹划、股权架构、律所' },
      { key: 'aesthetics', name: '美业 / 大健康', desc: '医美操盘、抗衰会所、连锁陪跑' }
    ]
  },

  onField(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  selectPreset(e) {
    this.setData({ 'form.presetKey': e.currentTarget.dataset.key });
  },

  submitRegister() {
    const res = consultStore.registerTenant(this.data.form);
    if (!res.ok) {
      wx.showToast({ title: res.msg, icon: 'none', duration: 2500 });
      return;
    }
    const t = res.tenant;
    wx.showModal({
      title: '工作室开通成功',
      content: `「${t.studioName}」已开通！\n登录账号：${t.ownerPhone}\n试用到期：${t.expireTime}\n\n下一步：进入「标品装修」把门户改成你自己的品牌，然后分享给你的客户。`,
      showCancel: false,
      confirmText: '去装修我的门户',
      confirmColor: '#8D6238',
      success: () => {
        wx.redirectTo({ url: '/pages/admin/admin?tab=4' });
      }
    });
  },

  goLogin() {
    wx.setStorageSync('pending_login_modal', 'admin');
    wx.switchTab({ url: '/pages/mine/mine' });
  }
});
