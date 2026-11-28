// utils/consultStore.js
// 高客单商业咨询 SaaS 平台 · 多租户（工作室）隔离 + 多角色权限 + 白牌化品牌装修数据中心
//
// 数据隔离层级：
//   平台（1 个小程序 AppID） → 工作室 tenantId（每位导师一个账号） → 客户项目（按手机号隔离）
// 迁移云开发时：每张集合加 tenantId 字段，云函数按 tenantId + openid 过滤即可。

const STORAGE_KEY = 'yj_saas_projects_v4';
const AUTH_KEY = 'yj_saas_auth_session_v1';
const TENANTS_KEY = 'yj_saas_tenants_v1';
const CURRENT_TENANT_KEY = 'yj_saas_current_tenant_v1';
const BRAND_KEY_PREFIX = 'yj_saas_brand_';
const CLIENT_PASSWORDS_KEY = 'yj_saas_client_passwords_v1';
const BROCHURE_KEY_PREFIX = 'yj_saas_brochure_';
const PLATFORM_PASSCODE = '9999'; // 平台方（您本人）超级管理员口令
const DEFAULT_TENANT_ID = 'tenant_yanjie';
const TRIAL_DAYS = 14;

// 5步全闭环交付标准流程
const DELIVERY_STEPS = [
  { step: 1, code: '01', title: '资质初筛', desc: '评估企业经营现状，匹配咨询方案与首席顾问排期' },
  { step: 2, code: '02', title: '深度问诊', desc: '全维度剖析客群画像、定价模式、销售卡点与交付链路' },
  { step: 3, code: '03', title: '全案输出', desc: '产出可执行、可衡量的 10 倍客单跃迁操盘方案与SOP' },
  { step: 4, code: '04', title: '陪跑落地', desc: '辅导团队打通成交闭环，协助高客单品鉴/发售落地' },
  { step: 5, code: '05', title: '复盘迭代', desc: '复盘核心业绩指标增长率，完成结案验收与资产沉淀' }
];

// ==================== 三大行业标品预设母版（供销售演示一键切换） ====================

