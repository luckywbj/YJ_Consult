// pages/services/services.js
Page({
  data: {
    currentPlan: 0,
    typeIndex: 0,
    typeOptions: [
      '1对1 商业闭门深度私董会',
      '高客单商业操盘全案',
      '年度战略商业顾问（限额）'
    ],
    formData: {
      name: '',
      phone: '',
      industry: '',
      problem: ''
    },
    servicesList: [
      {
        id: 's1',
        tier: '旗舰单品 · 深度问诊',
        name: '1对1 商业闭门深度私董会',
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
        quota: '全年仅开放 3 个席位',
        target: '志在成为细分赛道领头羊的高成长型企业',
        deliverables: [
          '全年战略股东级定期闭门复盘与经营研讨',
          '重大商业并购、合伙人机制、融资顶层设计把关',
          '岩姐高净值商业圈层与异业核心生态资源引荐',
          '随时为创始人提供重大商业决策参谋支持'
        ]
      }
    ],
    steps: [
      { step: '01', title: '资质初筛', desc: '提交企业经营现状，匹配最适合的咨询产品与顾问排期' },
      { step: '02', title: '深度问诊', desc: '全维度剖析客群画像、定价模式、销售卡点与交付链路' },
      { step: '03', title: '全案输出', desc: '产出可执行、可衡量的 10 倍客单跃迁操盘方案' },
      { step: '04', title: '陪跑落地', desc: '协助团队打通成交闭环，确保方案落到实处' },
      { step: '05', title: '复盘迭代', desc: '复盘关键指标转化率，沉淀企业长期商业资产' }
    ]
  },

  selectPlan(e) {
    const idx = e.currentTarget.dataset.index;
    this.setData({ currentPlan: idx, typeIndex: idx });
  },

  appointSpecificPlan(e) {
    const planName = e.currentTarget.dataset.name;
    const idx = this.data.typeOptions.indexOf(planName);
    if (idx !== -1) {
      this.setData({ typeIndex: idx, currentPlan: idx });
    }
    wx.pageScrollTo({
      selector: '#appointment-form',
      duration: 300
    });
  },

  bindTypeChange(e) {
    this.setData({ typeIndex: Number(e.detail.value) });
  },

  bindName(e) { this.setData({ 'formData.name': e.detail.value }); },
  bindPhone(e) { this.setData({ 'formData.phone': e.detail.value }); },
  bindIndustry(e) { this.setData({ 'formData.industry': e.detail.value }); },
  bindProblem(e) { this.setData({ 'formData.problem': e.detail.value }); },

  submitForm() {
    const { name, phone, industry, problem } = this.data.formData;
    if (!name.trim()) {
      wx.showToast({ title: '请填写称呼', icon: 'none' });
      return;
    }
    if (!phone.trim()) {
      wx.showToast({ title: '请填写联系方式', icon: 'none' });
      return;
    }
    if (!industry.trim()) {
      wx.showToast({ title: '请填写所在行业', icon: 'none' });
      return;
    }

    const appt = {
      id: 'YY' + Date.now().toString().slice(-8),
      name: name.trim(),
      phone: phone.trim(),
      industry: industry.trim(),
      problem: problem.trim() || '期待高客单突破',
      type: this.data.typeOptions[this.data.typeIndex],
      status: '审核中',
      createTime: new Date().toLocaleString()
    };

    const list = wx.getStorageSync('my_consult_appointments') || [];
    list.unshift(appt);
    wx.setStorageSync('my_consult_appointments', list);

    wx.showModal({
      title: '预约申请已提交',
      content: '感谢您的信任！岩姐团队将在 24 小时内完成初审并与您联系。',
      showCancel: false,
      confirmText: '好的',
      confirmColor: '#8D6238',
      success: () => {
        this.setData({
          formData: { name: '', phone: '', industry: '', problem: '' }
        });
      }
    });
  },

  makePhoneCall() {
    wx.makePhoneCall({
      phoneNumber: '4008809966',
      fail: () => {
        wx.showToast({ title: '暂未唤起拨号', icon: 'none' });
      }
    });
  },

  copyWechat() {
    wx.setClipboardData({
      data: 'yanjie_consulting',
      success: () => {
        wx.showToast({ title: '顾问微信号已复制', icon: 'success' });
      }
    });
  }
});
