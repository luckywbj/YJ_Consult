// pages/cases/cases.js
Page({
  data: {
    categories: ['全部', '高客单操盘', 'IP商业变现', '奢侈品全案', '实体转型'],
    currentCategory: '全部',
    activeCase: null,
    casesList: [
      {
        id: 'c1',
        category: '高客单操盘',
        badge: '单月业绩突破 680W',
        title: '某高端医美与大健康连锁：从价格战泥潭跃迁至高客单奢侈品服务体系',
        summary: '原本依赖打折促销获客，人效低、利润薄。经岩姐团队重构顶层商业价值后，打造 10 倍溢价私域闭环。',
        beforeVal: '客单 800元 · 利润率 12%',
        afterVal: '高客单 2.98万 · 利润率 65%',
        coreStrategy: '剔除走量耗品，植入奢侈品情绪价值交付链，打造销冠级价值陈述话术。',
        clientName: '张总（上海知名医美机构创始人）',
        detailBackground: '机构经营 4 年，长期被团购平台低价抽佣绑架，客户粘性极差，员工每天忙碌却濒临亏损。',
        detailSolution: '岩姐咨询入场后，砍掉低毛利引流品，基于高端客户终身价值（LTV）设计三阶梯奢侈品产品矩阵，并赋能核心销售顾问高端成交心理学。',
        results: [
          '首期闭门会销发售突破 320 万元',
          '单客终身价值从 2,400 元提升至 58,000 元',
          '顺利搭建 8 人精细化高端私董运营团队'
        ],
        clientFeedback: '岩姐的奢侈品思维真正帮我们敲醒了！原来不是客户没钱，是我们一直在用批发思维卖黄金。'
      },
      {
        id: 'c2',
        category: 'IP商业变现',
        badge: '从0到1完成千万元私域交付',
        title: '商业知识博主IP全案：重塑产品矩阵与年框私董会发售操盘',
        summary: '粉丝量达 50 万但仅靠低价录播课变现，遇瓶颈。岩姐团队操盘重塑个人定位，推出高客单顾问年框。',
        beforeVal: '单课 199元 · 粉丝变现难',
        afterVal: '私董 4.98万/年 · 首期爆满',
        coreStrategy: '从课程售卖者转型为高净值企业战略陪跑者，构建私域高信任度闭环转化漏斗。',
        clientName: '陈老师（财经商业领域头部IP）',
        detailBackground: '虽然拥有几十万短视频粉丝，但转化一直在 99~299 的低客单课程打转，交付成本高且变现天花板明显。',
        detailSolution: '为其量身打造“岩姐咨询奢侈品IP操盘模型”，将原有课程沉淀为底层资产，主力推出仅限 30 席的年度战略私董会，并全程督导发售流程。',
        results: [
          '私董会首发 48 小时即全部售罄，总营收超 360 万',
          '客户复购率与深度转介绍率高达 45%',
          '成功跑通年营收千万级的轻资产顾问模式'
        ],
        clientFeedback: '跟着岩姐做咨询，才明白顶级 IP 卖的永远是认知势能与圈层价值，少走了至少三年弯路！'
      },
      {
        id: 'c3',
        category: '奢侈品全案',
        badge: '毛利率提升 400%',
        title: '传统定制珠宝品牌：颠覆批发代工，重构极致情感溢价商业模型',
        summary: '替海外大牌代工毛利微薄。通过岩姐咨询植入奢侈品叙事与高定私域会所模式，夺回定价权。',
        beforeVal: '代工毛利 15% · 账期漫长',
        afterVal: '品牌高定毛利 72% · 全款预定',
        coreStrategy: '构建独特家族传承叙事资产，从单纯卖材质转向卖人生高光时刻纪念价值。',
        clientName: '林女士（珠宝高定品牌主理人）',
        detailBackground: '家族从事珠宝代工 12 年，随着原材料与人工成本上涨，利润被压缩至边缘，急需打造自主高端品牌。',
        detailSolution: '进行全案品牌战略重构，制定奢侈品级服务标准 SOP，建立一对一私享品鉴会机制，完成从“代工厂”到“高定珠宝策展人”的身份跃迁。',
        results: [
          '自主品牌单季销售额超越过去全年纯利',
          '客户平均转介绍系数达 1 : 2.4',
          '成功入驻核心商圈顶级私享艺术空间'
        ],
        clientFeedback: '岩姐教我们的不仅是方法论，更是一种对商业尊严的坚守，让我们真正敢于开出高价。'
      },
      {
        id: 'c4',
        category: '实体转型',
        badge: '团队人效提升 3.8倍',
        title: '高端家居与软装企业：打破区域限制，打造线上+线下高转化销售铁军',
        summary: '受线下自然客流萎缩影响严重，进店率断崖式下滑。经咨询辅导后打造高净值同城全域获客与成交系统。',
        beforeVal: '月均成单 3~5 户 · 获客成本高',
        afterVal: '月均成单 22 户 · 全款排单至半年后',
        coreStrategy: '打造全案设计师个人 IP，以顾问式咨询替代推销，建立全生命周期服务口碑。',
        clientName: '赵总（华南家居生活馆董事长）',
        detailBackground: '大型卖场租金昂贵且流量枯竭，销售人员习惯等客上门，缺乏主动触达高净值业主的能力。',
        detailSolution: '重塑前线团队为“空间美学商业顾问”，辅导团队运用顾问式探寻问答，精准切入千万级豪宅业主的深层生活方式诉求。',
        results: [
          '客单成交均价由 12 万元提升至 48 万元',
          '销售转化周期缩短 50%',
          '实现了完全不依赖卖场自然流的自循环造血'
        ],
        clientFeedback: '岩姐的体系落地性极强，不是空中楼阁，团队第二天就能上手用，效果立竿见影。'
      }
    ]
  },

  onLoad() {
    this.filterCases();
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