const INDUSTRY_PRESETS = {
  // 预设1：岩姐商业咨询（默认母版）
  yanjie: {
    presetKey: 'yanjie',
    navTitle: '岩姐咨询',
    brandName: '岩 姐 咨 询',
    brandSubtitle: 'YANJIE BUSINESS CONSULTING',
    mission: '让每个IP抓住属于自己的风口',
    vision: '让每一个初创企业都能享受一流的商业咨询服务',
    philosophy: '所有行业都值得用奢侈品思维重做一遍',
    mentorName: '岩姐',
    mentorBadge: '首席商业操盘顾问',
    mentorTitle: '高客单商业操盘手 · 奢侈品思维导师',
    mentorMotto: '“做商业，不要做平庸的追随者，要做稀缺的价值定义者。”',
    stat1Num: '300+',
    stat1Tag: '高端企业私董',
    stat2Num: '10倍+',
    stat2Tag: '客单溢价操盘',
    stat3Num: '98.5%',
    stat3Tag: '好评满意度',
    wechat: 'yanjie_consulting',
    phone: '400-880-9966',
    adminPasscode: '8888',
    services: [
      {
        id: 's1',
        tier: '旗舰单品 · 深度问诊',
        name: '1对1 商业闭门深度私董会',
        price: 29800,
        priceText: '¥29,800 / 场',
        deposit: 2980,
        depositText: '¥2,980',
        quota: '每月仅限 5 席',
        target: '年营收500万以上、客单价遇瓶颈的企业主 / 知识商业IP',
        deliverables: [
          '3小时面对面闭门深度商业逻辑推演',
          '重构企业“奢侈品思维”产品定价与溢价体系',
          '独家定制《企业高客单破局行动路线图》',
          '交付后 14 天顾问团队答疑答辩追踪'
        ]
      },
      {
        id: 's2',
        tier: '全案赋能 · 体系操盘',
        name: '高客单商业操盘全案',
        price: 128000,
        priceText: '¥128,000 / 季',
        deposit: 10000,
        depositText: '¥10,000',
        quota: '每季度仅接 2 席',
        target: '希望打造销冠级成交体系与高转化会销漏斗的成熟团队',
        deliverables: [
          '顾问团队进驻调研，拆解现有产品交付漏洞',
          '全套奢侈品成交话术库、朋友圈发售剧本SOP输出',
          '现场销冠级高客单谈单培训与模拟演练',
          '全程协助落地一场高产出发售活动'
        ]
      },
      {
        id: 's3',
        tier: '长期陪跑 · 顶层协同',
        name: '年度战略商业顾问（限额）',
        price: 360000,
        priceText: '¥360,000 / 年',
        deposit: 30000,
        depositText: '¥30,000',
        quota: '全年仅开放 3 个席位',
        target: '志在成为细分赛道领头羊的高成长型企业',
        deliverables: [
          '全年战略股东级定期闭门复盘与经营研讨',
          '重大商业并购、合伙人机制、融资顶层设计把关',
          '高净值商业圈层与异业核心生态资源引荐',
          '随时为创始人提供重大商业决策参谋支持'
        ]
      }
    ],
    cases: [
      {
        id: 'c1',
        category: '高客单操盘',
        badge: '单月业绩突破 680W',
        title: '某高端医美与大健康连锁：从价格战泥潭跃迁至高客单奢侈品服务体系',
        summary: '原本依赖打折促销获客，人效低、利润薄。经重构顶层商业价值后，打造 10 倍溢价私域闭环。',
        beforeVal: '客单 800元 · 利润率 12%',
        afterVal: '高客单 2.98万 · 利润率 65%',
        coreStrategy: '剔除走量耗品，植入奢侈品情绪价值交付链，打造销冠级价值陈述话术。',
        clientName: '张总（上海知名医美机构创始人）',
        detailBackground: '机构经营 4 年，长期被团购平台低价抽佣绑架，客户粘性极差，员工每天忙碌却濒临亏损。',
        detailSolution: '咨询团队入场后，砍掉低毛利引流品，基于高端客户终身价值（LTV）设计三阶梯奢侈品产品矩阵，并赋能核心销售顾问高端成交心理学。',
        results: [
          '首期闭门会销发售突破 320 万元',
          '单客终身价值从 2,400 元提升至 58,000 元',
          '顺利搭建 8 人精细化高端私董运营团队'
        ],
        clientFeedback: '奢侈品思维真正帮我们敲醒了！原来不是客户没钱，是我们一直在用批发思维卖黄金。'
      },
      {
        id: 'c2',
        category: 'IP商业变现',
        badge: '从0到1完成千万元私域交付',
        title: '商业知识博主IP全案：重塑产品矩阵与年框私董会发售操盘',
        summary: '粉丝量达 50 万但仅靠低价录播课变现，遇瓶颈。团队操盘重塑个人定位，推出高客单顾问年框。',
        beforeVal: '单课 199元 · 粉丝变现难',
        afterVal: '私董 4.98万/年 · 首期爆满',
        coreStrategy: '从课程售卖者转型为高净值企业战略陪跑者，构建私域高信任度闭环转化漏斗。',
        clientName: '陈老师（财经商业领域头部IP）',
        detailBackground: '虽然拥有几十万短视频粉丝，但转化一直在 99~299 的低客单课程打转，交付成本高且变现天花板明显。',
        detailSolution: '为其量身打造“奢侈品IP操盘模型”，将原有课程沉淀为底层资产，主力推出仅限 30 席的年度战略私董会，并全程督导发售流程。',
        results: [
          '私董会首发 48 小时即全部售罄，总营收超 360 万',
          '客户复购率与深度转介绍率高达 45%',
          '成功跑通年营收千万级的轻资产顾问模式'
        ],
        clientFeedback: '做完深度咨询才明白顶级 IP 卖的永远是认知势能与圈层价值，少走了至少三年弯路！'
      },
      {
        id: 'c3',
        category: '奢侈品全案',
        badge: '毛利率提升 400%',
        title: '传统定制珠宝品牌：颠覆批发代工，重构极致情感溢价商业模型',
        summary: '替海外大牌代工毛利微薄。通过植入奢侈品叙事与高定私域会所模式，夺回定价权。',
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
        clientFeedback: '教我们的不仅是方法论，更是一种对商业尊严的坚守，让我们真正敢于开出高价。'
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
        clientFeedback: '体系落地性极强，不是空中楼阁，团队第二天就能上手用，效果立竿见影。'
      }
    ]
  },

  // 预设2：卓远财税与股权战略私董会（向财税/法律/管理咨询机构演示标品时一键切换）
  finance: {
    presetKey: 'finance',
    navTitle: '卓远财税战略',
    brandName: '卓 远 财 税 私 董',
    brandSubtitle: 'ZHUOYUAN TAX & EQUITY ADVISORY',
    mission: '让每一家成长型民营企业账算得清、钱分得明、税交得安',
    vision: '成为中国高净值家族与拟上市企业最信赖的顶层架构伙伴',
    philosophy: '顶层股权与合规财税，是企业最大的隐形印钞机',
    mentorName: '周远山',
    mentorBadge: '首席股权与财税架构师',
    mentorTitle: '前四大合伙人 · 百亿级民企财税顶层操盘手',
    mentorMotto: '“不懂财税顶层设计的赚钱，只是在替风险打工。”',
    stat1Num: '180+',
    stat1Tag: '上市公司/独角兽顾问',
    stat2Num: '24亿+',
    stat2Tag: '累计合规节税降本',
    stat3Num: '100%',
    stat3Tag: '零合规风险交付',
    wechat: 'zhuoyuan_advisory',
    phone: '400-660-8899',
    adminPasscode: '8888',
    services: [
      {
        id: 's1',
        tier: '顶层问诊 · 风险排雷',
        name: '1对1 企业历史财税隐患与股权闭门诊断',
        price: 38000,
        priceText: '¥38,000 / 场',
        deposit: 3800,
        depositText: '¥3,800',
        quota: '每月仅限 6 家企业',
        target: '年营收3000万以上、存在两套账或股权代持隐患的创始人',
        deliverables: [
          '4小时核心账务与历史税务风险深度穿透体检',
          '创始人家族财富隔离与防火墙顶层设计推演',
          '输出《企业财税合规整改与节税降本路线图》',
          '30天专属税务师与法务团队跟踪答疑'
        ]
      },
      {
        id: 's2',
        tier: '架构重塑 · 利润倍增',
        name: '高管合伙人股权激励与集团税务筹划全案',
        price: 168000,
        priceText: '¥168,000 / 案',
        deposit: 16800,
        depositText: '¥16,800',
        quota: '每季度限接 3 家',
        target: '准备引入核心高管合伙、多主体集团化运作的成长期企业',
        deliverables: [
          '三层股权架构（家族控股+有限合伙+业务主体）搭建',
          '动态虚拟股与超额利润分红激励协议全套法律文件',
          '供应链、研发与跨域交易合规税负优化方案落地',
          '主持召开高管股权激励宣讲会与签约仪式'
        ]
      },
      {
        id: 's3',
        tier: '资本陪跑 · 外部CFO',
        name: '年度战略外部 CFO 陪跑顾问',
        price: 480000,
        priceText: '¥480,000 / 年',
        deposit: 50000,
        depositText: '¥50,000',
        quota: '全年仅限 3 席',
        target: '冲刺并购重组、Pre-IPO融资或亿元级利润规模的龙头企业',
        deliverables: [
          '月度经营财务分析董事会与全面预算管理体系落地',
          '融资尽调辅导、估值模型搭建与投资人谈判陪跑',
          '家族信托、跨境架构与二代接班顶层筹划',
          '全年重大商业合同财税法三重合规联审'
        ]
      }
    ],
    cases: [
      {
        id: 'fc1',
        category: '财税合规操盘',
        badge: '年均合规节税 860W',
        title: '某跨境电商亿级卖家：化解历史金税四期预警，重构香港+境内双层合规架构',
        summary: '原采用个人卡收付款与买单出口，面临巨额补税风险。经3个月全案重构实现阳光化高毛利运作。',
        beforeVal: '个人卡流水2亿 · 风险极高',
        afterVal: '全链路阳光退税 · 综合税负降62%',
        coreStrategy: '搭建海外控股+境内研发技术服务+跨境供应链多主体协同架构，打通出口退税闭环。',
        clientName: '刘总（深圳头部出海品牌董事长）',
        detailBackground: '企业年营收破2亿，但长期存在公私混同与发票缺口，融资尽调被一票否决。',
        detailSolution: '卓远团队驻场梳理近3年资金流，完成历史违规剥离，新设主体承接核心知识产权并申请高新资质与合规退税。',
        results: [
          '每年新增合规出口退税与税收优惠超 860 万元',
          '顺利通过一线美元基金财务尽调，获 5000 万 A 轮融资',
          '创始人家族资产与企业经营负债实现 100% 法律隔离'
        ],
        clientFeedback: '周老师团队不仅帮我们睡上了安稳觉，光退税和节税省下的钱就是咨询费的几十倍！'
      },
      {
        id: 'fc2',
        category: '股权合伙机制',
        badge: '核心高管人效翻倍',
        title: '某连锁餐饮集团（80家门店）：导入门店裂变合伙人制度，半年净开店35家',
        summary: '直营店长积极性差、损耗高。通过设计“在岗分红股+裂变母子店合伙机制”，彻底点燃团队创业狼性。',
        beforeVal: '店长流失率35% · 净利仅7%',
        afterVal: '店长零流失 · 门店净利达19%',
        coreStrategy: '不动用创始人实股，采用“超额利润阶梯分红+新店跟投优先权”绑定核心店长。',
        clientName: '吴董事长（知名连锁餐饮品牌创始人）',
        detailBackground: '门店超过50家后管理半径失控，总部督导成本极高，优秀店长纷纷跳槽单干。',
        detailSolution: '量身定制全套《门店裂变合伙人章程》与财务核算大屏，让店长从“打工者”变成“算清账的经营合伙人”。',
        results: [
          '首期合伙人大会现场募集内部骨干跟投金 1,450 万元',
          '老店单店平均食材损耗下降 4.2 个百分点',
          '半年内由老店长裂变孵化 35 家高盈利新店'
        ],
        clientFeedback: '以前总怕分股失去控制权，卓远设计的合伙机制既锁住了控制权，又让员工像老板一样拼命！'
      }
    ]
  },

  // 预设3：东方奢美·医美与大健康高定增长院（向美业/大健康/门店咨询机构演示时一键切换）
  aesthetics: {
    presetKey: 'aesthetics',
    navTitle: '东方奢美增长院',
    brandName: '东 方 奢 美 增 长 院',
    brandSubtitle: 'ORIENTAL AESTHETICS GROWTH INSTITUTE',
    mission: '赋能中国千万美业与大健康主理人告别低价内卷',
    vision: '打造1000家年利润破千万的殿堂级高定美学空间',
    philosophy: '美业卖的从来不是单个项目，而是高净值女性的终身状态管理',
    mentorName: '苏婉清',
    mentorBadge: '美业千万大单操盘导师',
    mentorTitle: '高定双美私域增长第一人 · 殿堂级沙龙会销导师',
    mentorMotto: '“把门店做成名媛的第三精神客厅，千万业绩只是顺带的结果。”',
    stat1Num: '500+',
    stat1Tag: '赋能高定双美机构',
    stat2Num: '39.8万',
    stat2Tag: '单客年度最高成交品项',
    stat3Num: '96.8%',
    stat3Tag: '沙龙现场收单率',
    wechat: 'suwanqing_vip',
    phone: '400-990-7788',
    adminPasscode: '8888',
    services: [
      {
        id: 's1',
        tier: '爆品破局 · 门店诊断',
        name: '1对1 门店品项架构与百万卡项重新定价',
        price: 25800,
        priceText: '¥25,800 / 店',
        deposit: 2580,
        depositText: '¥2,580',
        quota: '每月限接 8 家门店',
        target: '月业绩卡在20~50万、客单价低于3000元的生美/轻医美主理人',
        deliverables: [
          '全店现有品项毛利诊断，砍除低效耗卡项目',
          '定制「1.98万年度冻龄卡」与「6.8万私密抗衰黑卡」品项表',
          '输出美学顾问 1V1 升单面诊黄金话术剧本',
          '五感六觉殿堂级门店接待动线改造清单'
        ]
      },
      {
        id: 's2',
        tier: '驻店陪跑 · 沙龙爆破',
        name: '名媛闭门私享品鉴会全案驻店操盘',
        price: 98000,
        priceText: '¥98,000 / 场',
        deposit: 9800,
        depositText: '¥9,800',
        quota: '每月仅限 3 场驻店',
        target: '拥有30位以上高净值老客、希望单场沙龙收款破百万的机构',
        deliverables: [
          '操盘导师带队驻店 5 天 4 夜，一对一盘客与锁客铺垫',
          '定制高格调艺术/国学/名媛下午茶沙龙全流程策划',
          '导师亲自登台主讲或现场坐镇1V1大单逼单谈单',
          '保底构建高客单老带新裂变转介绍闭环'
        ]
      },
      {
        id: 's3',
        tier: '连锁孵化 · 品牌联创',
        name: '千万级区域美业龙头年度战略联创陪跑',
        price: 298000,
        priceText: '¥298,000 / 年',
        deposit: 30000,
        depositText: '¥30,000',
        quota: '全年限额 5 家',
        target: '多店连锁、希望打造自有高定品牌与销冠铁军的区域美业巨头',
        deliverables: [
          '全年 4 场季度百万级高定品鉴发售会全程督导',
          '主理人高定短视频与私域人设 IP 全案打造',
          '店长与美学设计师高激励合伙人薪酬体系落地',
          '严选高毛利大健康/抗衰供应链直通对接'
        ]
      }
    ],
    cases: [
      {
        id: 'ac1',
        category: '名媛沙龙收单',
        badge: '单场26人收款 186W',
        title: '杭州某800平生活美容会所：零广告投放，依靠26位老客闭门茶会两天收款186万',
        summary: '原门店死磕99元洗脸团购，员工疲于奔命。导入高定品项与东方美学茶会模式后，单客均价突破7万元。',
        beforeVal: '月流水18万 · 濒临闭店',
        afterVal: '两天收现186万 · 净利75%',
        coreStrategy: '将传统促销会销升级为“宋韵美学私享家宴”，以全周期抗衰定制方案替代零散卖卡。',
        clientName: '周院长（杭州高端美学空间主理人）',
        detailBackground: '房租与人工每月固定支出15万，客户到店只耗卡不升单，美容师集体缺乏自信。',
        detailSolution: '苏老师团队驻店盘点出32位沉睡A类老客，重新设计6.8万年度名媛卡，并手把手辅导美容师用“闺蜜式深度关怀”完成会前铺垫。',
        results: [
          '到场26位老客，现场成交19单6.8万黑卡与12单3.98万私享卡',
          '老客现场主动转介绍闺蜜14人，实现零成本拓新',
          '美容师当月人均提成突破3万元，团队士气彻底引爆'
        ],
        clientFeedback: '从来没敢想我们的老客户能一次性刷6.8万不眨眼！苏老师的品项和沙龙体系太神了！'
      }
    ]
  }
};

// ==================== 白牌化品牌配置读写接口 ====================

