// pages/brochure/brochure.js
const consultStore = require('../../utils/consultStore');

Page({
  data: {
    auth: { role: 'guest' },
    brochure: null,
    isPreview: false,
    editModalVisible: false,
    wechatModalVisible: false,
    editForm: {
      title: '',
      greeting: '',
      brandName: '',
      tagline: '',
      phone: '',
      wechat: '',
      aboutContent: ''
    }
  },

  onLoad(options) {
    const incomingTid = (options && options.tenantId) || '';
    const isPreview = !!(options && (options.preview === '1' || options.preview === 'true'));
    if (incomingTid && !isPreview) {
      consultStore.setCurrentTenant(incomingTid);
    }
    this.previewMode = isPreview;
    this.targetTenantId = incomingTid || consultStore.getCurrentTenantId();
    if (typeof wx.showShareMenu === 'function') {
      wx.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage', 'shareTimeline']
      });
    }
    const updated = consultStore.recordBrochureView(this.targetTenantId);
    this.syncState(updated);
  },

  onShow() {
    if (!this.previewMode) {
      this.targetTenantId = consultStore.getCurrentTenantId();
    }
    this.syncState(consultStore.getBrochureConfig(this.targetTenantId));
  },

  syncState(brochure) {
    const auth = consultStore.getAuthSession();
    if (brochure && brochure.brandName) {
      wx.setNavigationBarTitle({ title: `${brochure.brandName} · 简介名片` });
    }
    this.setData({
      auth,
      brochure,
      isPreview: !!this.previewMode
    });
  },

  callCardPhone() {
    const phone = (this.data.brochure && this.data.brochure.phone) || '400-880-6699';
    wx.makePhoneCall({
      phoneNumber: phone,
      fail: () => {
        wx.showToast({ title: '暂未唤起拨号', icon: 'none' });
      }
    });
  },

  openWechatModal() {
    this.setData({ wechatModalVisible: true });
  },

  closeWechatModal() {
    this.setData({ wechatModalVisible: false });
  },

  preventBubble() {},

  copyWechatId() {
    const wechat = (this.data.brochure && this.data.brochure.wechat) || 'zhenyan_advisory';
    wx.setClipboardData({
      data: wechat,
      success: () => {
        wx.showToast({ title: '微信号已复制，可去微信添加', icon: 'success' });
      }
    });
  },

  openEditModal() {
    const { brochure } = this.data;
    if (!brochure) return;
    const firstSec = (brochure.sections && brochure.sections[0]) || {};
    this.setData({
      editModalVisible: true,
      editForm: {
        title: brochure.title || '',
        greeting: brochure.greeting || '',
        brandName: brochure.brandName || '',
        tagline: brochure.tagline || '',
        phone: brochure.phone || '',
        wechat: brochure.wechat || '',
        aboutContent: firstSec.content || ''
      }
    });
  },

  closeEditModal() {
    this.setData({ editModalVisible: false });
  },

  onEditTitle(e) { this.setData({ 'editForm.title': e.detail.value }); },
  onEditGreeting(e) { this.setData({ 'editForm.greeting': e.detail.value }); },
  onEditBrandName(e) { this.setData({ 'editForm.brandName': e.detail.value }); },
  onEditTagline(e) { this.setData({ 'editForm.tagline': e.detail.value }); },
  onEditPhone(e) { this.setData({ 'editForm.phone': e.detail.value }); },
  onEditWechat(e) { this.setData({ 'editForm.wechat': e.detail.value }); },
  onEditAbout(e) { this.setData({ 'editForm.aboutContent': e.detail.value }); },

  saveBrochureEdit() {
    const { title, greeting, brandName, tagline, phone, wechat, aboutContent } = this.data.editForm;
    if (!title.trim() || !brandName.trim()) {
      wx.showToast({ title: '标题和名片名称不能为空', icon: 'none' });
      return;
    }

    const { brochure } = this.data;
    const nextSections = (brochure.sections || []).map((s, i) => {
      if (i !== 0) return s;
      return {
        ...s,
        content: aboutContent.trim() || s.content
      };
    });

    const updated = consultStore.saveBrochureConfig({
      title: title.trim(),
      greeting: greeting.trim() || brochure.greeting,
      brandName: brandName.trim(),
      tagline: tagline.trim() || brochure.tagline,
      phone: phone.trim() || brochure.phone,
      wechat: wechat.trim() || brochure.wechat,
      sections: nextSections
    }, this.targetTenantId);

    this.setData({ editModalVisible: false });
    this.syncState(updated);
    wx.showToast({ title: '工作室宣传单已更新', icon: 'success' });
  },

  goToRegister() {
    wx.navigateTo({ url: '/pages/register/register' });
  },

  enterThisStudio() {
    if (!this.targetTenantId) return;
    consultStore.setCurrentTenant(this.targetTenantId);
    const name = (this.data.brochure && this.data.brochure.brandName) || '导师工作室';
    wx.showToast({ title: `已进入「${name}」专属工作室`, icon: 'none' });
    setTimeout(() => {
      wx.switchTab({ url: '/pages/index/index' });
    }, 300);
  },

  goToServices() {
    wx.switchTab({ url: '/pages/services/services' });
  },

  goToCases() {
    wx.switchTab({ url: '/pages/cases/cases' });
  },

  onShareAppMessage() {
    const updated = consultStore.recordBrochureShare(this.targetTenantId);
    this.syncState(updated);
    const tid = this.targetTenantId || '';
    const path = tid
      ? `/pages/brochure/brochure?tenantId=${encodeURIComponent(tid)}`
      : '/pages/brochure/brochure';
    return {
      title: updated.title,
      path,
      imageUrl: updated.avatar || '/images/logo-zhenyan.png'
    };
  },

  onShareTimeline() {
    const updated = consultStore.recordBrochureShare(this.targetTenantId);
    this.syncState(updated);
    const tid = this.targetTenantId || '';
    return {
      title: updated.title,
      query: tid ? `tenantId=${encodeURIComponent(tid)}` : '',
      imageUrl: updated.avatar || '/images/logo-zhenyan.png'
    };
  }
});
