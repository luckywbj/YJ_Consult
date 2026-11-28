// pages/brochure/brochure.js
const consultStore = require('../../utils/consultStore');

Page({
  data: {
    auth: { role: 'guest' },
    brochure: null,
    activeCard: null,
    wechatModalVisible: false,
    editModalVisible: false,
    visitorModalVisible: false,
    visitorSource: 'local',
    visitorStats: {
      totalVisitors: 0,
      totalViews: 0,
      totalShares: 0,
      totalInvites: 0,
      totalLeads: 0
    },
    visitorList: [],
    editForm: {
      title: '',
      greeting: '',
      brandName: '',
      tagline: '',
      phone: '',
      wechat: '',
      wechatQr: '',
      aboutContent: ''
    }
  },

  onLoad(options) {
    this.incomingCardId = (options && options.cardId) || '';
    this.fromOpenid = (options && options.fromUid) || '';

    if (typeof wx.showShareMenu === 'function') {
      wx.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage', 'shareTimeline']
      });
    }

    // 先以本地数据秒开渲染，再拉取云端最新配置并上报本次访问
    const initial = consultStore.getBrochureConfig();
    this.syncBrochureState(initial);

    consultStore
      .syncFromCloud()
      .then(() => {
        const latest = consultStore.getBrochureConfig();
        this.syncBrochureState(latest);
        const cardId = (this.data.activeCard && this.data.activeCard.cardId) || latest.activeCardId;
        return consultStore.trackBrochureEvent('view', {
          cardId,
          fromOpenid: this.fromOpenid
        });
      })
      .then(trackRes => {
        if (trackRes && trackRes.brochure) {
          this.syncBrochureState(trackRes.brochure);
        }
      });
  },

  onShow() {
    this.syncBrochureState(consultStore.getBrochureConfig());
    consultStore.syncFromCloud().then(res => {
      if (res && res.ok) {
        this.syncBrochureState(consultStore.getBrochureConfig());
      }
    });
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
    const cardId = (this.data.activeCard && this.data.activeCard.cardId) || 'CARD-001';
    consultStore.trackBrochureEvent('phone', {
      cardId,
      fromOpenid: this.fromOpenid
    });
    wx.makePhoneCall({
      phoneNumber: phone,
      fail: () => {
        wx.showToast({ title: '暂未唤起拨号', icon: 'none' });
      }
    });
  },

  openWechatModal() {
    const cardId = (this.data.activeCard && this.data.activeCard.cardId) || 'CARD-001';
    consultStore.trackBrochureEvent('wechat', {
      cardId,
      fromOpenid: this.fromOpenid
    });
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
        wechatQr: activeCard.wechatQr || '',
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

  uploadWechatQr() {
    const cardId = (this.data.activeCard && this.data.activeCard.cardId) || 'CARD-001';
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempPath = res.tempFiles && res.tempFiles[0] && res.tempFiles[0].tempFilePath;
        if (!tempPath) return;

        if (!wx.cloud || typeof wx.cloud.uploadFile !== 'function') {
          this.setData({ 'editForm.wechatQr': tempPath });
          wx.showToast({ title: '已本地预览，部署云开发后可跨手机同步', icon: 'none' });
          return;
        }

        wx.showLoading({ title: '正在上传二维码...' });
        const cloudPath = `brochure/qr_${cardId}_${Date.now()}.png`;
        wx.cloud.uploadFile({
          cloudPath,
          filePath: tempPath,
          success: (uploadRes) => {
            wx.hideLoading();
            this.setData({ 'editForm.wechatQr': uploadRes.fileID });
            wx.showToast({ title: '二维码已上传至云端', icon: 'success' });
          },
          fail: () => {
            wx.hideLoading();
            this.setData({ 'editForm.wechatQr': tempPath });
            wx.showToast({ title: '云存储未就绪，暂用本地预览', icon: 'none' });
          }
        });
      }
    });
  },

  clearWechatQr() {
    this.setData({ 'editForm.wechatQr': '' });
  },

  saveBrochureEdit() {
    const { title, greeting, brandName, tagline, phone, wechat, wechatQr, aboutContent } = this.data.editForm;
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
        wechat: wechat.trim() || c.wechat,
        wechatQr: wechatQr || ''
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
    wx.showToast({ title: '已同步云端，全网客户免发版生效', icon: 'success' });
  },

  openVisitorModal() {
    this.setData({ visitorModalVisible: true });
    this.refreshVisitors();
  },

  closeVisitorModal() {
    this.setData({ visitorModalVisible: false });
  },

  refreshVisitors() {
    wx.showLoading({ title: '读取访客记录...' });
    consultStore.getBrochureVisitors().then(res => {
      wx.hideLoading();
      this.setData({
        visitorSource: res.source || 'local',
        visitorStats: res.stats || {},
        visitorList: res.list || []
      });
    });
  },

  goToServices() {
    wx.switchTab({ url: '/pages/services/services' });
  },

  goToCases() {
    wx.switchTab({ url: '/pages/cases/cases' });
  },

  onShareAppMessage() {
    const cardId = (this.data.activeCard && this.data.activeCard.cardId) || 'CARD-001';
    const myUid = consultStore.getMyOpenid();
    consultStore.trackBrochureEvent('share', {
      cardId,
      fromOpenid: this.fromOpenid
    }).then(trackRes => {
      if (trackRes && trackRes.brochure) {
        this.syncBrochureState(trackRes.brochure);
      }
    });
    const title = (this.data.brochure && this.data.brochure.title) || '岩值商业咨询 · 公司简介';
    return {
      title,
      path: `/pages/brochure/brochure?cardId=${cardId}&fromUid=${myUid}`,
      imageUrl: '/images/avatar.png'
    };
  },

  onShareTimeline() {
    const cardId = (this.data.activeCard && this.data.activeCard.cardId) || 'CARD-001';
    const myUid = consultStore.getMyOpenid();
    consultStore.trackBrochureEvent('share', {
      cardId,
      fromOpenid: this.fromOpenid
    });
    const title = (this.data.brochure && this.data.brochure.title) || '岩值商业咨询 · 公司简介';
    return {
      title,
      query: `cardId=${cardId}&fromUid=${myUid}`,
      imageUrl: '/images/avatar.png'
    };
  }
});
