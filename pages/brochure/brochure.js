// pages/brochure/brochure.js
const consultStore = require('../../utils/consultStore');

Page({
  data: {
    auth: { role: 'guest' },
    brochure: null,
    activeCard: null,
    wechatModalVisible: false,
    editModalVisible: false,
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
    this.incomingCardId = (options && options.cardId) || '';
    if (typeof wx.showShareMenu === 'function') {
      wx.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage', 'shareTimeline']
      });
    }
    const updated = consultStore.recordBrochureView();
    this.syncBrochureState(updated);
  },

  onShow() {
    this.syncBrochureState(consultStore.getBrochureConfig());
  },

  syncBrochureState(brochure) {
    const auth = consultStore.getAuthSession();
    const cards = brochure.staffCards || [];
    const targetCardId = this.incomingCardId || brochure.activeCardId;
    const activeCard = cards.find(c => c.cardId === targetCardId) || cards[0] || {};
    this.setData({
      auth,
      brochure,
      activeCard
    });
  },

  callCardPhone() {
    const phone = (this.data.activeCard && this.data.activeCard.phone) || '4008809966';
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
    const wechat = (this.data.activeCard && this.data.activeCard.wechat) || 'yanjie_consulting';
    wx.setClipboardData({
      data: wechat,
      success: () => {
        wx.showToast({ title: '微信号已复制，可去微信添加', icon: 'success' });
      }
    });
  },

  switchStaffCard() {
    const { brochure, activeCard } = this.data;
    const cards = (brochure && brochure.staffCards) || [];
    if (cards.length < 2) {
      wx.showToast({ title: '当前仅配置了一张顾问名片', icon: 'none' });
      return;
    }
    const idx = cards.findIndex(c => c.cardId === activeCard.cardId);
    const nextCard = cards[(idx + 1) % cards.length];
    this.incomingCardId = nextCard.cardId;
    const updated = consultStore.saveBrochureConfig({ activeCardId: nextCard.cardId });
    this.syncBrochureState(updated);
    wx.showToast({
      title: `已切为「${nextCard.name}」名片，转发即携带`,
      icon: 'none'
    });
  },

  openEditModal() {
    const { brochure, activeCard } = this.data;
    const firstSec = (brochure.sections && brochure.sections[0]) || {};
    this.setData({
      editModalVisible: true,
      editForm: {
        title: brochure.title || '',
        greeting: brochure.greeting || '',
        brandName: activeCard.brandName || '',
        tagline: activeCard.tagline || '',
        phone: activeCard.phone || '',
        wechat: activeCard.wechat || '',
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

    const { brochure, activeCard } = this.data;
    const nextCards = (brochure.staffCards || []).map(c => {
      if (c.cardId !== activeCard.cardId) return c;
      return {
        ...c,
        brandName: brandName.trim(),
        tagline: tagline.trim() || c.tagline,
        phone: phone.trim() || c.phone,
        wechat: wechat.trim() || c.wechat
      };
    });

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
      staffCards: nextCards,
      sections: nextSections
    });

    this.setData({ editModalVisible: false });
    this.syncBrochureState(updated);
    wx.showToast({ title: '宣传单与名片已更新', icon: 'success' });
  },

  goToServices() {
    wx.switchTab({ url: '/pages/services/services' });
  },

  goToCases() {
    wx.switchTab({ url: '/pages/cases/cases' });
  },

  onShareAppMessage() {
    const updated = consultStore.recordBrochureShare();
    this.syncBrochureState(updated);
    const cardId = (this.data.activeCard && this.data.activeCard.cardId) || 'CARD-001';
    return {
      title: updated.title,
      path: `/pages/brochure/brochure?cardId=${cardId}`,
      imageUrl: '/images/avatar.png'
    };
  },

  onShareTimeline() {
    const updated = consultStore.recordBrochureShare();
    this.syncBrochureState(updated);
    const cardId = (this.data.activeCard && this.data.activeCard.cardId) || 'CARD-001';
    return {
      title: updated.title,
      query: `cardId=${cardId}`,
      imageUrl: '/images/avatar.png'
    };
  }
});