// 臻言咨询平台通用中性门户配置（未进入具体工作室 / 导师退出登录后展示，不含任何特定导师个人品牌）
const PLATFORM_DEFAULT_BRAND = {
  isPlatformDefault: true,
  presetKey: 'platform',
  logo: '/images/logo-zhenyan.png',
  navTitle: '臻言咨询',
  brandName: '臻 言 咨 询',
  brandSubtitle: 'ZHENYAN BUSINESS ADVISORY PLATFORM',
  mission: '汇聚严选商业导师，为企业提供专业、可落地的数字化咨询交付系统',
  vision: '一个账号拥有独立工作室 · 咨询过程留档 · 交付成果可追踪',
  philosophy: '每位导师都是独立咨询空间 · 客户商业机密严格一对一隔离',
  mentorName: '臻言严选导师团',
  mentorBadge: '臻言咨询官方平台',
  mentorTitle: '支持商业策略 / 财税股权 / 美业连锁等专业咨询团队入驻',
  mentorMotto: '“无需自建服务器与小程序，10秒开通属于你的臻言独立咨询工作室。”',
  stat1Num: '1个账号',
  stat1Tag: '拥有独立咨询系统',
  stat2Num: '100%',
  stat2Tag: '跨工作室数据隔离',
  stat3Num: '5步闭环',
  stat3Tag: '全程留档交付成果',
  wechat: 'zhenyan_advisory',
  phone: '400-880-6699',
  services: INDUSTRY_PRESETS.yanjie.services,
  cases: INDUSTRY_PRESETS.yanjie.cases
};

function brandKey(tenantId) {
  return BRAND_KEY_PREFIX + tenantId;
}

// 读取某个工作室的品牌配置；若当前未进入任何工作室（平台中性态），返回平台通用配置
function getBrandConfig(tenantId) {
  const id = tenantId || getCurrentTenantId();
  if (!id) {
    return JSON.parse(JSON.stringify(PLATFORM_DEFAULT_BRAND));
  }
  let cfg = wx.getStorageSync(brandKey(id));
  if (!cfg || !cfg.brandName) {
    const tenant = getTenantById(id);
    const preset = INDUSTRY_PRESETS[(tenant && tenant.presetKey) || 'yanjie'] || INDUSTRY_PRESETS.yanjie;
    cfg = JSON.parse(JSON.stringify(preset));
    wx.setStorageSync(brandKey(id), cfg);
  }
  return cfg;
}

// 同步品牌名/导师名到工作室注册表（平台总控台展示用）
function syncTenantFromBrand(tenantId, cfg) {
  const tenants = getTenants();
  const t = tenants.find(x => x.tenantId === tenantId);
  if (!t) return;
  if (cfg.navTitle) t.studioName = cfg.navTitle;
  if (cfg.mentorName) t.mentorName = cfg.mentorName;
  if (cfg.presetKey) t.presetKey = cfg.presetKey;
  saveTenants(tenants);
}

function saveBrandConfig(newConfig) {
  const id = getCurrentTenantId();
  const merged = {
    ...getBrandConfig(id),
    ...newConfig
  };
  wx.setStorageSync(brandKey(id), merged);
  syncTenantFromBrand(id, merged);
  return merged;
}

// 为当前工作室一键套用行业模板（只影响自己的工作室，不影响其他导师）
function applyIndustryPreset(presetKey) {
  const id = getCurrentTenantId();
  const preset = INDUSTRY_PRESETS[presetKey] || INDUSTRY_PRESETS.yanjie;
  const copy = JSON.parse(JSON.stringify(preset));
  wx.setStorageSync(brandKey(id), copy);
  syncTenantFromBrand(id, copy);
  return copy;
}

// 后台新增一个实战成功案例到当前标品配置
function addBrandCase(caseItem) {
  const cfg = getBrandConfig();
  const newCase = {
    id: 'c_' + Date.now().toString().slice(-6),
    category: (caseItem.category || '高客单操盘').trim(),
    badge: (caseItem.badge || '业绩倍增标杆').trim(),
    title: (caseItem.title || '').trim(),
    summary: (caseItem.summary || '').trim(),
    beforeVal: (caseItem.beforeVal || '').trim(),
    afterVal: (caseItem.afterVal || '').trim(),
    coreStrategy: (caseItem.coreStrategy || '').trim(),
    clientName: (caseItem.clientName || '').trim(),
    detailBackground: (caseItem.detailBackground || caseItem.summary || '').trim(),
    detailSolution: (caseItem.detailSolution || caseItem.coreStrategy || '').trim(),
    results: (caseItem.resultsText || '首期高客单发售圆满收官\n客户客单价与复购率实现倍数级跃升')
      .split(/[\n；;]/)
      .map(s => s.trim())
      .filter(Boolean),
    clientFeedback: (caseItem.clientFeedback || '体系落地性极强，团队第二天就能上手拿到大单结果！').trim()
  };
  cfg.cases.unshift(newCase);
  wx.setStorageSync(brandKey(getCurrentTenantId()), cfg);
  return cfg;
}

// ==================== 默认演示咨询交付项目数据 ====================

function getDefaultProjects() {
  const list = [
    {
      id: 'YY2026112001',
      tenantId: 'tenant_yanjie',
      name: '李总',
      phone: '13888888899',
      industry: '高端私域美业（轻医美连锁）',
      problem: '门店长期依赖低价团购引流，顾问不敢报高价，高净值客户留存与升单困难。',
      type: '高客单商业操盘全案',
      planId: 's2',
      totalPrice: 128000,
      paidAmount: 128000,
      payMode: '已付全款 · 正式立项',
      status: '服务进行中',
      currentStep: 4,
      stepName: '04 陪跑落地',
      consultant: '首席操盘顾问团队',
      createTime: '2026-11-10 14:30',
      updateTime: '2026-11-22 18:20',
      metrics: {
        ticketBefore: '¥1,200',
        ticketAfter: '¥29,800',
        marginBefore: '18%',
        marginAfter: '68%',
        revenueBefore: '42万/月',
        revenueAfter: '215万/月',
        conversionBefore: '4.5%',
        conversionAfter: '38.0%',
        highlightSummary: '首轮高定私享沙龙针对 18 位种子老客现场转化 7 单 2.98万 年度美学卡与 2 单 9.8万 家族黑卡，单周高客单回款突破 40.46 万元。'
      },
      sessions: [
        {
          sessionId: 'SES-102',
          sessionNo: 2,
          title: '奢侈品成交话术植入与首场闭门私享会发售彩排',
          date: '2026-11-18 14:00 - 17:30',
          mode: '腾讯会议 + 核心顾问1V1通关演练',
          participants: '首席导师、李总、门店店长及6名高级美学顾问',
          diagnosis: '销售顾问在报出 2.98 万以上价格时心理发虚，习惯性主动打折让利，缺乏“顾问式价值探寻”与情绪价值铺垫能力。',
          solution: '导入独创「3阶奢侈品价值锚定话术」，将推销单次项目转化为“定制年度年轻态身份方案”，现场逐一通关考核 6 名核心顾问，并敲定周六闭门沙龙促单动线。',
          consultantNote: '团队执行力极强，店长在模拟演练后第二天即用新话术拿下了首单 2.98万 试水成交！',
          clientRating: 0,
          clientFeedback: '',
          clientFeedbackTime: '',
          consultantReply: '',
          consultantReplyTime: '',
          actionItems: [
            {
              id: 'ACT-201',
              text: '6名高定顾问完成 1V1 谈单剧本通关演练录音打卡',
              done: true,
              feedback: '全员已通关，店长已成功开出首单 2.98万！'
            },
            {
              id: 'ACT-202',
              text: '定向邀约 20 位 A 类种子老客参加本周六「东方奢美闭门品鉴沙龙」',
              done: false,
              feedback: '目前已确认到场 16 位，剩余 4 位正在一对一跟进确认。'
            }
          ]
        },
        {
          sessionId: 'SES-101',
          sessionNo: 1,
          title: '顶层商业模式诊断与低毛利引流品砍除推演',
          date: '2026-11-12 14:00 - 17:30',
          mode: '私董会所 · 线下闭门推演',
          participants: '首席导师、李总（创始人）、运营总监',
          diagnosis: '门店过度依赖 399/699 团购引流，顾问每天接待大量羊毛党沦为客服，真正有消费力的高净值客户缺乏专属升单阶梯，净利率不足 12%。',
          solution: '果断砍掉 70% 低效走量耗品，围绕“抗衰长效管理 + 名媛圈层身份认同”重构「2.98万年度美学私享卡」与「9.8万家族高定黑卡」双层高客单产品矩阵。',
          consultantNote: '创始人认知升级非常快，当场拍板停止低价团购投放，全力转向私域高客单深耕。',
          clientRating: 5,
          clientFeedback: '第一次跟导师做完底层商业模式拆解，一下看清了之前忙着低价团购却不赚钱的死结！高定黑卡分层设计非常落地，当晚我们就开会拍板执行了。',
          clientFeedbackTime: '2026-11-12 20:15',
          consultantReply: '收到李总反馈！执行果断就是核心竞争力，接下来重点盯好 TOP 50 老客分级与 VIP 问诊室落地细节。',
          consultantReplyTime: '2026-11-12 20:42',
          actionItems: [
            {
              id: 'ACT-101',
              text: '盘点近12个月消费满1万元的 TOP 50 种子客户名单并完成资产分级',
              done: true,
              feedback: '已由店长梳理完毕，共筛选出 62 位高潜 VIP 客户档案。'
            },
            {
              id: 'ACT-102',
              text: '下架亏损团购引流单品，按照奢侈品接待标准改造 VIP 私密问诊室',
              done: true,
              feedback: '已全面替换门店烫金价目册、香氛茶歇与私密接待室动线。'
            }
          ]
        }
      ],
      deliverables: [
        {
          delivId: 'DEL-301',
          stage: '04 陪跑落地',
          title: '《首场闭门私享品鉴会全流程执行手册与朋友圈7天发售剧本》',
          fileType: 'PDF / 方案全案',
          deliverTime: '2026-11-19 11:00',
          status: '待客户验收',
          summary: '包含闭门沙龙五感体验动线设计、私信邀约话术、现场主讲人促单节奏控制，以及会后 48 小时高客单追单 SOP。'
        },
        {
          delivId: 'DEL-201',
          stage: '03 全案输出',
          title: '《奢侈品级顾问 1V1 高客单成交话术SOP及价格异议处理库》',
          fileType: 'PDF / 话术手册',
          deliverTime: '2026-11-16 16:30',
          status: '已确认验收',
          summary: '涵盖高净值客户破冰探寻 12 问、情绪价值锚定公式、面对“太贵了/考虑一下”的 8 种高维化解剧本。'
        },
        {
          delivId: 'DEL-101',
          stage: '02 深度问诊',
          title: '《高端美业 10 倍客单商业模式重构蓝图与定价矩阵表》',
          fileType: 'PDF / 战略蓝图',
          deliverTime: '2026-11-13 10:20',
          status: '已确认验收',
          summary: '明确引流品、利润品、尊享高定黑卡的三阶定价模型、权益拆解及顾问高激励提成方案。'
        }
      ],
      clientReview: ''
    },
    {
      id: 'YY2026110502',
      tenantId: 'tenant_yanjie',
      name: '陈老师',
      phone: '13988885520',
      industry: '商业财经知识IP（50万粉丝）',
      problem: '短视频粉丝50万，但变现停留在199元录播课，交付重、天花板低。',
      type: '1对1 商业闭门深度私董会',
      planId: 's1',
      totalPrice: 29800,
      paidAmount: 29800,
      payMode: '已付全款 · 圆满结案',
      status: '已交付结案',
      currentStep: 5,
      stepName: '05 复盘迭代',
      consultant: '首席商业操盘手',
      createTime: '2026-11-02 10:15',
      updateTime: '2026-11-15 20:00',
      metrics: {
        ticketBefore: '¥199',
        ticketAfter: '¥49,800/年',
        marginBefore: '25%',
        marginAfter: '82%',
        revenueBefore: '18万/月',
        revenueAfter: '360万/首期',
        conversionBefore: '1.2%',
        conversionAfter: '28.5%',
        highlightSummary: '完成从“卖低价课博主”向“高净值企业战略陪跑导师”的身份跃迁，首期 30 席年度战略私董会 48 小时全部售罄，总收款超 360 万元。'
      },
      sessions: [
        {
          sessionId: 'SES-201',
          sessionNo: 1,
          title: 'IP 商业定位升维与 4.98 万年度私董会发售全链路推演',
          date: '2026-11-05 14:00 - 17:30',
          mode: '1V1 闭门深度推演（3.5小时）',
          participants: '首席导师、陈老师及内容合伙人',
          diagnosis: '将大量精力消耗在 199 元社群答疑上，吸引的都是价格敏感型散户，遮蔽了陈老师真正擅长的企业顶层战略咨询势能。',
          solution: '将原有 199 元课程转为高门槛筛选问卷赠品，主力推出仅限 30 席的「4.98万/年 创始人战略私董会」，重构朋友圈 10 天高势能发售叙事。',
          consultantNote: '首发当晚即成交 19 席，48 小时 30 席满员收官，轻资产高客单模型彻底跑通。',
          actionItems: [
            {
              id: 'ACT-301',
              text: '发布《致 30 位破局创始人的一封信》开启私董会资质审核通道',
              done: true,
              feedback: '首日收到 142 份企业主申请表，筛选出 45 位符合千万营收门槛的准客户。'
            },
            {
              id: 'ACT-302',
              text: '按定制的「1V1 语音诊断逼单SOP」完成前 30 名意向创始人的定向沟通',
              done: true,
              feedback: '48 小时内 30 个名额全部全款锁定，总营收 360 万！'
            }
          ]
        }
      ],
      deliverables: [
        {
          delivId: 'DEL-401',
          stage: '03 全案输出',
          title: '《知识 IP 高客单私董会产品架构与 48 小时爆单发售剧本》',
          fileType: 'PDF / 操盘路线图',
          deliverTime: '2026-11-06 12:00',
          status: '已确认验收',
          summary: '包含年度私董会交付权益设计、申请表筛选漏斗、朋友圈造势 10 篇文案模板及 1V1 高客单成交清单。'
        }
      ],
      clientReview: '做完 3 小时闭门推演，彻底打通了高客单任督二脉！以前卖 199 的课累死累活，现在 4.98 万的私董会客户反而更加尊重和感激我们。'
    }
  ];
  return list.concat(getOtherTenantDemoProjects());
}

