// pages/mine/mine.js
Page({
  data: {
    appointments: [],
    faqList: [
      {
        q: '什么样的企业适合找岩姐做商业咨询？',
        a: '已经拥有成熟产品或交付能力，但客单价较低、销售很辛苦、利润微薄，希望通过重构顶层商业模型、打造奢侈品高溢价交付的创始人及高管团队。',
        open: false
      },
      {
        q: '1对1 闭门私董会是如何交付的？',
        a: '审核通过后，岩姐将与创始人进行 3 小时面对面或高密闭门推演，直击商业卡点，并现场产出针对您行业的《高客单破局行动路线图》。',
        open: false
      },
      {
        q: '没有奢侈品行业背景，也能运用奢侈品思维吗？',
        a: '当然！奢侈品思维的本质是“制造稀缺价值、建立深层情感认同与定价权”。无论是美业、知识IP、定制家居还是传统制造业，都可以用这套底层逻辑打破价格战。',
        open: false
      }
    ]
  },

  onShow() {
    this.loadAppointments();
  },

  loadAppointments() {
    const list = wx.getStorageSync('my_consult_appointments') || [];
    this.setData({ appointments: list });
  },

  toggleFaq(e) {
    const idx = e.currentTarget.dataset.index;
    const list = this.data.faqList;
    list[idx].open = !list[idx].open;
    this.setData({ faqList: list });
  },

  copyWechat() {
    wx.setClipboardData({
      data: 'yanjie_consulting',
      success: () => {
        wx.showToast({ title: '顾问微信号已复制', icon: 'success' });
      }
    });
  },

  callHotline() {
    wx.makePhoneCall({
      phoneNumber: '4008809966',
      fail: () => {
        wx.showToast({ title: '暂未唤起拨号', icon: 'none' });
      }
    });
  },

  openAbout() {
    wx.showModal({
      title: '岩姐商业咨询',
      content: '使命：让每个IP抓住属于自己的风口\n愿景：让每一个初创企业都能享受一流的商业咨询服务\n理念：所有行业都值得用奢侈品思维重做一遍',
      showCancel: false,
      confirmText: '知晓',
      confirmColor: '#8D6238'
    });
  }
});
