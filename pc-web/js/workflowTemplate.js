// pc-web/js/workflowTemplate.js
// 严格依据《IP实战陪跑营运营与驾驶舱交付流程》Excel 建模（岩值咨询定制版）
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.YZWorkflow = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const DELIVERY_STEPS = [
    { step: 1, code: '01', title: '资质初筛', desc: '审核营前测评、商业梳理前置表与入营资格' },
    { step: 2, code: '02', title: '深度问诊', desc: '1V1 商业定位梳理与核心卡点诊断' },
    { step: 3, code: '03', title: '全案输出', desc: '朋友圈四件套升级与爆品产品把关定案' },
    { step: 4, code: '04', title: '陪跑落地', desc: '吸金发售、精准流量与高价成交实战陪跑' },
    { step: 5, code: '05', title: '复盘迭代', desc: '日销线稳健落地、阶段复盘与增长验收' }
  ];

  const RATING_DIMENSIONS = [
    { key: 'professional', label: '专业能力' },
    { key: 'attitude', label: '服务态度' },
    { key: 'response', label: '响应速度' },
    { key: 'result', label: '交付结果' }
  ];

  const REVIEW_TEMPLATE = [
    '💡 阶段服务复盘记录',
    '日期：{{date}}',
    '咨询老师：{{mentor}}',
    '【我的问题】（本次沟通核心围绕哪些问题）',
    '',
    '【过往挑战 / 痛点】（此前遇到的困惑与业务卡点）',
    '',
    '【我的收获】（本次获得的关键定位与解法）',
    '',
    '【我的感受】（对本次交付节奏与深度的体感）',
    '',
    '【还有什么想对我们说的？】'
  ].join('\n');

  // 线一：IP实战陪跑营运营与把关流水线（10 个核心节点）
  const PIPELINE_STAGES = [
    {
      id: 'pipe_01',
      order: 1,
      phase: '前端引流与审核录取',
      title: '书籍引流 + 商业测评',
      ownerRole: '助理',
      duration: '营前预热',
      keyPoints: '拉群（助理 + 博士顾问）确认商业诊断时间 + 预定线上/线下会议室。',
      outputs: '已确认的诊断时间、会议室链接与测评初筛记录',
      script: '【提醒话术】{{name}}您好，您已完成商业测评，我们已为您拉起专属沟通群（含助理与诊断顾问），为您锁定【时间】的一对一商业诊断时段，请查收会议室提醒。',
      note: '群前提醒务必提前 2 小时二次确认'
    },
    {
      id: 'pipe_02',
      order: 2,
      phase: '前端引流与审核录取',
      title: '一对一商业诊断和成交转化',
      ownerRole: '博士顾问',
      duration: '30 分钟',
      keyPoints: '商业痛点诊断 + 十大成交转化话术 + 高度认同学员过往积累与潜力。',
      outputs: '海报介绍 + 初步诊断方案 + 诊断反馈 + 标杆案例介绍',
      script: '结合您目前{{industry}}的现状，核心卡点不在流量多寡，而是缺少高毛利尖刀产品与价值锚定逻辑。我们拆解过相似案例，接下来只要按 3 步走即可跑通高客单转化。',
      note: '同步记录核心商业问题与 10 大成交触动点'
    },
    {
      id: 'pipe_03',
      order: 3,
      phase: '前端引流与审核录取',
      title: '审核会议',
      ownerRole: '博士顾问 + 首席导师（岩姐）+ 班主任CEO',
      duration: '30 分钟',
      keyPoints: '博士 + 班主任 + 首席导师联合面试：重点评估调性匹配度、执行配合度与增长潜力。',
      outputs: '现场审核结论（通过率约 50% 严选标准）',
      script: '本次审核重点看您的行业积累、价值观调性以及未来 6 个月全情投入落地陪跑的决心。我们看重的是能真正做出标杆结果、彼此同频的创始伙伴。',
      note: '三方达成一致方可发放录取通知'
    },
    {
      id: 'pipe_04',
      order: 4,
      phase: '前端引流与审核录取',
      title: '审核结果通过与录取仪式',
      ownerRole: '三方联审通过 · 班主任发出',
      duration: '当天发出',
      keyPoints: '打造细节感 + 仪式感 + 正式感：正式发放录取通知书、一封信与企业对公收款码。',
      outputs: '恭喜录取话术 + 企业收款二维码 + 《录取通知书》+《致入营学员的一封信》',
      script: '@{{name}} 经过内部慎重讨论和思考，我们决定通过您的【岩值咨询 · 个人品牌IP实战陪跑营】入营审核，恭喜你🎉\n\n在未来的陪跑周期中，我们将为您找准高价值定位，打爆核心产品，跑通高客单变现路径！请查收正式录取通知书与一封信。',
      note: '保留录取通知书与欢迎信电子归档'
    },
    {
      id: 'pipe_05',
      order: 5,
      phase: '开营启动与建群交付',
      title: '陪跑营服务流程宣讲',
      ownerRole: '班主任（面试官）',
      duration: '入营首日',
      keyPoints: '清晰讲解整体交付安排：目标里程碑 + 驾驶舱 + 运营交付双线 + 群设置（学员专属服务群 + 同期班级群）。',
      outputs: '服务流程图 + 整体服务流程概况细节 + 首日沟通录音',
      script: '欢迎正式入营！接下来我们将以“学习驾驶舱 + 1V1深度梳理交付”双线并行。已为您建立【专属VIP交付群】用于作业批改与1V1预约，同时邀您进入【班级共创群】链接同频创始人。',
      note: '附服务流程图，全程建议留存录音'
    },
    {
      id: 'pipe_06',
      order: 6,
      phase: '开营启动与建群交付',
      title: '发驾驶舱学习链接并激活权限',
      ownerRole: '班主任',
      duration: '缴费当日',
      keyPoints: '确认企业对公缴费到账，发放学习平台优惠券（0元兑换激活权限），布置【入学准备】与【前置准备表】。',
      outputs: '驾驶舱学习权限激活 + 学习链接二维码',
      script: '1、@{{name}} 请扫码领取驾驶舱学习权限，点击“去使用”激活课程与工具包。\n2、进入以后，请先完成【01 入学准备】和【02 个人品牌商业梳理】中的“前置准备”，填写完成商业梳理表发到群里，我们立即为您排期 1V1 定位梳理！',
      note: '附学习入口二维码及操作指引'
    },
    {
      id: 'pipe_07',
      order: 7,
      phase: '开营启动与建群交付',
      title: '进入驾驶舱学习与表格回收',
      ownerRole: '班主任跟催',
      duration: '3 天内',
      keyPoints: '督导学员按进度完成商业梳理学员版本表格，审核信息完整性后正式预约 1V1 视频咨询。',
      outputs: '已回收《商业定位梳理表（学员版）》+ 正式 1V1 咨询预约单',
      script: '收到您的《商业梳理学员版》表格！我们团队已先行做完诊前预研，现为您锁定【日期时段】进行 1V1 商业定位深度梳理，请提前找好安静、网络顺畅的环境准时入会。',
      note: '见驾驶舱 01-02 板块具体验收要求'
    },
    {
      id: 'pipe_08',
      order: 8,
      phase: '1V1 深度共创与把关交付',
      title: '一对一咨询（商业定位梳理）',
      ownerRole: '首席导师（岩姐）+ 班主任',
      duration: '60-90 分钟',
      keyPoints: '完整梳理：职业履历拆解 + 方向验证与赋能肯定 + 市场需求匹配 + 核心卡点答疑。',
      outputs: '高价值定位 + 尖刀产品建议 + 优势凸显个人标签 + 朋友圈大修建议 + 腾讯会议回放录音',
      script: '本次 1V1 定位梳理已完成，为您正式敲定高价值定位方向与尖刀切入品！请将会议回放录音与纪要存档，接下来进入「03 升级品牌形象」与朋友圈四件套共创阶段。',
      note: '必须保存腾讯会议回放录音并写入1V1咨询纪要'
    },
    {
      id: 'pipe_09',
      order: 9,
      phase: '1V1 深度共创与把关交付',
      title: '朋友圈 4 件套共创交付',
      ownerRole: '内容交付助教',
      duration: '5 个工作日',
      keyPoints: '提炼个人核心优势，确保商业叙事逻辑自洽、语言高级，打磨高信任度展示面。',
      outputs: '精准定位语 + 个人标签 + 擅长解决问题清单 + 形象照/背景墙成片 + 会议回放录音',
      script: '@{{name}} 导师团队已依据您的定位梳理完成《朋友圈四件套（定位、标签、解决问题清单、背景墙）》文案精修，请对照形象照成片标准替换并上传展示面截图，方便我们做营销面验收。',
      note: '附腾讯会议共创回放录音'
    },
    {
      id: 'pipe_10',
      order: 10,
      phase: '1V1 深度共创与把关交付',
      title: '爆品产品关（终审定案）',
      ownerRole: '首席导师（岩姐）+ 博士顾问',
      duration: '45-60 分钟',
      keyPoints: '严守产品关：验证产品价格锚点、利润结构、交付边界与发售海报卖点，首席导师把关定向。',
      outputs: '正式定版爆品方案 + 产品营销海报方向 + 腾讯会议把关录音',
      script: '您的核心爆品已通过首席导师产品把关！价格阶梯与情绪价值锚点已清晰，接下来正式进入「05-07 产品发售吸金与高价成交」实战陪跑环节！',
      note: '由首席导师最终签字定向，保存回放录音'
    }
  ];

  // 线二：IP实战陪跑营 12 大驾驶舱学习与交付板块（共 42 个细化节点）
  const COCKPIT_MODULES = [
    {
      moduleId: 'mod_01',
      moduleNo: '01',
      moduleTitle: '入学准备',
      summary: '建档、理解营规、完成个人品牌第一张名片与商业底层认知课',
      tasks: [
        {
          id: 't_01_01',
          title: '填写个人学籍档案',
          detail: '客户基本信息、赛道现状与入营目标收集表',
          formType: '问卷表单',
          script: '欢迎加入【岩值咨询 · 个人品牌IP实战陪跑营】！在正式开始您的成长之旅前，请先完善个人学籍档案，便于助教与导师团队建档追踪。',
          isMilestone: false,
          hasRating: false
        },
        {
          id: 't_01_02',
          title: '了解岩值咨询与陪跑营文化',
          detail: '阅读并认同陪跑营“利他共创、以终为始、死磕落地”营规文化',
          formType: '01 Word手册',
          script: '请查收《陪跑营核心文化手册》Word 文档，花 10 分钟通读理解我们倡导的高客单操盘价值观与陪伴机制。',
          isMilestone: false,
          hasRating: false
        },
        {
          id: 't_01_03',
          title: '学员群高价值自我介绍',
          detail: '按【姓名 / 坐标 / 定位 / 标签 / 最有成就的事 / 可提供资源】模板发送班级群',
          formType: '自我介绍模版',
          script: '自我介绍是您个人品牌的第一张名片！请按以下模版填写后发至学员群：\n【姓名】\n【坐标】\n【定位】\n【标签】\n【我做过最有成就的事情】\n【我能提供给大家的资源】\n小贴士：入群发个小红包，更容易链接到同频大咖哦。',
          isMilestone: false,
          hasRating: false
        },
        {
          id: 't_01_04',
          title: '了解社群规则与“云咖啡”礼仪',
          detail: '阅读《做好微信礼仪，做个受欢迎的人》，倡议同学间 30-45 分钟云咖啡链接',
          formType: '02 Word手册',
          script: '在线上经营个人品牌要主动链接同频伙伴。建议本周约 1-2 位同学开展 30-45 分钟“云咖啡”视频沟通，互相挖宝与练手表达；同时注意优雅的微信沟通礼仪，持续塑造高级感。',
          isMilestone: false,
          hasRating: false
        },
        {
          id: 't_01_05',
          title: '学习《个人品牌底层逻辑》与商业认知课',
          detail: '理解个人品牌本质与商业认知底层心法',
          formType: '01 视频 + 作业',
          script: '请观看《个人品牌底层逻辑》视频大课，并在完成后提交 200-300 字的真实收获以及个人落地行动方案。',
          isMilestone: false,
          hasRating: false
        }
      ]
    },
    {
      moduleId: 'mod_02',
      moduleNo: '02',
      moduleTitle: '个人品牌商业梳理',
      summary: '填写百万营销梳理表、找到高价值定位并完成首次 1V1 定位与复盘评价',
      tasks: [
        {
          id: 't_02_01',
          title: '前置准备：填写商业梳理（学员版）',
          detail: '下载并填报《个人品牌实战营百万营销商业梳理——学员版》上传审核',
          formType: '03 Word模版',
          script: '接下来进入第一阶段【百万营销商业梳理】！请下载《商业梳理——学员版》，如实详尽填写您的过往案例与产品营收现状并上传，便于我们诊前推演专属方案。',
          isMilestone: false,
          hasRating: false
        },
        {
          id: 't_02_02',
          title: '学习《如何找到高价值定位，百倍放大财富效应》',
          detail: '掌握避开低价内卷、锁定高净值人群的价值定位公式',
          formType: '02 视频 + 作业',
          script: '请完成《如何找到高价值定位》核心课程学习，并写下 200-300 字的收获启发及初步定位假设。',
          isMilestone: false,
          hasRating: false
        },
        {
          id: 't_02_03',
          title: '预约 1V1 商业定位梳理视频咨询',
          detail: '与导师及班主任完成 60-90 分钟 1V1 定位与尖刀品梳理',
          formType: '1V1 视频会议',
          script: '您的梳理表已审核通过！为保证沟通效率，请按约定时间提前 5 分钟进入安静、网络顺畅的视频会议室；若超过 10 分钟未入会需顺延改期，敬请谅解。',
          isMilestone: false,
          hasRating: false
        },
        {
          id: 't_02_04',
          title: '★ 定位和产品升级服务评价与复盘',
          detail: '对【专业能力、服务态度、响应速度、交付结果】打星并提交标准化复盘记录',
          formType: '4维打星 + 复盘表',
          script: '感谢您完成本次商业定位 1V1 深度梳理！请围绕“专业能力、服务态度、响应速度、交付结果”四个维度打星评价，并填写《💡复盘表》（我的问题/痛点/收获/感受）上传复盘截图。',
          isMilestone: true,
          hasRating: true
        },
        {
          id: 't_02_05',
          title: '一对一咨询（50-100万交付成交咨询框架）',
          detail: '对齐高客单咨询成交对话框架，打通大单顾问式面谈主线',
          formType: '1V1 咨询框架',
          script: '请结合本次敲定的定位，对照《50-100万交付成交咨询框架》梳理您的首轮大单沟通结构，助教将在群内跟进演练进度。',
          isMilestone: false,
          hasRating: false
        }
      ]
    },
    {
      moduleId: 'mod_03',
      moduleNo: '03',
      moduleTitle: '升级品牌形象',
      summary: '落地朋友圈四件套营销展示面，按奢侈品级审美标准更新个人形象照',
      tasks: [
        {
          id: 't_03_01',
          title: '朋友圈四件套：升级营销展示面（背景墙）',
          detail: '定位完成后 5 个工作日内共创撰写朋友圈四件套文案并更新背景墙模版',
          formType: '04 Word模版',
          script: '导师已为您确定定位方向，接下来 5 个工作日内将为您安排撰写“朋友圈四件套”文案并提炼营销卖点。请下载并上传补充完整信息的《朋友圈背景图模版》。',
          isMilestone: false,
          hasRating: false
        },
        {
          id: 't_03_02',
          title: '升级个人品牌形象照',
          detail: '按标准拍摄：含站姿半身照、衣着线条简洁、色系匹配背景、正脸构图完整',
          formType: '自行拍摄上传',
          script: '个人形象照是每个 IP 的第一张信任名片，能显著降低解释成本！成片建议：\n1、至少一张站姿半身照；\n2、服饰线条简洁、色彩不花哨；\n3、结合背景墙主色调选服装颜色；\n4、头部上方及左右留白完整、背景无杂物；\n5、优先正脸成片，避免过度侧脸。',
          isMilestone: false,
          hasRating: false
        },
        {
          id: 't_03_03',
          title: '★ 朋友圈形象升级服务评价',
          detail: '营销展示面全面更新后，进行四维度打星验收并上传新朋友圈首页截图',
          formType: '4维打星评价',
          script: '您的朋友圈营销展示面已全面焕新！请对本次“营销面升级”服务按四维度打星评价，并上传新版朋友圈主页截图作为阶段留档。',
          isMilestone: true,
          hasRating: true
        }
      ]
    },
    {
      moduleId: 'mod_04',
      moduleNo: '04',
      moduleTitle: '高级感人设',
      summary: '用故事、过往经历与高维价值观构建让高净值客户心动的人设质感',
      tasks: [
        {
          id: 't_04_01',
          title: '如何写出吸引人的自我介绍',
          detail: '打磨兼具专业信任感、人物温度与记忆钩子的 30 秒/300 字介绍版本',
          formType: '人设文案课',
          script: '请完成《如何写出吸引人的自我介绍》学习，提交修订后的朋友圈置顶/私聊自我介绍终稿，由助教点评把关。',
          isMilestone: false,
          hasRating: false
        },
        {
          id: 't_04_02',
          title: '你的一切皆优势（人生履历资产化）',
          detail: '从跨界经历、踩坑教训和稀缺体验中提炼不可复制的个人背书资产',
          formType: '履历提炼表',
          script: '没有一段经历是白走的。请梳理出 3 个过往高光时刻与 2 个跨界赋能优势，转化为讲给客户听的品牌信任故事。',
          isMilestone: false,
          hasRating: false
        },
        {
          id: 't_04_03',
          title: '价值观高级圈粉与调性塑造',
          detail: '建立鲜明商业态度与审美边界，主动筛选并吸引同频高客单客户',
          formType: '价值观内容库',
          script: '请总结您的 3 条“行业反常识观点”和“服务原则声明”，用于日后高频输出高势能价值观短文。',
          isMilestone: false,
          hasRating: false
        }
      ]
    },
    {
      moduleId: 'mod_05',
      moduleNo: '05',
      moduleTitle: '吸金方案（产品发售）',
      summary: '搭建朋友圈日常布局、吸金文案模版、滚圈好评与 6 天新品发售闭环',
      tasks: [
        {
          id: 't_05_01',
          title: '如何写出朋友圈的吸金文案',
          detail: '掌握痛点共鸣、案例证言、稀缺钩子与成交指令的撰写结构',
          formType: '文案实操课',
          script: '请按课上拆解的“痛点场景 + 破局认知 + 交付切片 + 行动指令”四段式结构，写出 2 篇高转化朋友圈测试稿。',
          isMilestone: false,
          hasRating: false
        },
        {
          id: 't_05_02',
          title: '针对目标人群的发圈模版梳理',
          detail: '按不同客户分层定制早/中/晚黄金发圈素材模版',
          formType: '发圈模版库',
          script: '对照您的核心客户画像，套用对应《目标人群发圈模版》，完成一周内容选题排期表。',
          isMilestone: false,
          hasRating: false
        },
        {
          id: 't_05_03',
          title: '学习如何写好评与“滚圈”成交法',
          detail: '将每一条客户聊天好评与交付瞬间变成二次种草与连续出单素材',
          formType: '滚圈SOP',
          script: '真实好评是成交最好的催化剂！请学会把客户日常微信正向反馈包装成带商业价值的滚圈文案。',
          isMilestone: false,
          hasRating: false
        },
        {
          id: 't_05_04',
          title: '新品 6 天发售期全流程剧本',
          detail: '预热造势 -> 痛点爆破 -> 案例证言 -> 限时开售 -> 滚动逼单 -> 截单收官',
          formType: '6天发售剧本',
          script: '新品上线切忌悄无声息！请严格按 6 天发售节奏表逐日推进朋友圈造势与私聊铺垫。',
          isMilestone: false,
          hasRating: false
        },
        {
          id: 't_05_05',
          title: '★ 预约吸金方案反馈电话',
          detail: '导师针对前几轮吸金文案与发售节奏做 1V1 电话点评纠偏',
          formType: '1V1 电话点评',
          script: '吸金方案初稿与发圈实操完成后，请在驾驶舱内提交预约，导师将通过电话为您提供针对性逐条批改与打星复盘。',
          isMilestone: true,
          hasRating: true
        },
        {
          id: 't_05_06',
          title: '朋友圈日常整体布局检查',
          detail: '校准生活美感、专业深度、交付现场与成交晒单的黄金配比（3:3:2:2）',
          formType: '展示面体检',
          script: '请保持每日 3-4 条高质量动态，切忌刷屏硬广，让客户一翻朋友圈就能立体感受到您的专业度与高价值生活方式。',
          isMilestone: false,
          hasRating: false
        },
        {
          id: 't_05_07',
          title: '制作高净值客户《商业咨询诊断单》',
          detail: '设计引导私聊客户填报现状、提升权威感与转化率的诊断前置单',
          formType: '诊断单模版',
          script: '诊断单是把闲聊转为严肃付费咨询的关键漏斗工具！请使用模版完成属于您自己赛道的《诊前咨询单》。',
          isMilestone: false,
          hasRating: false
        },
        {
          id: 't_05_08',
          title: '★ 预约发售期实战效果点评',
          detail: '发售期后对咨询进线数、诊断单回收数与出单回款进行 1V1 点评复盘',
          formType: '1V1 点评 + 打星',
          script: '首轮发售结束无论战果大小都请及时预约效果点评！我们一起复盘点击率、私聊开口率与成交卡点。',
          isMilestone: true,
          hasRating: true
        }
      ]
    },
    {
      moduleId: 'mod_06',
      moduleNo: '06',
      moduleTitle: '爆品设计',
      summary: '梳理爆款产品底层逻辑、填写《产品设计精华版》并完成产品把关与海报定稿',
      tasks: [
        {
          id: 't_06_01',
          title: '学习爆品设计的底层逻辑',
          detail: '拆解如何设计出自带稀缺溢价、高毛利且能做成交抓手的核心爆品',
          formType: '03 视频 + 作业',
          script: '请学习《爆品设计的底层逻辑》课程，并写出 200-300 字关于您现有产品线痛点与爆品重构的行动想法。',
          isMilestone: false,
          hasRating: false
        },
        {
          id: 't_06_02',
          title: '补充填写《爆品设计—精华版模版》',
          detail: '下载并填报产品命名、定价阶梯、核心交付模块、稀缺赠品与利益点',
          formType: '05 Word模版',
          script: '接下来进入第二阶段【产品设计】梳理！请下载《产品设计——模版（精华版）》，确保真实无误填写后在作业处上传，我们将据以安排优化咨询。',
          isMilestone: false,
          hasRating: false
        },
        {
          id: 't_06_03',
          title: '预约产品设计优化优先电话',
          detail: '提交模版后锁定导师 1V1 产品打磨电话时段',
          formType: '文字预约',
          script: '《产品设计》上传完毕后请立即预约优化电话。请提前 5 分钟找安静、网络顺畅的环境等待沟通，超过 10 分钟未接通将安排改期。',
          isMilestone: false,
          hasRating: false
        },
        {
          id: 't_06_04',
          title: '确认产品营销方案（产品把关定向）',
          detail: '与首席导师及博士顾问完成最终爆品定向把关，锁定主推价格与交付清单',
          formType: '1V1 视频把关',
          script: '恭喜您的爆品设计方案已通过【产品把关定向】！定价逻辑与转化钩子已校准完成，可立即推进海报视觉落地。',
          isMilestone: false,
          hasRating: false
        },
        {
          id: 't_06_05',
          title: '确认产品营销主视觉海报',
          detail: '审核并定稿高客单发售长图/九宫格核心卖点海报',
          formType: '海报定稿',
          script: '请核对爆品海报中的核心痛点标题、3 大交付价值、稀缺名额与行动二维码，确认无误后即可用于首轮发布。',
          isMilestone: false,
          hasRating: false
        }
      ]
    },
    {
      moduleId: 'mod_07',
      moduleNo: '07',
      moduleTitle: '高价成交（产品发售）',
      summary: '掌握十步绝杀成交法、梳理销售全流程并提交真实录音精批复盘',
      tasks: [
        {
          id: 't_07_01',
          title: '学习高价成交方法与十步绝杀成交法',
          detail: '掌握高客单 1V1 谈单中的破冰、深挖痛点、价值抬升与顺畅收单技巧',
          formType: '成交核心课',
          script: '请精学《十步绝杀成交法》，用“诊断赋能”替代“低姿态推销”，真正做到让高净值客户主动向您付费。',
          isMilestone: false,
          hasRating: false
        },
        {
          id: 't_07_02',
          title: '★ 梳理个人/团队高价销售流程',
          detail: '画清从私聊破冰、发诊断单、约通话到 1V1 谈单及追单的完整 SOP',
          formType: '流程梳理 + 点评',
          script: '请提交您的《高价销售标准流程表》，导师将为您点检容易丢单的断点步骤并做星级反馈。',
          isMilestone: true,
          hasRating: true
        },
        {
          id: 't_07_03',
          title: '提交真实咨询谈单录音供精批',
          detail: '提交 1-2 段真实 1V1 客户沟通录音，由导师逐段拆解气场与异议处理',
          formType: '录音作业',
          script: '只有听真实谈单录音才能最快突破成交瓶颈！请至少上传 1 段完整 1V1 咨询沟通录音，我们会为您做逐分钟点拨。',
          isMilestone: false,
          hasRating: false
        },
        {
          id: 't_07_04',
          title: '高价成交阶段性战果总结',
          detail: '统计约谈数、客单价跃迁幅度、成交率与总回款业绩',
          formType: '阶段总结表',
          script: '请汇总本月高客单约谈次数、报价金额与实际收款明细，同步更新至「战果对比看板」。',
          isMilestone: false,
          hasRating: false
        },
        {
          id: 't_07_05',
          title: '高价成交深度复盘迭代',
          detail: '围绕未成交/已成交典型样本开展 1V1 复盘并沉淀话术升级包',
          formType: '1V1 复盘',
          script: '每一次未成交客户都是宝贵的磨刀石。请列出最难应对的 3 个客户异议问题，我们逐一写入您的专属话术库。',
          isMilestone: false,
          hasRating: false
        }
      ]
    },
    {
      moduleId: 'mod_08',
      moduleNo: '08',
      moduleTitle: '交付体系',
      summary: '设计高溢价客户交付体验峰值，做到“高收费更获高口碑”与自发转介绍',
      tasks: [
        {
          id: 't_08_01',
          title: '设计高净值客户全闭环交付 SOP',
          detail: '梳理签单后开营欢迎、每次 1V1 交付仪式感、阶段战果汇报与结案验收',
          formType: '交付SOP文档',
          script: '高客单能持续卖爆的关键在超预期交付！请利用我们的 5 步闭环交付架构梳理出您给客户的标准服务流程。',
          isMilestone: false,
          hasRating: false
        },
        {
          id: 't_08_02',
          title: '搭建老客惊喜体验与转介绍机制',
          detail: '设计交付关键里程碑后的复盘激励、客户见证采集与老带新尊荣礼遇',
          formType: '交付验收闭环',
          script: '每一次阶段成果出现时，请第一时间引导客户填写服务评价并触发口碑转介绍动作，形成零成本优质新流量。',
          isMilestone: false,
          hasRating: false
        }
      ]
    },
    {
      moduleId: 'mod_09',
      moduleNo: '09',
      moduleTitle: '流量激活（产品发售）',
      summary: '启动精准流量 7 次触达、打标分层、朋友圈互推、报喜吸粉与链路诊断',
      tasks: [
        {
          id: 't_09_01',
          title: '学习精准流量 7 次触达与精准标签管理',
          detail: '给微信好友打好行业、消费力与需求意向标签，做精细化触达',
          formType: '流量核心课',
          script: '流量贵在精准与复触！请先完成微信现有好友的 A/B/C 分级打标，切忌对所有人发送同一条群发消息。',
          isMilestone: false,
          hasRating: false
        },
        {
          id: 't_09_02',
          title: '执行朋友圈互推、报喜吸粉与社群分享',
          detail: '借势同班同学互推破圈、发喜报吸粉及高价值干货社群快闪分享',
          formType: '流量联合动作',
          script: '本周建议在班级群认领 2 位高契合度伙伴完成朋友圈互推，并借近期成交或交付突破做一次高势能“报喜吸粉”朋友圈。',
          isMilestone: false,
          hasRating: false
        },
        {
          id: 't_09_03',
          title: '★ 梳理流量链路与高转化测评单设计',
          detail: '预约导师 1V1 诊断公转私流量闭环，并定稿引流测评单工具',
          formType: '1V1 诊断 + 打星',
          script: '请画出现有引流进线全链路并提交《商业测评单》初稿，约通话由导师为您排查流量漏水环节。',
          isMilestone: true,
          hasRating: true
        }
      ]
    },
    {
      moduleId: 'mod_10',
      moduleNo: '10',
      moduleTitle: '精准培育',
      summary: '建立潜在 A/B 类意向客户的长效培育日历与信任升温体系',
      tasks: [
        {
          id: 't_10_01',
          title: '搭建潜在高净值客群分层培育 SOP',
          detail: '针对暂未成交但高匹配线索制定“14天/30天价值投喂 + 轻交互升温”行动表',
          formType: '培育SOP表',
          script: '高客单客户往往需要多次同频观察才会下手。请将近 3 个月未成交高意向名单放入《精准培育跟进表》，每周定期用干货切片触达。',
          isMilestone: false,
          hasRating: false
        }
      ]
    },
    {
      moduleId: 'mod_11',
      moduleNo: '11',
      moduleTitle: '稳健日销线',
      summary: '落地“天龙八部”日常销冠动作，打造 10 条稳定出单商业落地通道',
      tasks: [
        {
          id: 't_11_01',
          title: '搭建“天龙八部”稳健日销线与 10 条成交通道',
          detail: '将发售大波段能力固化为每天/每周可持续出单的常规日销动作系统',
          formType: '日销作战图',
          script: '日销线才是企业稳健现金流的生命线！请对照“10条高级成交落地通道”，本周至少跑通其中 3 条高频出单日常动作。',
          isMilestone: false,
          hasRating: false
        }
      ]
    },
    {
      moduleId: 'mod_12',
      moduleNo: '12',
      moduleTitle: '生命能量成长大课',
      summary: '从创始人底层心力突破出发，重新定义成交与富足商业能量场',
      tasks: [
        {
          id: 't_12_01',
          title: '《重新定义成交》与富足能量成长大课',
          detail: '突破创始人对高价收费的心理卡点，完成结营复盘与下一年度增长蓝图',
          formType: '成长大课 + 结营',
          script: '收下“卖高价即高价值赋能”的新信念！请参加《生命能量成长大课》并撰写结营感言与年度增长愿景书。',
          isMilestone: false,
          hasRating: false
        }
      ]
    }
  ];

  function createInitialCampPipeline(overrides) {
    const map = (overrides && typeof overrides === 'object') ? overrides : {};
    return PIPELINE_STAGES.map((st, idx) => {
      const ov = map[st.id] || {};
      return {
        stageId: st.id,
        status: ov.status || (idx < 3 ? 'done' : (idx === 3 ? 'in_progress' : 'pending')),
        assignee: ov.assignee || st.ownerRole,
        meetingLink: ov.meetingLink || '',
        recordingUrl: ov.recordingUrl || '',
        note: ov.note || '',
        updatedAt: ov.updatedAt || ''
      };
    });
  }

  function createInitialCockpitProgress(preset) {
    const progress = {};
    const doneIds = (preset && Array.isArray(preset.doneIds)) ? preset.doneIds : [];
    const activeIds = (preset && Array.isArray(preset.activeIds)) ? preset.activeIds : [];
    const detailsMap = (preset && preset.details) ? preset.details : {};

    COCKPIT_MODULES.forEach(mod => {
      mod.tasks.forEach(task => {
        const extra = detailsMap[task.id] || {};
        let status = 'pending';
        if (doneIds.includes(task.id)) status = 'done';
        else if (activeIds.includes(task.id)) status = 'in_progress';
        progress[task.id] = {
          status,
          attachment: extra.attachment || '',
          note: extra.note || '',
          updatedAt: extra.updatedAt || '',
          rating: extra.rating || null,
          reviewText: extra.reviewText || ''
        };
      });
    });
    return progress;
  }

  function getAllCockpitTasks() {
    const list = [];
    COCKPIT_MODULES.forEach(mod => {
      mod.tasks.forEach(task => {
        list.push({ ...task, moduleId: mod.moduleId, moduleNo: mod.moduleNo, moduleTitle: mod.moduleTitle });
      });
    });
    return list;
  }

  function calcProjectStats(project) {
    const pipe = Array.isArray(project && project.campPipeline) ? project.campPipeline : [];
    const pipeDone = pipe.filter(p => p.status === 'done').length;
    const pipeTotal = PIPELINE_STAGES.length;
    const pipePercent = pipeTotal > 0 ? Math.round((pipeDone / pipeTotal) * 100) : 0;

    const cockpitMap = (project && project.cockpitProgress) || {};
    const allTasks = getAllCockpitTasks();
    let taskDone = 0;
    let taskInProgress = 0;
    let milestoneDone = 0;
    let milestoneTotal = 0;

    allTasks.forEach(t => {
      const rec = cockpitMap[t.id] || {};
      if (rec.status === 'done') taskDone += 1;
      else if (rec.status === 'in_progress') taskInProgress += 1;
      if (t.isMilestone) {
        milestoneTotal += 1;
        if (rec.status === 'done') milestoneDone += 1;
      }
    });

    const taskTotal = allTasks.length;
    const taskPercent = taskTotal > 0 ? Math.round((taskDone / taskTotal) * 100) : 0;

    const sessions = Array.isArray(project && project.sessions) ? project.sessions : [];
    const pendingFeedbackReplies = sessions.filter(
      s => (s.clientFeedback || s.clientRating > 0) && !s.consultantReply
    ).length;

    return {
      pipeDone,
      pipeTotal,
      pipePercent,
      taskDone,
      taskInProgress,
      taskTotal,
      taskPercent,
      milestoneDone,
      milestoneTotal,
      pendingFeedbackReplies
    };
  }

  function renderScript(template, project) {
    const p = project || {};
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return String(template || '')
      .replace(/\{\{name\}\}/g, p.name || '学员')
      .replace(/\{\{industry\}\}/g, p.industry || '核心赛道')
      .replace(/\{\{mentor\}\}/g, (p.consultant || '岩姐').split('·')[0].trim())
      .replace(/\{\{date\}\}/g, dateStr);
  }

  return {
    DELIVERY_STEPS,
    RATING_DIMENSIONS,
    REVIEW_TEMPLATE,
    PIPELINE_STAGES,
    COCKPIT_MODULES,
    createInitialCampPipeline,
    createInitialCockpitProgress,
    getAllCockpitTasks,
    calcProjectStats,
    renderScript
  };
});