// 其他演示工作室的客户项目（用于演示「导师与导师之间数据完全隔离」）
function buildDemoProject(o) {
  return {
    id: o.id,
    tenantId: o.tenantId,
    name: o.name,
    phone: o.phone,
    industry: o.industry,
    problem: o.problem,
    type: o.type,
    planId: o.planId,
    totalPrice: o.price,
    paidAmount: o.price,
    payMode: `已付全款 ¥${o.price.toLocaleString()}`,
    status: '服务进行中',
    currentStep: o.step,
    stepName: DELIVERY_STEPS[o.step - 1].code + ' ' + DELIVERY_STEPS[o.step - 1].title,
    consultant: o.consultant,
    createTime: o.createTime,
    updateTime: o.createTime,
    metrics: o.metrics,
    sessions: [
      {
        sessionId: o.id + '-S1',
        sessionNo: 1,
        title: o.sessionTitle,
        date: o.createTime,
        mode: '1V1 线下闭门推演',
        participants: o.participants,
        diagnosis: o.diagnosis,
        solution: o.solution,
        consultantNote: o.note,
        actionItems: o.actions.map((text, i) => ({
          id: o.id + '-A' + i,
          text,
          done: i === 0,
          feedback: i === 0 ? '已按要求完成并提交顾问审阅。' : ''
        }))
      }
    ],
    deliverables: [
      {
        delivId: o.id + '-D1',
        stage: '03 全案输出',
        title: o.delivTitle,
        fileType: 'PDF / 操盘全案',
        deliverTime: o.createTime,
        status: '待客户验收',
        summary: o.delivSummary
      }
    ],
    clientReview: ''
  };
}

function getOtherTenantDemoProjects() {
  return [
    buildDemoProject({
      id: 'ZY2026111501',
      tenantId: 'tenant_finance',
      name: '刘总',
      phone: '13700000001',
      industry: '跨境电商（年营收2亿）',
      problem: '长期个人卡收款，面临金税四期补税预警，融资尽调被否。',
      type: '高管合伙人股权激励与集团税务筹划全案',
      planId: 's2',
      price: 168000,
      step: 3,
      consultant: '周远山 · 首席股权与财税架构师',
      createTime: '2026-11-15 10:00',
      metrics: {
        ticketBefore: '综合税负 31%',
        ticketAfter: '综合税负 11.8%',
        marginBefore: '净利 6%',
        marginAfter: '净利 17%',
        revenueBefore: '个人卡流水2亿',
        revenueAfter: '全链路阳光化',
        conversionBefore: '尽调未通过',
        conversionAfter: '已获A轮TS',
        highlightSummary: '完成香港控股+境内研发主体双层架构搭建，预计年度合规节税 860 万元。'
      },
      sessionTitle: '历史资金流穿透体检与三层股权架构推演',
      participants: '周远山、刘总、财务总监',
      diagnosis: '公私账户混同、发票缺口巨大，创始人家族资产与企业负债未隔离。',
      solution: '新设海外控股与境内研发技术服务主体，分步完成历史违规剥离与出口退税闭环。',
      note: '本周内务必完成近三年银行流水归集，下次会议进入架构落地。',
      actions: ['归集近三年全部对公/对私银行流水', '确认家族持股平台合伙人名单'],
      delivTitle: '《跨境集团合规架构重组与节税路线图》',
      delivSummary: '包含三层股权架构图、主体职能划分、关联交易定价原则及分步整改时间表。'
    }),
    buildDemoProject({
      id: 'DF2026111802',
      tenantId: 'tenant_aesthetics',
      name: '周院长',
      phone: '13700000002',
      industry: '高端生活美容会所（800平）',
      problem: '依赖99元团购，月流水18万濒临闭店，美容师不敢升单。',
      type: '名媛闭门私享品鉴会全案驻店操盘',
      planId: 's2',
      price: 98000,
      step: 4,
      consultant: '苏婉清 · 美业千万大单操盘导师',
      createTime: '2026-11-18 14:00',
      metrics: {
        ticketBefore: '¥99',
        ticketAfter: '¥68,000',
        marginBefore: '12%',
        marginAfter: '75%',
        revenueBefore: '18万/月',
        revenueAfter: '186万/两天',
        conversionBefore: '2%',
        conversionAfter: '73%',
        highlightSummary: '26位老客闭门茶会现场成交19单6.8万黑卡，两天收现186万元。'
      },
      sessionTitle: '沉睡老客盘点与宋韵美学私享家宴策划',
      participants: '苏婉清、周院长、店长及5名美容师',
      diagnosis: '老客只耗卡不升单，美容师缺乏面诊升单话术与自信。',
      solution: '盘出32位A类沉睡老客，重设6.8万年度名媛卡，导入闺蜜式会前铺垫SOP。',
      note: '会前7天铺垫是成败关键，每位美容师每天至少深度触达3位老客。',
      actions: ['完成32位A类老客资产分级表', '每位美容师完成10次升单话术通关录音'],
      delivTitle: '《宋韵美学私享家宴全流程执行手册》',
      delivSummary: '含邀约话术、五感动线、主讲节奏、现场逼单分工与会后48小时追单SOP。'
    })
  ];
}

