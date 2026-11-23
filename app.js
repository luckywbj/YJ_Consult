// app.js
const consultStore = require('./utils/consultStore');

App({
  onLaunch() {
    console.log('岩姐商业咨询小程序初始化成功');
    // 初始化咨询订单、每次咨询过程与交付结果数据中心
    consultStore.getProjects();
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
