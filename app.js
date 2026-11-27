// app.js
const consultStore = require('./utils/consultStore');

App({
  onLaunch() {
    console.log('岩姐商业咨询小程序初始化成功');
    if (wx.cloud) {
      wx.cloud.init({
        env: consultStore.CLOUD_ENV_ID,
        traceUser: true
      });
    }
    // 初始化本地默认数据并尝试与微信云开发同步
    consultStore.getProjects();
    consultStore.syncFromCloud();
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
