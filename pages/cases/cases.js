// pages/cases/cases.js
const consultStore = require('../../utils/consultStore');

Page({
  data: {
    categories: ['全部'],
    currentCategory: '全部',
    activeCase: null,
    casesList: [],
    filteredCases: []
  },

  onLoad() {
    this.syncBrandCases();
  },

  onShow() {
    this.syncBrandCases();
  },

  syncBrandCases() {
    const brand = consultStore.getBrandConfig();
    const casesList = brand.cases || [];
    const uniqueCats = [];
    casesList.forEach(c => {
      if (c.category && !uniqueCats.includes(c.category)) {
        uniqueCats.push(c.category);
      }
    });
    const categories = ['全部', ...uniqueCats];
    const currentCategory = categories.includes(this.data.currentCategory) ? this.data.currentCategory : '全部';
    if (brand && brand.navTitle) {
      wx.setNavigationBarTitle({ title: `${brand.navTitle} · 案例` });
    }

    this.setData({
      casesList,
      categories,
      currentCategory
    }, () => {
      this.filterCases();
    });
  },

  onShareAppMessage() {
    const brand = consultStore.getBrandConfig();
    return {
      title: `${brand.navTitle} · 实战操盘案例`,
      path: consultStore.getPortalPath()
    };
  },

  switchCategory(e) {
    const cat = e.currentTarget.dataset.cat;
    this.setData({ currentCategory: cat }, () => {
      this.filterCases();
    });
  },

  filterCases() {
    const { currentCategory, casesList } = this.data;
    if (currentCategory === '全部') {
      this.setData({ filteredCases: casesList });
    } else {
      const filtered = casesList.filter(item => item.category === currentCategory);
      this.setData({ filteredCases: filtered });
    }
  },

  viewDetail(e) {
    const id = e.currentTarget.dataset.id;
    const target = this.data.casesList.find(c => c.id === id);
    if (target) {
      this.setData({ activeCase: target });
    }
  },

  closeDetail() {
    this.setData({ activeCase: null });
  },

  preventBubble() {},

  appointForCase() {
    this.setData({ activeCase: null });
    wx.switchTab({ url: '/pages/services/services' });
  }
});
