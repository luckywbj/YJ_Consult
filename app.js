// app.js
App({
  onLaunch() {
    console.log('岩姐商业咨询小程序初始化成功');
    // 初始化本地存储的预约数据
    if (!wx.getStorageSync('my_consult_appointments')) {
      wx.setStorageSync('my_consult_appointments', [
        {
          id: 'YY2026112001',
          name: '李总',
          phone: '138****8899',
          industry: '高端私域美业',
          type: '1对1商业闭门私董会',
          status: '已安排顾问对接',
          createTime: '2026-11-18 14:30'
        }
      ]);
    }
  },
  globalData: {
    brandName: '岩姐咨询',
    slogan: '所有行业都值得用奢侈品思维重做一遍',
    consultant: {
      name: '岩姐',
      title: '高客单商业操盘手 · 奢侈品思维导师',
      wechat: 'yanjie_consulting',
      phone: '400-880-9966',
      intro: '专注于高端品牌破局与10倍客单商业模式操盘，累计赋能300+高净值创始团队。'
    }
  }
});