// ==================== 多租户：工作室（导师账号）注册表 ====================

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(base, days) {
  const d = new Date(base.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

function getDefaultTenants() {
  return [
    {
      tenantId: 'tenant_yanjie',
      studioName: '岩姐咨询',
      mentorName: '岩姐',
      ownerPhone: '13800000001',
      password: '8888',
      presetKey: 'yanjie',
      plan: '旗舰私董交付版',
      status: 'active',
      createTime: '2026-11-01',
      expireTime: '2027-11-01'
    },
    {
      tenantId: 'tenant_finance',
      studioName: '卓远财税战略',
      mentorName: '周远山',
      ownerPhone: '13800000002',
      password: '8888',
      presetKey: 'finance',
      plan: '标准独立品牌版',
      status: 'active',
      createTime: '2026-11-05',
      expireTime: '2027-11-05'
    },
    {
      tenantId: 'tenant_aesthetics',
      studioName: '东方奢美增长院',
      mentorName: '苏婉清',
      ownerPhone: '13800000003',
      password: '8888',
      presetKey: 'aesthetics',
      plan: '免费试用版',
      status: 'active',
      createTime: '2026-11-20',
      expireTime: formatDate(addDays(new Date(), 7))
    }
  ];
}

function getTenants() {
  let list = wx.getStorageSync(TENANTS_KEY);
  if (!list || !Array.isArray(list) || list.length === 0) {
    list = getDefaultTenants();
    wx.setStorageSync(TENANTS_KEY, list);
  }
  return list;
}

function saveTenants(list) {
  wx.setStorageSync(TENANTS_KEY, list);
}

function getTenantById(id) {
  return getTenants().find(t => t.tenantId === id) || null;
}

// 当前正在访问的工作室（空字符串表示处于平台通用中性门户，未进入具体导师系统）
function getCurrentTenantId() {
  const id = wx.getStorageSync(CURRENT_TENANT_KEY);
  if (id && getTenantById(id)) return id;
  return '';
}

function getCurrentTenant() {
  const id = getCurrentTenantId();
  return id ? getTenantById(id) : null;
}

function setCurrentTenant(tenantId) {
  if (!tenantId || !getTenantById(tenantId)) return false;
  wx.setStorageSync(CURRENT_TENANT_KEY, tenantId);
  return true;
}

function clearCurrentTenant() {
  wx.removeStorageSync(CURRENT_TENANT_KEY);
}

// 工作室服务状态（到期 / 冻结 / 试用剩余天数）
function getTenantStatus(tenant) {
  if (!tenant) return { ok: false, label: '工作室不存在', daysLeft: 0 };
  if (tenant.status === 'frozen') return { ok: false, label: '已冻结', daysLeft: 0 };
  const today = new Date(formatDate(new Date()).replace(/-/g, '/'));
  const expire = new Date(String(tenant.expireTime).replace(/-/g, '/'));
  const daysLeft = Math.ceil((expire - today) / 86400000);
  if (daysLeft < 0) return { ok: false, label: '已到期', daysLeft: 0 };
  return {
    ok: true,
    label: `${tenant.plan} · 剩余 ${daysLeft} 天`,
    daysLeft,
    warning: daysLeft <= 7
  };
}

function getPortalPath(tenantId) {
  const id = tenantId || getCurrentTenantId();
  return id ? `/pages/index/index?tenantId=${id}` : '/pages/index/index';
}

function spacedTitle(name) {
  const s = (name || '').trim();
  return s.length > 0 && s.length <= 8 ? s.split('').join(' ') : s;
}

// 开通新工作室：导师自助注册（14 天试用）或平台代开（正式版）
function registerTenant(payload, options = {}) {
  const studioName = (payload.studioName || '').trim();
  const mentorName = (payload.mentorName || '').trim();
  const phone = (payload.phone || '').trim();
  const password = (payload.password || '').trim();

  if (!studioName) return { ok: false, msg: '请填写工作室 / 品牌名称' };
  if (!mentorName) return { ok: false, msg: '请填写首席导师姓名' };
  if (!/^1\d{10}$/.test(phone)) return { ok: false, msg: '请填写 11 位手机号作为登录账号' };
  if (password.length < 4) return { ok: false, msg: '登录密码至少 4 位' };

  const tenants = getTenants();
  if (tenants.some(t => t.ownerPhone === phone)) {
    return { ok: false, msg: '该手机号已开通过工作室，请直接登录' };
  }

  const byPlatform = !!options.byPlatform;
  const now = new Date();
  const presetKey = INDUSTRY_PRESETS[payload.presetKey] ? payload.presetKey : 'yanjie';
  const tenant = {
    tenantId: 't_' + Date.now().toString(36),
    studioName,
    mentorName,
    ownerPhone: phone,
    password,
    presetKey,
    plan: byPlatform ? (payload.plan || '标准独立品牌版') : '免费试用版',
    status: 'active',
    createTime: formatDate(now),
    expireTime: formatDate(addDays(now, byPlatform ? 365 : TRIAL_DAYS))
  };
  tenants.push(tenant);
  saveTenants(tenants);

  // 以行业模板为底稿，生成该工作室独立的品牌配置（导师随后可在「标品装修」中改成自己的内容）
  const brand = JSON.parse(JSON.stringify(INDUSTRY_PRESETS[presetKey]));
  brand.navTitle = studioName;
  brand.brandName = spacedTitle(studioName);
  brand.brandSubtitle = 'PRIVATE CONSULTING STUDIO';
  brand.mentorName = mentorName;
  brand.mentorBadge = '首席咨询顾问';
  brand.wechat = (payload.wechat || '').trim() || brand.wechat;
  brand.phone = phone;
  wx.setStorageSync(brandKey(tenant.tenantId), brand);

  // 导师自助开通后自动登录进入自己的工作室后台
  if (!byPlatform) {
    setCurrentTenant(tenant.tenantId);
    wx.setStorageSync(AUTH_KEY, {
      role: 'admin',
      tenantId: tenant.tenantId,
      clientPhone: '',
      clientName: '',
      staffName: `${mentorName} · ${studioName}`
    });
  }
  return { ok: true, tenant };
}

// ==================== 平台方（您本人）总控操作 ====================

function renewTenant(tenantId, days = 365, plan = '标准独立品牌版') {
  const tenants = getTenants();
  const t = tenants.find(x => x.tenantId === tenantId);
  if (!t) return null;
  const today = new Date();
  const currentExpire = new Date(String(t.expireTime).replace(/-/g, '/'));
  const base = currentExpire > today ? currentExpire : today;
  t.expireTime = formatDate(addDays(base, days));
  t.plan = plan;
  t.status = 'active';
  saveTenants(tenants);
  return t;
}

function toggleFreezeTenant(tenantId) {
  const tenants = getTenants();
  const t = tenants.find(x => x.tenantId === tenantId);
  if (!t) return null;
  t.status = t.status === 'frozen' ? 'active' : 'frozen';
  saveTenants(tenants);
  return t;
}

// 平台汇总看板：每个工作室的客户数与立项金额
function getTenantStats() {
  const projects = getProjects();
  return getTenants().map(t => {
    const own = projects.filter(p => p.tenantId === t.tenantId);
    return {
      ...t,
      statusInfo: getTenantStatus(t),
      projectCount: own.length,
      paidTotal: own.reduce((sum, p) => sum + (Number(p.paidAmount) || 0), 0)
    };
  });
}

// 平台代管：直接进入某个工作室后台（用于帮客户装修、排查问题）
function platformEnterTenant(tenantId) {
  const t = getTenantById(tenantId);
  if (!t) return null;
  setCurrentTenant(tenantId);
  wx.setStorageSync(AUTH_KEY, {
    role: 'admin',
    tenantId,
    clientPhone: '',
    clientName: '',
    staffName: `平台代管 · ${t.studioName}`,
    byPlatform: true
  });
  return t;
}

// 演示用：当前工作室下的客户手机号提示（正式上线请删除）
// 平台入口（tenantId 为空）时展示跨工作室代表客户及所属工作室名，方便演示自动路由登录
function getDemoClientHints() {
  const tenantId = getCurrentTenantId();
  const seen = {};
  if (tenantId) {
    return getProjects()
      .filter(p => p.tenantId === tenantId && !seen[p.phone] && (seen[p.phone] = true))
      .slice(0, 3)
      .map(p => ({ name: p.name, phone: p.phone }));
  }
  return getProjects()
    .filter(p => p.tenantId && !seen[p.phone] && (seen[p.phone] = true))
    .slice(0, 3)
    .map(p => {
      const studio = getTenantById(p.tenantId);
      return {
        name: p.name,
        phone: p.phone,
        studioName: studio ? studio.studioName : ''
      };
    });
}

// 平台首页公开展示的严选导师列表（仅暴露安全公开字段，不含手机号/密码等私密信息）
function getPublicMentors() {
  return getTenants()
    .filter(t => getTenantStatus(t).ok)
    .map(t => {
      const brand = getBrandConfig(t.tenantId);
      return {
        tenantId: t.tenantId,
        studioName: t.studioName,
        mentorName: t.mentorName || brand.mentorName || '',
        mentorBadge: brand.mentorBadge || '严选导师',
        mentorTitle: brand.mentorTitle || '',
        philosophy: brand.philosophy || '',
        stat1Num: brand.stat1Num || '',
        stat1Tag: brand.stat1Tag || '',
        stat2Num: brand.stat2Num || '',
        stat2Tag: brand.stat2Tag || ''
      };
    });
}

// ==================== 登录与权限会话管理 ====================

const GUEST_SESSION = {
  role: 'guest',
  tenantId: '',
  clientPhone: '',
  clientName: '',
  staffName: ''
};

function getRawSession() {
  const session = wx.getStorageSync(AUTH_KEY);
  return session && session.role ? session : { ...GUEST_SESSION };
}

// 返回「在当前工作室下」的有效身份：
// 客户 / 导师的会话绑定了 tenantId，访问其他工作室时自动降级为访客，确保导师与导师之间完全隔离
function getAuthSession() {
  const session = getRawSession();
  if (session.role === 'platform') return session;
  if (session.tenantId && session.tenantId !== getCurrentTenantId()) {
    return { ...GUEST_SESSION };
  }
  return session;
}

function isPlatformSession() {
  const s = getRawSession();
  return s.role === 'platform' || !!s.byPlatform;
}

// ==================== 客户专属密码管理 ====================

function defaultPasswordFromPhone(phone) {
  const clean = (phone || '').replace(/\s+/g, '');
  return clean.length >= 6 ? clean.slice(-6) : '123456';
}

function generateRandomPassword() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function getClientPasswordMap() {
  const map = wx.getStorageSync(CLIENT_PASSWORDS_KEY);
  return map && typeof map === 'object' ? map : {};
}

function saveClientPasswordMap(map) {
  wx.setStorageSync(CLIENT_PASSWORDS_KEY, map);
}

function getClientPassword(phone) {
  const cleanPhone = (phone || '').trim();
  if (!cleanPhone) return '';
  const map = getClientPasswordMap();
  if (typeof map[cleanPhone] === 'string' && map[cleanPhone]) {
    return map[cleanPhone];
  }
  return defaultPasswordFromPhone(cleanPhone);
}

function setClientPassword(phone, password) {
  const cleanPhone = (phone || '').trim();
  const cleanPass = (password || '').trim();
  if (!cleanPhone) return { ok: false, msg: '手机号不能为空' };
  if (cleanPass.length < 4) return { ok: false, msg: '登录密码不能少于 4 位' };
  const map = getClientPasswordMap();
  map[cleanPhone] = cleanPass;
  saveClientPasswordMap(map);
  return { ok: true, password: cleanPass };
}

function changeClientPassword(phone, oldPass, newPass) {
  const cleanPhone = (phone || '').trim();
  const cleanOld = (oldPass || '').trim();
  const cleanNew = (newPass || '').trim();
  if (!cleanPhone) return { ok: false, msg: '未检测到登录手机号' };
  if (!cleanOld) return { ok: false, msg: '请输入原登录密码' };
  if (cleanOld !== getClientPassword(cleanPhone)) return { ok: false, msg: '原登录密码不正确' };
  if (cleanNew.length < 4) return { ok: false, msg: '新密码不能少于 4 位' };
  return setClientPassword(cleanPhone, cleanNew);
}

function resetClientPassword(phone, customPassword) {
  const targetPass = (customPassword || '').trim() || generateRandomPassword();
  return setClientPassword(phone, targetPass);
}

function loginAsClient(phone, password) {
  const cleanPhone = (phone || '').trim();
  const cleanPass = (password || '').trim();
  if (!cleanPhone) {
    return { ok: false, msg: '请输入您下单时预留的手机号' };
  }
  if (!cleanPass) {
    return { ok: false, msg: '请输入专属登录密码' };
  }

  const currentTid = getCurrentTenantId();
  const all = getProjects();

  if (currentTid) {
    // 已在具体工作室内：严格按当前工作室隔离校验
    const matched = all.filter(p => p.phone === cleanPhone && p.tenantId === currentTid);
    if (matched.length === 0) {
      return {
        ok: false,
        msg: '未查询到该手机号名下的咨询项目，请先在线下单或联系顾问建档'
      };
    }
    if (cleanPass !== getClientPassword(cleanPhone)) {
      return {
        ok: false,
        msg: '登录密码不正确，请核对后重试或联系导师重置'
      };
    }
    const session = {
      role: 'client',
      tenantId: currentTid,
      clientPhone: cleanPhone,
      clientName: matched[0].name,
      staffName: ''
    };
    wx.setStorageSync(AUTH_KEY, session);
    return { ok: true, session, count: matched.length, autoRoutedStudio: '' };
  }

  // 处于平台总入口：先校验手机号是否有项目及密码是否正确，再自动路由到所属工作室
  const matchedAll = all.filter(p => p.phone === cleanPhone && p.tenantId);
  if (matchedAll.length === 0) {
    return {
      ok: false,
      msg: '未查询到该手机号名下的咨询项目，请先预约立项或联系顾问建档'
    };
  }
  if (cleanPass !== getClientPassword(cleanPhone)) {
    return {
      ok: false,
      msg: '登录密码不正确，请核对后重试或联系导师重置'
    };
  }
  const targetTid = matchedAll[0].tenantId;
  const studio = getTenantById(targetTid);
  if (!studio) {
    return { ok: false, msg: '所属导师工作室不存在，请联系平台客服' };
  }
  setCurrentTenant(targetTid);
  const tenantMatches = matchedAll.filter(p => p.tenantId === targetTid);
  const session = {
    role: 'client',
    tenantId: targetTid,
    clientPhone: cleanPhone,
    clientName: tenantMatches[0].name,
    staffName: ''
  };
  wx.setStorageSync(AUTH_KEY, session);
  return {
    ok: true,
    session,
    count: tenantMatches.length,
    autoRoutedStudio: studio.studioName
  };
}

// 导师（工作室主理人）登录：手机号 + 密码，登录后自动切换到自己的工作室
function loginAsMentor(phone, password) {
  const cleanPhone = (phone || '').trim();
  const cleanPass = (password || '').trim();
  if (!cleanPhone) return { ok: false, msg: '请输入工作室登录手机号' };

  const tenant = getTenants().find(t => t.ownerPhone === cleanPhone);
  if (!tenant) {
    return { ok: false, msg: '该手机号尚未开通工作室，请先「开通我的咨询工作室」' };
  }
  if (tenant.password !== cleanPass) {
    return { ok: false, msg: '工作室登录密码不正确' };
  }
  const status = getTenantStatus(tenant);
  if (!status.ok) {
    return { ok: false, msg: `该工作室${status.label}，请联系平台续费后再登录` };
  }

  setCurrentTenant(tenant.tenantId);
  const session = {
    role: 'admin',
    tenantId: tenant.tenantId,
    clientPhone: '',
    clientName: '',
    staffName: `${tenant.mentorName} · ${tenant.studioName}`
  };
  wx.setStorageSync(AUTH_KEY, session);
  return { ok: true, session, tenant };
}

// 兼容旧入口：只输密码时，按当前访问的工作室校验
function loginAsAdmin(passcode) {
  const tenant = getCurrentTenant();
  return loginAsMentor(tenant ? tenant.ownerPhone : '', passcode);
}

// 平台方超级管理员登录（管理所有工作室：开号 / 续费 / 冻结 / 代管）
function loginAsPlatform(passcode) {
  if ((passcode || '').trim() !== PLATFORM_PASSCODE) {
    return { ok: false, msg: '平台管理口令不正确（演示口令：9999）' };
  }
  const session = {
    role: 'platform',
    tenantId: '',
    clientPhone: '',
    clientName: '',
    staffName: '平台超级管理员'
  };
  wx.setStorageSync(AUTH_KEY, session);
  return { ok: true, session };
}

// 退出登录：
// 导师/平台管理员退出时，同时退出当前工作室，回到平台中性通用门户（不再残留上一位导师的品牌）
function logout(options = {}) {
  const prev = getRawSession();
  const guestSession = {
    role: 'guest',
    tenantId: '',
    clientPhone: '',
    clientName: '',
    staffName: ''
  };
  wx.setStorageSync(AUTH_KEY, guestSession);
  if (prev.role === 'admin' || prev.role === 'platform' || options.exitStudio) {
    clearCurrentTenant();
  }
  return guestSession;
}

// 双重隔离：先按工作室 tenantId 隔离，再按客户手机号隔离
function getVisibleProjects() {
  const session = getAuthSession();
  const tenantId = getCurrentTenantId();
  if (!tenantId) return [];
  const tenantProjects = getProjects().filter(p => p.tenantId === tenantId);
  if (session.role === 'admin') {
    return tenantProjects;
  }
  if (session.role === 'client' && session.clientPhone) {
    return tenantProjects.filter(p => p.phone === session.clientPhone);
  }
  return [];
}

function canAccessProject(project) {
  if (!project) return false;
  const session = getAuthSession();
  if (project.tenantId !== getCurrentTenantId()) return false;
  if (session.role === 'admin') return true;
  if (session.role === 'client' && session.clientPhone === project.phone) return true;
  return false;
}

// ==================== 项目数据读写 ====================

function getProjects() {
  let list = wx.getStorageSync(STORAGE_KEY);
  if (!list || !Array.isArray(list) || list.length === 0) {
    list = getDefaultProjects();
    wx.setStorageSync(STORAGE_KEY, list);
  }
  return list;
}

function saveProjects(list) {
  wx.setStorageSync(STORAGE_KEY, list);
}

function getProjectById(id) {
  const visible = getVisibleProjects();
  if (visible.length === 0) return null;
  if (id) {
    const found = visible.find(item => item.id === id);
    if (found) return found;
  }
  return visible[0];
}

function createOrder(payload) {
  const list = getProjects();
  const targetTenantId = (payload.tenantId && getTenantById(payload.tenantId))
    ? payload.tenantId
    : getCurrentTenantId();
  const cfg = getBrandConfig(targetTenantId);
  const catalog = cfg.services || INDUSTRY_PRESETS.yanjie.services;
  const plan = catalog.find(s => s.name === payload.type) || catalog[0];
  const isPaid = payload.isPaid;
  const payType = payload.payType || 'deposit';

  let paidAmount = 0;
  let payMode = '待顾问初审确认';
  let status = '待初审';
  let currentStep = 1;
  let stepName = '01 资质初筛';

  if (isPaid) {
    paidAmount = payType === 'full' ? Number(plan.price) : Number(plan.deposit);
    payMode = payType === 'full' ? `已付全款 ¥${Number(plan.price).toLocaleString()}` : `已付定金 ¥${Number(plan.deposit).toLocaleString()}`;
    status = '服务进行中';
    currentStep = 2;
    stepName = '02 深度问诊';
  }

  const cleanName = (payload.name || '').trim();
  const cleanPhone = (payload.phone || '').trim();
  const nowStr = formatTime(new Date());

  const newOrder = {
    id: 'YY' + Date.now().toString().slice(-8),
    tenantId: targetTenantId,
    name: cleanName,
    phone: cleanPhone,
    industry: (payload.industry || '未注明行业').trim(),
    problem: (payload.problem || '希望突破客单价瓶颈，重塑高溢价商业模型').trim(),
    type: plan.name,
    planId: plan.id,
    totalPrice: Number(plan.price),
    paidAmount: paidAmount,
    payMode: payMode,
    status: status,
    currentStep: currentStep,
    stepName: stepName,
    consultant: `${cfg.mentorName} · 首席操盘顾问团队`,
    createTime: nowStr,
    updateTime: nowStr,
    metrics: {
      ticketBefore: payload.ticketBefore || '待首次问诊录入',
      ticketAfter: '操盘推进中',
      marginBefore: '待调研',
      marginAfter: '操盘推进中',
      revenueBefore: payload.revenueBefore || '待首次问诊录入',
      revenueAfter: '操盘推进中',
      conversionBefore: '待调研',
      conversionAfter: '操盘推进中',
      highlightSummary: isPaid
        ? `项目已正式立项！${cfg.mentorName}顾问团队已为您开通专属咨询空间，正在为您准备首次 1V1 深度问诊推演清单。`
        : '您的商业咨询申请已提交，顾问团队将在 24 小时内完成资质初筛并与您对接。'
    },
    sessions: [
      {
        sessionId: 'SES-' + Date.now().toString().slice(-5),
        sessionNo: 1,
        title: '首次 1V1 商业诊断与底层问题盘点（排期筹备中）',
        date: nowStr + '（预约排期）',
        mode: '线上预沟通 + 1V1 闭门深度问诊',
        participants: `${cfg.mentorName}首席顾问、${cleanName}`,
        diagnosis: `客户核心诉求：${(payload.problem || '期待突破低客单内卷，打造高溢价商业闭环').trim()}`,
        solution: '首次问诊将重点拆解现有产品线利润结构、目标高净值客群画像，并制定第一阶段高客单破局切入点。',
        consultantNote: isPaid ? '客户已支付立项，优先安排本周核心排期。' : '待顾问与客户确认具体问诊时间。',
        clientRating: 0,
        clientFeedback: '',
        clientFeedbackTime: '',
        consultantReply: '',
        consultantReplyTime: '',
        actionItems: [
          {
            id: 'ACT-' + Date.now().toString().slice(-4) + '1',
            text: '梳理企业近半年主营产品/服务客单价与毛利率现状表',
            done: false,
            feedback: ''
          },
          {
            id: 'ACT-' + Date.now().toString().slice(-4) + '2',
            text: '准备 3 个过往最成功的高客单客户成交案例供问诊拆解',
            done: false,
            feedback: ''
          }
        ]
      }
    ],
    deliverables: [
      {
        delivId: 'DEL-' + Date.now().toString().slice(-5),
        stage: '01 资质初筛',
        title: `《${(payload.industry || '企业').trim()} · ${cfg.navTitle}诊前调研与立项说明书》`,
        fileType: 'PDF / 立项清单',
        deliverTime: nowStr,
        status: isPaid ? '待客户验收' : '已生成预案',
        summary: `针对【${plan.name}】定制的诊前准备指南、核心经营数据采集表及 5 步全闭环交付排期计划。`
      }
    ],
    clientReview: ''
  };

  list.unshift(newOrder);
  saveProjects(list);

  // 为该客户手机号初始化或更新专属登录密码
  const passMap = getClientPasswordMap();
  const customPass = (payload.clientPassword || '').trim();
  if (customPass.length >= 4) {
    passMap[cleanPhone] = customPass;
    saveClientPasswordMap(passMap);
  } else if (!passMap[cleanPhone]) {
    passMap[cleanPhone] = defaultPasswordFromPhone(cleanPhone);
    saveClientPasswordMap(passMap);
  }
  newOrder.assignedPassword = getClientPassword(cleanPhone);

  const currentSession = getAuthSession();
  if (!payload.fromAdmin && currentSession.role !== 'admin') {
    if (targetTenantId) {
      setCurrentTenant(targetTenantId);
    }
    wx.setStorageSync(AUTH_KEY, {
      role: 'client',
      tenantId: targetTenantId,
      clientPhone: cleanPhone,
      clientName: cleanName,
      staffName: ''
    });
  }

  return newOrder;
}

function payForProject(projectId, payType = 'deposit') {
  const list = getProjects();
  const idx = list.findIndex(p => p.id === projectId);
  if (idx === -1) return null;

  const proj = list[idx];
  const cfg = getBrandConfig();
  const catalog = cfg.services || INDUSTRY_PRESETS.yanjie.services;
  const plan = catalog.find(s => s.name === proj.type) || catalog[0];
  proj.paidAmount = payType === 'full' ? Number(plan.price) : Number(plan.deposit);
  proj.payMode = payType === 'full' ? `已付全款 ¥${Number(plan.price).toLocaleString()}` : `已付定金 ¥${Number(plan.deposit).toLocaleString()}`;
  proj.status = '服务进行中';
  if (proj.currentStep < 2) {
    proj.currentStep = 2;
    proj.stepName = '02 深度问诊';
  }
  proj.updateTime = formatTime(new Date());
  proj.metrics.highlightSummary = '已完成在线支付立项，专属顾问团队已介入并开启 1V1 深度问诊阶段。';
  saveProjects(list);
  return proj;
}

function toggleActionItem(projectId, sessionId, actionId, feedbackText) {
  const list = getProjects();
  const proj = list.find(p => p.id === projectId);
  if (!proj) return null;

  const session = proj.sessions.find(s => s.sessionId === sessionId);
  if (!session) return proj;

  const act = session.actionItems.find(a => a.id === actionId);
  if (act) {
    if (typeof feedbackText === 'string') {
      act.feedback = feedbackText;
      act.done = true;
    } else {
      act.done = !act.done;
    }
    proj.updateTime = formatTime(new Date());
    saveProjects(list);
  }
  return proj;
}

function acceptDeliverable(projectId, delivId) {
  const list = getProjects();
  const proj = list.find(p => p.id === projectId);
  if (!proj) return null;

  const deliv = proj.deliverables.find(d => d.delivId === delivId);
  if (deliv) {
    deliv.status = '已确认验收';
    proj.updateTime = formatTime(new Date());
    saveProjects(list);
  }
  return proj;
}

function saveClientReview(projectId, reviewText) {
  const list = getProjects();
  const proj = list.find(p => p.id === projectId);
  if (!proj) return null;

  proj.clientReview = reviewText.trim();
  proj.updateTime = formatTime(new Date());
  saveProjects(list);
  return proj;
}

function updateProjectStep(projectId, stepNum) {
  const list = getProjects();
  const proj = list.find(p => p.id === projectId);
  if (!proj) return null;

  const stepObj = DELIVERY_STEPS.find(s => s.step === Number(stepNum)) || DELIVERY_STEPS[0];
  proj.currentStep = stepObj.step;
  proj.stepName = `${stepObj.code} ${stepObj.title}`;
  if (stepObj.step === 5) {
    proj.status = '已交付结案';
  } else {
    proj.status = '服务进行中';
  }
  proj.updateTime = formatTime(new Date());
  saveProjects(list);
  return proj;
}

function addConsultSession(projectId, sessionData) {
  const list = getProjects();
  const proj = list.find(p => p.id === projectId);
  if (!proj) return null;

  const cfg = getBrandConfig();
  const nextNo = (proj.sessions ? proj.sessions.length : 0) + 1;
  const nowStr = formatTime(new Date());

  const rawActions = (sessionData.actionsText || '')
    .split(/[\n；;]/)
    .map(s => s.trim())
    .filter(Boolean);

  const actionItems = (rawActions.length > 0 ? rawActions : ['按本次推演方案完成内部团队对齐与首轮落地测试']).map((txt, i) => ({
    id: 'ACT-' + Date.now().toString().slice(-5) + i,
    text: txt,
    done: false,
    feedback: ''
  }));

  const newSession = {
    sessionId: 'SES-' + Date.now().toString().slice(-6),
    sessionNo: nextNo,
    title: sessionData.title || `第 ${nextNo} 次商业闭门深度咨询推演`,
    date: (sessionData.date || '').trim() || nowStr,
    mode: sessionData.mode || '1V1 闭门私董会推演',
    participants: sessionData.participants || `${cfg.mentorName}、${proj.name}及核心高管`,
    diagnosis: sessionData.diagnosis || '',
    solution: sessionData.solution || '',
    consultantNote: sessionData.consultantNote || '请按课后行动清单推进执行，随时在群内及小程序反馈卡点。',
    clientRating: 0,
    clientFeedback: '',
    clientFeedbackTime: '',
    consultantReply: '',
    consultantReplyTime: '',
    actionItems: actionItems
  };

  proj.sessions.unshift(newSession);
  proj.updateTime = nowStr;
  if (proj.status === '待初审') {
    proj.status = '服务进行中';
  }
  saveProjects(list);
  return proj;
}

function updateConsultSession(projectId, sessionId, sessionData) {
  const list = getProjects();
  const proj = list.find(p => p.id === projectId);
  if (!proj || !Array.isArray(proj.sessions)) return null;

  const session = proj.sessions.find(s => s.sessionId === sessionId);
  if (!session) return proj;

  const nowStr = formatTime(new Date());
  if (typeof sessionData.title === 'string' && sessionData.title.trim()) {
    session.title = sessionData.title.trim();
  }
  if (typeof sessionData.date === 'string' && sessionData.date.trim()) {
    session.date = sessionData.date.trim();
  }
  if (typeof sessionData.mode === 'string') {
    session.mode = sessionData.mode.trim() || session.mode;
  }
  if (typeof sessionData.participants === 'string') {
    session.participants = sessionData.participants.trim() || session.participants;
  }
  if (typeof sessionData.diagnosis === 'string') {
    session.diagnosis = sessionData.diagnosis.trim();
  }
  if (typeof sessionData.solution === 'string') {
    session.solution = sessionData.solution.trim();
  }
  if (typeof sessionData.consultantNote === 'string') {
    session.consultantNote = sessionData.consultantNote.trim();
  }

  if (typeof sessionData.actionsText === 'string') {
    const rawActions = sessionData.actionsText
      .split(/[\n；;]/)
      .map(s => s.trim())
      .filter(Boolean);
    if (rawActions.length > 0) {
      const existing = Array.isArray(session.actionItems) ? session.actionItems : [];
      session.actionItems = rawActions.map((txt, i) => {
        const matched = existing.find(item => item.text === txt);
        if (matched) return matched;
        return {
          id: 'ACT-' + Date.now().toString().slice(-5) + i,
          text: txt,
          done: false,
          feedback: ''
        };
      });
    }
  }

  proj.updateTime = nowStr;
  saveProjects(list);
  return proj;
}

function saveSessionClientFeedback(projectId, sessionId, payload) {
  const list = getProjects();
  const proj = list.find(p => p.id === projectId);
  if (!proj || !Array.isArray(proj.sessions)) return null;

  const session = proj.sessions.find(s => s.sessionId === sessionId);
  if (!session) return proj;

  const rawRating = Number(payload && payload.rating);
  const clampedRating = Number.isFinite(rawRating)
    ? Math.min(5, Math.max(1, Math.round(rawRating)))
    : 5;
  const nowStr = formatTime(new Date());

  session.clientRating = clampedRating;
  session.clientFeedback = ((payload && payload.feedback) || '').trim();
  session.clientFeedbackTime = nowStr;

  proj.updateTime = nowStr;
  saveProjects(list);
  return proj;
}

function replySessionFeedback(projectId, sessionId, replyText) {
  const list = getProjects();
  const proj = list.find(p => p.id === projectId);
  if (!proj || !Array.isArray(proj.sessions)) return null;

  const session = proj.sessions.find(s => s.sessionId === sessionId);
  if (!session) return proj;

  const nowStr = formatTime(new Date());
  session.consultantReply = (replyText || '').trim();
  session.consultantReplyTime = nowStr;

  proj.updateTime = nowStr;
  saveProjects(list);
  return proj;
}

function addDeliverable(projectId, delivData) {
  const list = getProjects();
  const proj = list.find(p => p.id === projectId);
  if (!proj) return null;

  const nowStr = formatTime(new Date());
  const newDeliv = {
    delivId: 'DEL-' + Date.now().toString().slice(-6),
    stage: delivData.stage || proj.stepName || '03 全案输出',
    title: delivData.title.startsWith('《') ? delivData.title : `《${delivData.title}》`,
    fileType: delivData.fileType || 'PDF / 核心交付方案',
    deliverTime: nowStr,
    status: '待客户验收',
    summary: delivData.summary || '独家定制输出的高客单商业操盘交付文档。'
  };

  proj.deliverables.unshift(newDeliv);
  proj.updateTime = nowStr;
  saveProjects(list);
  return proj;
}

function updateProjectMetrics(projectId, metricsData) {
  const list = getProjects();
  const proj = list.find(p => p.id === projectId);
  if (!proj) return null;

  proj.metrics = {
    ...proj.metrics,
    ...metricsData
  };
  proj.updateTime = formatTime(new Date());
  saveProjects(list);
  return proj;
}

// ==================== 多租户电子宣传单与获客名片配置 ====================

function brochureKey(tenantId) {
  return BROCHURE_KEY_PREFIX + (tenantId || 'platform');
}

function buildDefaultBrochure(tenantId) {
  const tid = tenantId !== undefined ? tenantId : getCurrentTenantId();
  if (!tid) {
    return {
      isPlatform: true,
      tenantId: '',
      title: '臻言咨询 · 商业顾问与企业交付协同平台',
      author: '臻言咨询官方平台',
      publishDate: '2026-11-27',
      views: 2486,
      shares: 427,
      greeting: 'Hello，欢迎了解臻言咨询——汇聚严选实战商业导师，为成长型企业与创始人提供专业咨询与交付服务。',
      brandName: '臻言咨询',
      mentorName: '臻言严选导师团',
      mentorTitle: '严选商业策略 / 财税股权 / 美业连锁多领域顾问',
      tagline: '严选实战导师入驻 · 一客一档全闭环咨询交付',
      avatar: '/images/logo-zhenyan.png',
      phone: '400-880-6699',
      wechat: 'zhenyan_advisory',
      wechatNote: '添加平台客服微信，为您匹配对应赛道实战导师或办理导师入驻',
      sections: [
        {
          heading: '一、关于臻言咨询',
          content: '臻言咨询是面向企业主、实体连锁及知识商业创始人的商业顾问服务平台，汇聚商业模式操盘、财税股权、高端美业等多赛道严选导师，帮助企业打造高价值产品体系与可复制成交模型。'
        },
        {
          heading: '二、五大闭环交付标准',
          content: '从「01 资质初筛 → 02 深度问诊 → 03 全案输出 → 04 陪跑落地 → 05 复盘迭代」，每一次 1V1 咨询结论实时留档、课后落地行动项打卡反馈、阶段交付文档确认验收，让咨询价值清晰可见。'
        },
        {
          heading: '三、严格隐私与独立空间',
          content: '平台采用「工作室物理隔离 + 客户账号密码」双层加密体系，每位签约客户拥有独立专属空间，仅限本人凭账号密码查阅与反馈，商业机密绝不外泄。'
        },
        {
          heading: '四、欢迎咨询导师入驻',
          content: '在细分赛道具备成熟方法论与交付能力的资深顾问、私董导师，无需自建服务器或开发小程序，10 秒即可在臻言平台开通独立工作室门户与客户交付工作台。'
        }
      ]
    };
  }

  const brand = getBrandConfig(tid);
  return {
    isPlatform: false,
    tenantId: tid,
    title: `${brand.navTitle} · 机构简介与顾问服务方案`,
    author: brand.navTitle,
    publishDate: '2026-11-27',
    views: 1280,
    shares: 215,
    greeting: `Hello，欢迎了解${brand.navTitle}——${brand.philosophy}`,
    brandName: brand.navTitle,
    mentorName: brand.mentorName,
    mentorTitle: brand.mentorTitle,
    tagline: brand.mission,
    avatar: '/images/avatar.png',
    phone: brand.phone,
    wechat: brand.wechat,
    wechatNote: `添加时请备注【公司+行业】，由${brand.mentorName}团队为您安排 1V1 咨询评估`,
    sections: [
      {
        heading: '一、机构简介',
        content: `${brand.navTitle}由${brand.mentorName}领衔（${brand.mentorTitle}），专注于${brand.mission}。`
      },
      {
        heading: '二、咨询核心理念',
        content: `${brand.philosophy}。${brand.vision}。`
      },
      {
        heading: '三、标准五步交付闭环',
        content: '依托臻言咨询平台标准化交付底座，全流程留档每次 1V1 深度问诊诊断、落地方案与课后执行打卡，客户可对每次咨询进行评分与反馈，确保交付效果持续可见。'
      },
      {
        heading: '四、合作与预约方式',
        content: `已服务的标杆成果指标：${brand.stat1Num}${brand.stat1Tag}、${brand.stat2Num}${brand.stat2Tag}。点击上方「打电话」或「联系顾问」即可对接预约 1V1 商业诊断。`
      }
    ]
  };
}

function getBrochureConfig(tenantId) {
  const tid = tenantId !== undefined ? tenantId : getCurrentTenantId();
  const key = brochureKey(tid);
  let cfg = wx.getStorageSync(key);
  if (!cfg || !cfg.title || !Array.isArray(cfg.sections)) {
    cfg = buildDefaultBrochure(tid);
    wx.setStorageSync(key, cfg);
  }
  return cfg;
}

function saveBrochureConfig(patch, tenantId) {
  const tid = tenantId !== undefined ? tenantId : getCurrentTenantId();
  const current = getBrochureConfig(tid);
  const merged = {
    ...current,
    ...patch
  };
  wx.setStorageSync(brochureKey(tid), merged);
  return merged;
}

function recordBrochureView(tenantId) {
  const tid = tenantId !== undefined ? tenantId : getCurrentTenantId();
  const current = getBrochureConfig(tid);
  current.views = (Number(current.views) || 0) + 1;
  wx.setStorageSync(brochureKey(tid), current);
  return current;
}

function recordBrochureShare(tenantId) {
  const tid = tenantId !== undefined ? tenantId : getCurrentTenantId();
  const current = getBrochureConfig(tid);
  current.shares = (Number(current.shares) || 0) + 1;
  wx.setStorageSync(brochureKey(tid), current);
  return current;
}

// 只重置「当前工作室」的数据，不影响其他导师
function resetDemoData() {
  const tenantId = getCurrentTenantId();
  const others = getProjects().filter(p => p.tenantId !== tenantId);
  const own = getDefaultProjects().filter(p => p.tenantId === tenantId);
  saveProjects(own.concat(others));
  const seeded = getDefaultTenants().find(t => t.tenantId === tenantId);
  if (seeded) {
    applyIndustryPreset(seeded.presetKey);
  }
  return own;
}

function formatTime(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

module.exports = {
  INDUSTRY_PRESETS,
  SERVICES_CATALOG: INDUSTRY_PRESETS.yanjie.services,
  DELIVERY_STEPS,
  PLATFORM_PASSCODE,
  TRIAL_DAYS,
  generateRandomPassword,
  getClientPassword,
  setClientPassword,
  changeClientPassword,
  resetClientPassword,
  getBrandConfig,
  saveBrandConfig,
  applyIndustryPreset,
  addBrandCase,
  getTenants,
  getTenantById,
  getCurrentTenantId,
  getCurrentTenant,
  setCurrentTenant,
  clearCurrentTenant,
  getTenantStatus,
  getPortalPath,
  registerTenant,
  renewTenant,
  toggleFreezeTenant,
  getTenantStats,
  platformEnterTenant,
  getPublicMentors,
  getDemoClientHints,
  getAuthSession,
  isPlatformSession,
  loginAsClient,
  loginAsMentor,
  loginAsAdmin,
  loginAsPlatform,
  logout,
  getVisibleProjects,
  canAccessProject,
  getProjects,
  getProjectById,
  createOrder,
  payForProject,
  toggleActionItem,
  acceptDeliverable,
  saveClientReview,
  updateProjectStep,
  addConsultSession,
  updateConsultSession,
  saveSessionClientFeedback,
  replySessionFeedback,
  addDeliverable,
  updateProjectMetrics,
  getBrochureConfig,
  saveBrochureConfig,
  recordBrochureView,
  recordBrochureShare,
  resetDemoData
};
