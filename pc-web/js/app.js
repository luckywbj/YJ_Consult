// pc-web/js/app.js
(function () {
  const WF = window.YZWorkflow;
  const API = window.YZApi;

  const state = {
    view: 'board', // board | cockpit | scripts | radar | accounts | settings
    dashboard: {
      user: null,
      projects: [],
      adminAccounts: [],
      clientPasswords: {},
      brochure: null,
      visitorStats: { totalVisitors: 0, totalViews: 0, totalShares: 0, totalInvites: 0, totalLeads: 0 },
      visitors: []
    },
    boardStepFilter: 0,
    boardSearch: '',
    selectedProjectId: '',
    cockpitSearch: '',
    cockpitSubTab: 'pipeline', // pipeline | cockpit | sessions | deliverables | profile
    cockpitTaskFilter: 'all', // all | milestone | pending | done
    expandedModules: { mod_01: true, mod_02: true, mod_03: true },
    scriptSearch: '',
    scriptStudentId: ''
  };

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function showToast(msg) {
    const box = document.getElementById('toastBox');
    box.textContent = msg;
    box.classList.remove('hidden');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => box.classList.add('hidden'), 2600);
  }

  function copyText(text, successMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        () => showToast(successMsg || '已复制到剪贴板'),
        () => fallbackCopy(text, successMsg)
      );
    } else {
      fallbackCopy(text, successMsg);
    }
  }

  function fallbackCopy(text, successMsg) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showToast(successMsg || '已复制到剪贴板');
    } catch (e) {
      showToast('复制失败，请手动复制');
    }
    document.body.removeChild(ta);
  }

  function statusBadgeHtml(st) {
    if (st === 'done') return '<span class="badge badge-done">已完成</span>';
    if (st === 'in_progress') return '<span class="badge badge-progress">进行中</span>';
    return '<span class="badge badge-pending">待开始</span>';
  }

  function getSelectedProject() {
    const list = state.dashboard.projects || [];
    if (!list.length) return null;
    const hit = list.find(p => p.id === state.selectedProjectId);
    if (hit) return hit;
    state.selectedProjectId = list[0].id;
    return list[0];
  }

  function ensureProjectCampStructure(proj) {
    if (!proj) return proj;
    if (!Array.isArray(proj.campPipeline) || proj.campPipeline.length === 0) {
      proj.campPipeline = WF.createInitialCampPipeline();
    }
    if (!proj.cockpitProgress || typeof proj.cockpitProgress !== 'object') {
      proj.cockpitProgress = WF.createInitialCockpitProgress();
    }
    return proj;
  }

  function syncModeBadges() {
    const isCloud = API.getMode() === 'cloud';
    const text = isCloud
      ? (API.isUsingLocalProxy() ? '☁️ 微信云开发已互通 (官方代理)' : '☁️ 微信云开发实时互通')
      : '🧪 本地高仿真演示模式';
    ['loginModeBadge', 'topbarModeBadge'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.textContent = text;
      el.className = 'mode-pill ' + (isCloud ? 'cloud' : 'demo');
    });
  }

  async function refreshDashboard(silent) {
    try {
      const res = await API.loadDashboard();
      res.projects = (res.projects || []).map(ensureProjectCampStructure);
      state.dashboard = res;
      if (!state.selectedProjectId && res.projects.length > 0) {
        state.selectedProjectId = res.projects[0].id;
      }
      if (!state.scriptStudentId && res.projects.length > 0) {
        state.scriptStudentId = res.projects[0].id;
      }
      renderShell();
      if (!silent) showToast('数据已同步');
    } catch (err) {
      if (err && err.code === 401) {
        enterLoginScreen();
        showToast(err.msg || '请重新登录');
        return;
      }
      showToast(err.message || '加载数据失败');
    }
  }

  function enterLoginScreen() {
    document.getElementById('loginView').classList.remove('hidden');
    document.getElementById('appShell').classList.add('hidden');
    const urlInput = document.getElementById('loginCloudUrl');
    urlInput.value = API.getCloudUrl();
    const updateLoginHint = () => {
      syncModeBadges();
      if (API.isUsingLocalProxy()) {
        urlInput.placeholder = '已自动启用本地官方代理 (/api/cloud)，无需填写';
      } else {
        urlInput.placeholder = '留空则使用本地演示模式；填入 https://.../consultApi 可直连小程序云库';
      }
    };
    updateLoginHint();
    API.detectLocalProxy().then(updateLoginHint);
  }

  function enterMainApp() {
    document.getElementById('loginView').classList.add('hidden');
    document.getElementById('appShell').classList.remove('hidden');
    syncModeBadges();
    refreshDashboard(true);
  }

  function renderShell() {
    const { user, projects } = state.dashboard;
    document.getElementById('navProjectCount').textContent = projects.length;
    document.getElementById('topbarUserChip').textContent = user
      ? `${user.name} · ${user.title}${user.roleType === 'super' ? ' (主管理员)' : ''}`
      : '未登录';

    const titleMap = {
      board: '全局交付看板',
      cockpit: '学员陪跑驾驶舱（运营线 + 12大板块）',
      scripts: '标准话术与陪跑 SOP 模板库',
      radar: '电子宣传单 · 获客访客雷达',
      accounts: '顾问助教与学员账号权限中心',
      settings: '微信云开发 HTTP 访问连接设置'
    };
    document.getElementById('topbarTitle').textContent = titleMap[state.view] || '交付工作台';

    document.querySelectorAll('#sidebarNav .nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.view === state.view);
    });

    const container = document.getElementById('mainAppContent');
    if (state.view === 'board') renderBoardView(container);
    else if (state.view === 'cockpit') renderCockpitView(container);
    else if (state.view === 'scripts') renderScriptsView(container);
    else if (state.view === 'radar') renderRadarView(container);
    else if (state.view === 'accounts') renderAccountsView(container);
    else if (state.view === 'settings') renderSettingsView(container);
  }

  // ==================== 视图 1：全局交付看板 ====================
  function renderBoardView(container) {
    const projects = state.dashboard.projects || [];
    let totalPercentSum = 0;
    let totalPendingReplies = 0;
    projects.forEach(p => {
      const st = WF.calcProjectStats(p);
      totalPercentSum += st.taskPercent;
      totalPendingReplies += st.pendingFeedbackReplies;
    });
    const avgPercent = projects.length ? Math.round(totalPercentSum / projects.length) : 0;
    const leads = (state.dashboard.visitorStats && state.dashboard.visitorStats.totalLeads) || 0;

    const filtered = projects.filter(p => {
      if (state.boardStepFilter > 0 && Number(p.currentStep) !== state.boardStepFilter) return false;
      const kw = state.boardSearch.trim().toLowerCase();
      if (kw) {
        const hay = `${p.name} ${p.phone} ${p.industry} ${p.type}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });

    container.innerHTML = `
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">在营陪跑学员总数</div>
          <div class="kpi-val">${projects.length}</div>
          <div class="kpi-sub">一学员一档案 · 双线独立追踪</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">驾驶舱平均交付进度</div>
          <div class="kpi-val">${avgPercent}%</div>
          <div class="kpi-sub">覆盖 12 板块 / ${WF.getAllCockpitTasks().length} 个节点</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">待回复学员单场评价</div>
          <div class="kpi-val" style="color:${totalPendingReplies > 0 ? '#a93b33' : '#181411'}">${totalPendingReplies}</div>
          <div class="kpi-sub">及时回应客户评价可提升续费口碑</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">电子宣传单高意向线索</div>
          <div class="kpi-val">${leads}</div>
          <div class="kpi-sub">点击过微信/电话咨询的精准访客</div>
        </div>
      </div>

      <div class="card">
        <div class="filter-bar">
          <div class="pill-tabs" id="boardStepPills">
            <button class="pill-tab ${state.boardStepFilter === 0 ? 'active' : ''}" data-step="0">全部阶段 (${projects.length})</button>
            ${WF.DELIVERY_STEPS.map(s => {
              const cnt = projects.filter(p => Number(p.currentStep) === s.step).length;
              return `<button class="pill-tab ${state.boardStepFilter === s.step ? 'active' : ''}" data-step="${s.step}">${s.code} ${s.title} (${cnt})</button>`;
            }).join('')}
          </div>
          <input id="boardSearchInput" class="form-control" style="max-width:260px;" placeholder="搜索学员姓名/手机号/行业..." value="${escapeHtml(state.boardSearch)}" />
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>学员 / 赛道</th>
              <th>当前闭环阶段</th>
              <th>运营流水线 (10步)</th>
              <th>驾驶舱交付进度 (42节点)</th>
              <th>核心成果对比</th>
              <th>待处理事项</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.length === 0 ? `<tr><td colspan="7" style="text-align:center;color:#999;padding:30px;">暂无符合条件的学员档案</td></tr>` : filtered.map(p => {
              const st = WF.calcProjectStats(p);
              return `
                <tr>
                  <td>
                    <div style="font-weight:700;color:#181411;">${escapeHtml(p.name)} <span style="font-weight:400;color:#888;font-size:12px;">(${escapeHtml(p.phone)})</span></div>
                    <div style="font-size:12px;color:#7a6f64;">${escapeHtml(p.industry)} · ${escapeHtml(p.type)}</div>
                  </td>
                  <td><span class="badge badge-gold">${escapeHtml(p.stepName)}</span></td>
                  <td>
                    <div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:${st.pipePercent}%"></div></div>
                    <span>${st.pipeDone}/${st.pipeTotal}</span>
                  </td>
                  <td>
                    <div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:${st.taskPercent}%"></div></div>
                    <span>${st.taskDone}/${st.taskTotal} (${st.taskPercent}%)</span>
                  </td>
                  <td>
                    <div style="font-size:12px;">客单：${escapeHtml((p.metrics && p.metrics.ticketBefore) || '-')} → <strong style="color:#8d6238;">${escapeHtml((p.metrics && p.metrics.ticketAfter) || '-')}</strong></div>
                    <div style="font-size:12px;color:#7a6f64;">里程碑评价：${st.milestoneDone}/${st.milestoneTotal}</div>
                  </td>
                  <td>
                    ${st.pendingFeedbackReplies > 0
                      ? `<span class="badge badge-red">${st.pendingFeedbackReplies} 条评价待回复</span>`
                      : '<span class="badge badge-done">已全部响应</span>'}
                  </td>
                  <td>
                    <button class="btn btn-primary btn-sm js-enter-cockpit" data-id="${escapeHtml(p.id)}">进入陪跑驾驶舱 ›</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    container.querySelectorAll('#boardStepPills .pill-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        state.boardStepFilter = Number(btn.dataset.step);
        renderBoardView(container);
      });
    });

    const searchInput = document.getElementById('boardSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', e => {
        state.boardSearch = e.target.value;
        renderBoardView(container);
      });
    }

    container.querySelectorAll('.js-enter-cockpit').forEach(btn => {
      btn.addEventListener('click', () => {
        state.selectedProjectId = btn.dataset.id;
        state.view = 'cockpit';
        renderShell();
      });
    });
  }

  // ==================== 视图 2：学员陪跑驾驶舱 ====================
  function renderCockpitView(container) {
    const projects = state.dashboard.projects || [];
    const proj = getSelectedProject();
    if (!proj) {
      container.innerHTML = `<div class="card" style="text-align:center;padding:50px;">暂无学员档案，请点击右上角「+ 新建学员建档」开始交付。</div>`;
      return;
    }

    const kw = state.cockpitSearch.trim().toLowerCase();
    const sideProjects = projects.filter(p => !kw || `${p.name} ${p.phone} ${p.industry}`.toLowerCase().includes(kw));
    const stats = WF.calcProjectStats(proj);

    container.innerHTML = `
      <div class="cockpit-layout">
        <aside class="student-list-panel">
          <div style="font-weight:700;font-size:14px;margin-bottom:8px;">在营学员切换 (${projects.length})</div>
          <input id="cockpitSearchInput" class="form-control" style="padding:7px 10px;font-size:13px;" placeholder="搜索姓名/手机号..." value="${escapeHtml(state.cockpitSearch)}" />
          ${sideProjects.map(p => {
            const st = WF.calcProjectStats(p);
            return `
              <div class="student-card ${p.id === proj.id ? 'active' : ''} js-select-student" data-id="${escapeHtml(p.id)}">
                <div class="sc-top">
                  <span class="sc-name">${escapeHtml(p.name)}</span>
                  <span class="badge badge-gold">${escapeHtml(p.stepName)}</span>
                </div>
                <div class="sc-meta">${escapeHtml(p.industry)}</div>
                <div style="display:flex;align-items:center;justify-content:space-between;font-size:12px;">
                  <span>驾驶舱 ${st.taskDone}/${st.taskTotal} (${st.taskPercent}%)</span>
                  ${st.pendingFeedbackReplies > 0 ? `<span style="color:#a93b33;font-weight:700;">● 待回复</span>` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </aside>

        <div>
          <div class="hero-student-card">
            <div class="hsc-top">
              <div>
                <div class="hsc-name">${escapeHtml(proj.name)} · <span style="font-size:15px;font-weight:500;color:#e2b678;">${escapeHtml(proj.industry)}</span></div>
                <div class="hsc-sub">
                  方案：${escapeHtml(proj.type)} ｜ 登录手机：${escapeHtml(proj.phone)} ｜ 运营线：${stats.pipeDone}/${stats.pipeTotal} ｜ 驾驶舱：${stats.taskDone}/${stats.taskTotal} (${stats.taskPercent}%)
                </div>
              </div>
              <div class="hsc-actions">
                <button class="btn btn-outline btn-sm" id="btnCopyClientPass">📋 复制客户账号密码</button>
                <button class="btn btn-primary btn-sm" id="btnPrintReport">🖨️ 导出 / 打印 PDF 报告</button>
              </div>
            </div>

            <div class="step-track">
              ${WF.DELIVERY_STEPS.map(s => {
                const cls = Number(proj.currentStep) === s.step ? 'current' : (Number(proj.currentStep) > s.step ? 'passed' : '');
                return `
                  <button type="button" class="step-node-btn ${cls} js-set-step" data-step="${s.step}">
                    <div style="font-size:11px;opacity:0.8;">STEP ${s.code}</div>
                    <div style="font-size:13px;font-weight:700;">${s.title}</div>
                  </button>
                `;
              }).join('')}
            </div>
          </div>

          <div class="workspace-tabs" id="cockpitSubTabs">
            <button class="w-tab ${state.cockpitSubTab === 'pipeline' ? 'active' : ''}" data-tab="pipeline">1. 运营录取与把关线 (${stats.pipeDone}/${stats.pipeTotal})</button>
            <button class="w-tab ${state.cockpitSubTab === 'cockpit' ? 'active' : ''}" data-tab="cockpit">2. 12大驾驶舱进度 (${stats.taskDone}/${stats.taskTotal})</button>
            <button class="w-tab ${state.cockpitSubTab === 'sessions' ? 'active' : ''}" data-tab="sessions">3. 1V1 咨询过程与反馈 (${(proj.sessions || []).length})</button>
            <button class="w-tab ${state.cockpitSubTab === 'deliverables' ? 'active' : ''}" data-tab="deliverables">4. 交付文档与战果 (${(proj.deliverables || []).length})</button>
            <button class="w-tab ${state.cockpitSubTab === 'profile' ? 'active' : ''}" data-tab="profile">5. 档案与凭据</button>
          </div>

          <div id="cockpitSubBody"></div>
        </div>
      </div>
    `;

    document.getElementById('cockpitSearchInput').addEventListener('input', e => {
      state.cockpitSearch = e.target.value;
      renderCockpitView(container);
    });
    container.querySelectorAll('.js-select-student').forEach(card => {
      card.addEventListener('click', () => {
        state.selectedProjectId = card.dataset.id;
        renderCockpitView(container);
      });
    });
    container.querySelectorAll('.js-set-step').forEach(btn => {
      btn.addEventListener('click', async () => {
        const step = Number(btn.dataset.step);
        const res = await API.updateProject(proj.id, { currentStep: step });
        if (res.ok) {
          replaceProjectInState(res.project);
          renderCockpitView(container);
          showToast(`已推进至 ${res.project.stepName}`);
        }
      });
    });

    document.getElementById('btnCopyClientPass').addEventListener('click', () => {
      const pass = (state.dashboard.clientPasswords || {})[proj.phone] || proj.phone.slice(-6);
      const txt = `【岩值商业咨询 · 专属交付空间账号】\n学员：${proj.name}\n登录手机号：${proj.phone}\n登录密码：${pass}\n（请在微信小程序「岩值咨询 -> 我的 -> 客户账号登录」查看咨询纪要与交付成果）`;
      copyText(txt, '客户账号密码已复制');
    });

    document.getElementById('btnPrintReport').addEventListener('click', () => {
      printStudentReport(proj, stats);
    });

    container.querySelectorAll('#cockpitSubTabs .w-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        state.cockpitSubTab = tab.dataset.tab;
        renderCockpitSubBody(proj, stats);
        container.querySelectorAll('#cockpitSubTabs .w-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === state.cockpitSubTab));
      });
    });

    renderCockpitSubBody(proj, stats);
  }

  function replaceProjectInState(updated) {
    const idx = (state.dashboard.projects || []).findIndex(p => p.id === updated.id);
    if (idx !== -1) state.dashboard.projects[idx] = ensureProjectCampStructure(updated);
  }

  function renderCockpitSubBody(proj, stats) {
    const body = document.getElementById('cockpitSubBody');
    if (state.cockpitSubTab === 'pipeline') renderPipelineTab(body, proj);
    else if (state.cockpitSubTab === 'cockpit') renderCockpitTasksTab(body, proj, stats);
    else if (state.cockpitSubTab === 'sessions') renderSessionsTab(body, proj);
    else if (state.cockpitSubTab === 'deliverables') renderDeliverablesTab(body, proj);
    else if (state.cockpitSubTab === 'profile') renderProfileTab(body, proj);
  }

  // 子页签 A：10步运营录取与把关流水线
  function renderPipelineTab(body, proj) {
    const pipeMap = {};
    (proj.campPipeline || []).forEach(item => { pipeMap[item.stageId] = item; });

    body.innerHTML = WF.PIPELINE_STAGES.map(stage => {
      const rec = pipeMap[stage.id] || { stageId: stage.id, status: 'pending', assignee: stage.ownerRole, recordingUrl: '', note: '' };
      const renderedScript = WF.renderScript(stage.script, proj);
      return `
        <div class="pipe-item">
          <div class="pipe-head">
            <div>
              <span class="badge badge-gold">STEP ${stage.order} · ${escapeHtml(stage.phase)}</span>
              <span class="pipe-title" style="margin-left:8px;">${escapeHtml(stage.title)}</span>
              <span style="font-size:12px;color:#7a6f64;margin-left:6px;">(${escapeHtml(stage.duration)})</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
              ${statusBadgeHtml(rec.status)}
              <select class="form-control js-pipe-status" data-stage="${stage.id}" style="width:auto;padding:4px 8px;font-size:12px;">
                <option value="pending" ${rec.status === 'pending' ? 'selected' : ''}>待开始</option>
                <option value="in_progress" ${rec.status === 'in_progress' ? 'selected' : ''}>进行中</option>
                <option value="done" ${rec.status === 'done' ? 'selected' : ''}>已完成</option>
              </select>
            </div>
          </div>

          <div class="pipe-grid">
            <div class="pipe-box"><span class="pipe-box-lbl">责任角色</span>${escapeHtml(stage.ownerRole)}</div>
            <div class="pipe-box"><span class="pipe-box-lbl">关键执行点</span>${escapeHtml(stage.keyPoints)}</div>
            <div class="pipe-box"><span class="pipe-box-lbl">要求产出物</span>${escapeHtml(stage.outputs)}</div>
          </div>

          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:8px;">
            <input class="tr-input js-pipe-assignee" data-stage="${stage.id}" placeholder="实际执行人" value="${escapeHtml(rec.assignee || '')}" style="min-width:130px;" />
            <input class="tr-input js-pipe-rec" data-stage="${stage.id}" placeholder="会议回放 / 录音 / 凭证链接" value="${escapeHtml(rec.recordingUrl || '')}" />
            <input class="tr-input js-pipe-note" data-stage="${stage.id}" placeholder="导师批注或推进备注..." value="${escapeHtml(rec.note || '')}" style="flex:1;" />
            <button class="btn btn-outline btn-sm js-save-pipe" data-stage="${stage.id}">保存该环节</button>
          </div>

          <div class="script-preview">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
              <strong style="color:#8d6238;">💬 标准话术模板（已自动代入「${escapeHtml(proj.name)}」）</strong>
              <button class="btn btn-outline btn-sm js-copy-pipe-script" data-stage="${stage.id}">一键复制话术</button>
            </div>
            <div>${escapeHtml(renderedScript)}</div>
          </div>
        </div>
      `;
    }).join('');

    async function saveStagePatch(stageId, overrideStatus) {
      const statusSel = body.querySelector(`.js-pipe-status[data-stage="${stageId}"]`);
      const assigneeEl = body.querySelector(`.js-pipe-assignee[data-stage="${stageId}"]`);
      const recEl = body.querySelector(`.js-pipe-rec[data-stage="${stageId}"]`);
      const noteEl = body.querySelector(`.js-pipe-note[data-stage="${stageId}"]`);

      const nextPipe = WF.PIPELINE_STAGES.map(st => {
        const existing = (proj.campPipeline || []).find(x => x.stageId === st.id) || { stageId: st.id, status: 'pending' };
        if (st.id !== stageId) return existing;
        return {
          ...existing,
          status: overrideStatus || (statusSel ? statusSel.value : existing.status),
          assignee: assigneeEl ? assigneeEl.value.trim() : existing.assignee,
          recordingUrl: recEl ? recEl.value.trim() : existing.recordingUrl,
          note: noteEl ? noteEl.value.trim() : existing.note,
          updatedAt: new Date().toISOString().slice(0, 10)
        };
      });

      const res = await API.updateProject(proj.id, { campPipeline: nextPipe });
      if (res.ok) {
        replaceProjectInState(res.project);
        renderCockpitView(document.getElementById('mainAppContent'));
        showToast('运营流程进度已保存');
      }
    }

    body.querySelectorAll('.js-pipe-status').forEach(sel => {
      sel.addEventListener('change', () => saveStagePatch(sel.dataset.stage, sel.value));
    });
    body.querySelectorAll('.js-save-pipe').forEach(btn => {
      btn.addEventListener('click', () => saveStagePatch(btn.dataset.stage));
    });
    body.querySelectorAll('.js-copy-pipe-script').forEach(btn => {
      btn.addEventListener('click', () => {
        const stage = WF.PIPELINE_STAGES.find(s => s.id === btn.dataset.stage);
        if (stage) copyText(WF.renderScript(stage.script, proj), '已复制话术（已替换学员姓名）');
      });
    });
  }

  // 子页签 B：12大驾驶舱板块（42节点）
  function renderCockpitTasksTab(body, proj) {
    const progressMap = proj.cockpitProgress || {};

    body.innerHTML = `
      <div class="card" style="margin-bottom:14px;padding:14px 16px;">
        <div class="filter-bar" style="margin-bottom:0;">
          <div class="pill-tabs" id="cockpitTaskFilters">
            <button class="pill-tab ${state.cockpitTaskFilter === 'all' ? 'active' : ''}" data-filter="all">全部节点 (${WF.getAllCockpitTasks().length})</button>
            <button class="pill-tab ${state.cockpitTaskFilter === 'milestone' ? 'active' : ''}" data-filter="milestone">★ 仅看打星评价里程碑</button>
            <button class="pill-tab ${state.cockpitTaskFilter === 'pending' ? 'active' : ''}" data-filter="pending">待推进 / 进行中</button>
            <button class="pill-tab ${state.cockpitTaskFilter === 'done' ? 'active' : ''}" data-filter="done">已完成</button>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-outline btn-sm" id="btnExpandAllMods">全部展开</button>
            <button class="btn btn-outline btn-sm" id="btnCollapseAllMods">全部收起</button>
          </div>
        </div>
      </div>

      ${WF.COCKPIT_MODULES.map(mod => {
        const filteredTasks = mod.tasks.filter(t => {
          const st = (progressMap[t.id] && progressMap[t.id].status) || 'pending';
          if (state.cockpitTaskFilter === 'milestone') return t.isMilestone;
          if (state.cockpitTaskFilter === 'pending') return st !== 'done';
          if (state.cockpitTaskFilter === 'done') return st === 'done';
          return true;
        });
        if (filteredTasks.length === 0) return '';

        const modDone = mod.tasks.filter(t => (progressMap[t.id] && progressMap[t.id].status) === 'done').length;
        const expanded = !!state.expandedModules[mod.moduleId];

        return `
          <div class="cockpit-mod">
            <div class="cm-header js-toggle-mod" data-mod="${mod.moduleId}">
              <div>
                <div class="cm-title">${mod.moduleNo} · ${escapeHtml(mod.moduleTitle)} <span class="badge ${modDone === mod.tasks.length ? 'badge-done' : 'badge-gold'}" style="margin-left:8px;">${modDone}/${mod.tasks.length}</span></div>
                <div class="cm-sub">${escapeHtml(mod.summary)}</div>
              </div>
              <span style="font-size:13px;color:#8d6238;font-weight:600;">${expanded ? '收起 ▲' : '展开 ▼'}</span>
            </div>
            <div class="cm-body ${expanded ? '' : 'hidden'}">
              ${filteredTasks.map(task => {
                const rec = progressMap[task.id] || { status: 'pending', attachment: '', note: '', rating: null, reviewText: '' };
                const avgStar = rec.rating
                  ? ((Number(rec.rating.professional || 5) + Number(rec.rating.attitude || 5) + Number(rec.rating.response || 5) + Number(rec.rating.result || 5)) / 4).toFixed(1)
                  : '';
                return `
                  <div class="task-row">
                    <div class="tr-top">
                      <div>
                        <div class="tr-title">${escapeHtml(task.title)} <span class="badge badge-pending" style="margin-left:6px;">${escapeHtml(task.formType)}</span></div>
                        <div class="tr-desc">${escapeHtml(task.detail)}</div>
                      </div>
                      <div style="display:flex;align-items:center;gap:6px;">
                        ${statusBadgeHtml(rec.status)}
                        <select class="form-control js-task-status" data-task="${task.id}" style="width:auto;padding:4px 8px;font-size:12px;">
                          <option value="pending" ${rec.status === 'pending' ? 'selected' : ''}>待开始</option>
                          <option value="in_progress" ${rec.status === 'in_progress' ? 'selected' : ''}>进行中</option>
                          <option value="done" ${rec.status === 'done' ? 'selected' : ''}>已完成</option>
                        </select>
                      </div>
                    </div>

                    <div class="tr-meta">
                      <input class="tr-input js-task-att" data-task="${task.id}" placeholder="作业/表格/截图附件名称或云链接" value="${escapeHtml(rec.attachment || '')}" />
                      <input class="tr-input js-task-note" data-task="${task.id}" placeholder="助教跟进批注" value="${escapeHtml(rec.note || '')}" style="flex:1;" />
                      <button class="btn btn-outline btn-sm js-save-task" data-task="${task.id}">保存记录</button>
                      <button class="btn btn-outline btn-sm js-copy-task-script" data-task="${task.id}">💬 复制引导话术</button>
                      ${task.hasRating ? `<button class="btn btn-primary btn-sm js-open-rating-modal" data-task="${task.id}">★ 4维打星与复盘</button>` : ''}
                    </div>

                    ${rec.reviewText || rec.rating ? `
                      <div class="review-preview">
                        ${rec.rating ? `<div style="font-weight:700;color:#8d6238;margin-bottom:4px;">★ 综合评分 ${avgStar} 分（专业 ${rec.rating.professional || 5} / 态度 ${rec.rating.attitude || 5} / 响应 ${rec.rating.response || 5} / 结果 ${rec.rating.result || 5}）</div>` : ''}
                        ${rec.reviewText ? `<div style="white-space:pre-wrap;color:#3d3228;">${escapeHtml(rec.reviewText)}</div>` : ''}
                      </div>
                    ` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }).join('')}
    `;

    body.querySelectorAll('#cockpitTaskFilters .pill-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        state.cockpitTaskFilter = btn.dataset.filter;
        renderCockpitTasksTab(body, proj);
      });
    });

    document.getElementById('btnExpandAllMods').addEventListener('click', () => {
      WF.COCKPIT_MODULES.forEach(m => { state.expandedModules[m.moduleId] = true; });
      renderCockpitTasksTab(body, proj);
    });
    document.getElementById('btnCollapseAllMods').addEventListener('click', () => {
      state.expandedModules = {};
      renderCockpitTasksTab(body, proj);
    });

    body.querySelectorAll('.js-toggle-mod').forEach(hd => {
      hd.addEventListener('click', () => {
        const id = hd.dataset.mod;
        state.expandedModules[id] = !state.expandedModules[id];
        renderCockpitTasksTab(body, proj);
      });
    });

    async function saveTaskPatch(taskId, overrideStatus) {
      const stEl = body.querySelector(`.js-task-status[data-task="${taskId}"]`);
      const attEl = body.querySelector(`.js-task-att[data-task="${taskId}"]`);
      const noteEl = body.querySelector(`.js-task-note[data-task="${taskId}"]`);
      const nextProgress = { ...(proj.cockpitProgress || {}) };
      const prev = nextProgress[taskId] || {};
      nextProgress[taskId] = {
        ...prev,
        status: overrideStatus || (stEl ? stEl.value : prev.status || 'pending'),
        attachment: attEl ? attEl.value.trim() : (prev.attachment || ''),
        note: noteEl ? noteEl.value.trim() : (prev.note || ''),
        updatedAt: new Date().toISOString().slice(0, 10)
      };
      const res = await API.updateProject(proj.id, { cockpitProgress: nextProgress });
      if (res.ok) {
        replaceProjectInState(res.project);
        renderCockpitView(document.getElementById('mainAppContent'));
        showToast('驾驶舱节点已更新');
      }
    }

    body.querySelectorAll('.js-task-status').forEach(sel => {
      sel.addEventListener('change', () => saveTaskPatch(sel.dataset.task, sel.value));
    });
    body.querySelectorAll('.js-save-task').forEach(btn => {
      btn.addEventListener('click', () => saveTaskPatch(btn.dataset.task));
    });
    body.querySelectorAll('.js-copy-task-script').forEach(btn => {
      btn.addEventListener('click', () => {
        const hit = WF.getAllCockpitTasks().find(t => t.id === btn.dataset.task);
        if (hit) copyText(WF.renderScript(hit.script, proj), '已复制引导话术');
      });
    });
    body.querySelectorAll('.js-open-rating-modal').forEach(btn => {
      btn.addEventListener('click', () => openRatingReviewModal(proj, btn.dataset.task));
    });
  }

  // 子页签 C：1V1 咨询过程与反馈（双向同步小程序）
  function renderSessionsTab(body, proj) {
    const sessions = proj.sessions || [];
    body.innerHTML = `
      <div class="card" style="margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <strong style="font-size:15px;">1V1 深度咨询纪要与课后行动追踪</strong>
          <div style="font-size:12px;color:#7a6f64;">此处发布的咨询纪要与评价回复会实时呈现在学员微信小程序「专属交付空间」。</div>
        </div>
        <button class="btn btn-primary" id="btnNewSession">+ 新增 1V1 咨询纪要</button>
      </div>

      ${sessions.length === 0 ? '<div class="card" style="text-align:center;color:#999;">暂未录入 1V1 咨询过程纪要</div>' : sessions.map(ses => `
        <div class="session-card">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px;">
            <div>
              <span class="badge badge-gold">第 ${ses.sessionNo} 次咨询</span>
              <strong style="font-size:15px;margin-left:8px;">${escapeHtml(ses.title)}</strong>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:12px;color:#7a6f64;">${escapeHtml(ses.date)} ｜ ${escapeHtml(ses.mode)}</span>
              <button class="btn btn-outline btn-sm js-edit-session" data-ses="${escapeHtml(ses.sessionId)}">✏️ 编辑纪要</button>
            </div>
          </div>

          <div class="two-col-grid" style="margin-bottom:10px;">
            <div class="pipe-box"><span class="pipe-box-lbl">01 · 核心商业痛点诊断</span>${escapeHtml(ses.diagnosis)}</div>
            <div class="pipe-box"><span class="pipe-box-lbl">02 · 破局重构解法</span>${escapeHtml(ses.solution)}</div>
          </div>

          <div style="font-size:12px;margin-bottom:8px;">
            <strong style="color:#8d6238;">课后落地行动清单：</strong>
            ${(ses.actionItems || []).map(a => `
              <div style="margin-top:4px;padding-left:8px;">
                ${a.done ? '✅' : '⬜'} ${escapeHtml(a.text)}
                ${a.feedback ? `<span style="color:#227447;margin-left:8px;">（学员反馈：${escapeHtml(a.feedback)}）</span>` : ''}
              </div>
            `).join('')}
          </div>

          ${ses.consultantNote ? `<div style="font-size:12px;color:#7a6f64;">顾问批注：${escapeHtml(ses.consultantNote)}</div>` : ''}

          ${ses.clientFeedback || ses.clientRating > 0 ? `
            <div class="feedback-highlight">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <strong style="color:#b46914;font-size:13px;">学员本场评价 · ${ses.clientRating || 5}.0 ★</strong>
                <span style="font-size:12px;color:#888;">${escapeHtml(ses.clientFeedbackTime || '')}</span>
              </div>
              <div style="font-size:13px;margin:4px 0 8px;">“${escapeHtml(ses.clientFeedback)}”</div>
              ${ses.consultantReply
                ? `<div style="background:#fff;padding:8px 10px;border-left:4px solid #8d6238;font-size:12px;"><strong>导师回复：</strong>${escapeHtml(ses.consultantReply)}</div>`
                : `<button class="btn btn-primary btn-sm js-reply-session" data-ses="${escapeHtml(ses.sessionId)}">💬 立即回复学员评价</button>`
              }
            </div>
          ` : ''}
        </div>
      `).join('')}
    `;

    document.getElementById('btnNewSession').addEventListener('click', () => openSessionModal(proj, null));
    body.querySelectorAll('.js-edit-session').forEach(btn => {
      btn.addEventListener('click', () => {
        const hit = sessions.find(s => s.sessionId === btn.dataset.ses);
        if (hit) openSessionModal(proj, hit);
      });
    });
    body.querySelectorAll('.js-reply-session').forEach(btn => {
      btn.addEventListener('click', () => {
        const hit = sessions.find(s => s.sessionId === btn.dataset.ses);
        if (hit) openReplySessionModal(proj, hit);
      });
    });
  }

  // 子页签 D：交付文档与商业战果看板
  function renderDeliverablesTab(body, proj) {
    const m = proj.metrics || {};
    const delivs = proj.deliverables || [];
    body.innerHTML = `
      <div class="card" style="margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
          <div>
            <strong style="font-size:15px;">商业增长战果对比看板（同步学员端展示）</strong>
            <div style="font-size:12px;color:#7a6f64;">点击右侧按钮更新客单价、毛利率、营收及转化率对比指标。</div>
          </div>
          <button class="btn btn-outline btn-sm" id="btnEditMetrics">✏️ 编辑战果指标</button>
        </div>
        <div class="kpi-grid" style="margin-bottom:10px;">
          <div class="pipe-box"><span class="pipe-box-lbl">客单价跃迁</span>${escapeHtml(m.ticketBefore || '-')} → <strong>${escapeHtml(m.ticketAfter || '-')}</strong></div>
          <div class="pipe-box"><span class="pipe-box-lbl">毛利率提升</span>${escapeHtml(m.marginBefore || '-')} → <strong>${escapeHtml(m.marginAfter || '-')}</strong></div>
          <div class="pipe-box"><span class="pipe-box-lbl">营收规模</span>${escapeHtml(m.revenueBefore || '-')} → <strong>${escapeHtml(m.revenueAfter || '-')}</strong></div>
          <div class="pipe-box"><span class="pipe-box-lbl">高客单转化率</span>${escapeHtml(m.conversionBefore || '-')} → <strong>${escapeHtml(m.conversionAfter || '-')}</strong></div>
        </div>
        <div class="pipe-box"><span class="pipe-box-lbl">阶段实战战果复盘总结</span>${escapeHtml(m.highlightSummary || '暂无总结')}</div>
      </div>

      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
          <div>
            <strong style="font-size:15px;">阶段交付方案与文件成果库 (${delivs.length})</strong>
            <div style="font-size:12px;color:#7a6f64;">支持录入方案摘要、云存储文件链接及在线验收状态。</div>
          </div>
          <button class="btn btn-primary btn-sm" id="btnNewDeliverable">+ 发布交付文档</button>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>所属阶段</th>
              <th>交付文档标题</th>
              <th>文件附件 / 链接</th>
              <th>发布时间</th>
              <th>验收状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${delivs.length === 0 ? '<tr><td colspan="6" style="text-align:center;color:#999;">暂未发布交付文档</td></tr>' : delivs.map(d => `
              <tr>
                <td><span class="badge badge-gold">${escapeHtml(d.stage)}</span></td>
                <td>
                  <div style="font-weight:700;">${escapeHtml(d.title)}</div>
                  <div style="font-size:12px;color:#7a6f64;">${escapeHtml(d.summary)}</div>
                </td>
                <td style="font-size:12px;">
                  <div>${escapeHtml(d.fileType || '-')}</div>
                  ${d.fileName ? `<div style="color:#8d6238;">📎 ${escapeHtml(d.fileName)}</div>` : ''}
                  ${d.fileUrl ? `<div><a href="${escapeHtml(d.fileUrl)}" target="_blank" style="color:#227447;">打开链接 ↗</a></div>` : ''}
                </td>
                <td style="font-size:12px;color:#7a6f64;">${escapeHtml(d.deliverTime)}</td>
                <td><span class="badge ${d.status === '已确认验收' ? 'badge-done' : 'badge-progress'}">${escapeHtml(d.status)}</span></td>
                <td>
                  <button class="btn btn-outline btn-sm js-toggle-deliv-status" data-id="${escapeHtml(d.delivId)}">
                    ${d.status === '已确认验收' ? '设为待验收' : '标为已验收'}
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('btnEditMetrics').addEventListener('click', () => openMetricsModal(proj));
    document.getElementById('btnNewDeliverable').addEventListener('click', () => openDeliverableModal(proj));
    body.querySelectorAll('.js-toggle-deliv-status').forEach(btn => {
      btn.addEventListener('click', async () => {
        const hit = delivs.find(x => x.delivId === btn.dataset.id);
        if (!hit) return;
        const nextStatus = hit.status === '已确认验收' ? '待客户验收' : '已确认验收';
        const res = await API.updateDeliverable(proj.id, hit.delivId, { status: nextStatus });
        if (res.ok) {
          replaceProjectInState(res.project);
          renderDeliverablesTab(body, res.project);
          showToast('验收状态已更新');
        }
      });
    });
  }

  // 子页签 E：学员档案与凭据
  function renderProfileTab(body, proj) {
    const pass = (state.dashboard.clientPasswords || {})[proj.phone] || proj.phone.slice(-6);
    body.innerHTML = `
      <div class="card">
        <h3 style="font-size:16px;margin-bottom:14px;">学员基础档案与小程序登录凭据</h3>
        <div class="two-col-grid">
          <div class="form-group">
            <label class="form-label">学员姓名 / 创始人称呼</label>
            <input id="profName" class="form-control" value="${escapeHtml(proj.name)}" />
          </div>
          <div class="form-group">
            <label class="form-label">登录绑定手机号</label>
            <input id="profPhone" class="form-control" value="${escapeHtml(proj.phone)}" disabled />
          </div>
          <div class="form-group">
            <label class="form-label">所属行业赛道</label>
            <input id="profIndustry" class="form-control" value="${escapeHtml(proj.industry)}" />
          </div>
          <div class="form-group">
            <label class="form-label">签约服务方案</label>
            <input id="profType" class="form-control" value="${escapeHtml(proj.type)}" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">核心商业痛点与陪跑目标</label>
          <textarea id="profProblem" class="form-control">${escapeHtml(proj.problem)}</textarea>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;background:#faf7f1;border-radius:10px;margin-bottom:14px;">
          <div>
            <strong>客户小程序登录密码：</strong><span style="color:#8d6238;font-weight:700;font-size:15px;">${escapeHtml(pass)}</span>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-outline btn-sm" id="btnProfCopyCred">📋 复制凭据发客户</button>
            <button class="btn btn-outline btn-sm" id="btnProfResetPass">🔑 重置密码</button>
          </div>
        </div>
        <button class="btn btn-primary" id="btnSaveProfile">保存学员基础档案</button>
      </div>
    `;

    document.getElementById('btnSaveProfile').addEventListener('click', async () => {
      const res = await API.updateProject(proj.id, {
        name: document.getElementById('profName').value.trim(),
        industry: document.getElementById('profIndustry').value.trim(),
        type: document.getElementById('profType').value.trim(),
        problem: document.getElementById('profProblem').value.trim()
      });
      if (res.ok) {
        replaceProjectInState(res.project);
        renderCockpitView(document.getElementById('mainAppContent'));
        showToast('档案修改已保存');
      }
    });

    document.getElementById('btnProfCopyCred').addEventListener('click', () => {
      copyText(`【岩值商业咨询】账号：${proj.phone}  密码：${pass}`, '账号密码已复制');
    });

    document.getElementById('btnProfResetPass').addEventListener('click', () => openResetClientPassModal(proj.phone, proj.name));
  }

  // ==================== 视图 3：标准话术与 SOP 库 ====================
  function renderScriptsView(container) {
    const projects = state.dashboard.projects || [];
    const targetProj = projects.find(p => p.id === state.scriptStudentId) || projects[0] || { name: '高岩', industry: '个人品牌IP' };
    const kw = state.scriptSearch.trim().toLowerCase();

    const items = [];
    WF.PIPELINE_STAGES.forEach(s => {
      items.push({ source: `运营流水线 · ${s.order}. ${s.title}`, role: s.ownerRole, text: s.script });
    });
    WF.COCKPIT_MODULES.forEach(m => {
      m.tasks.forEach(t => {
        items.push({ source: `驾驶舱 ${m.moduleNo} ${m.moduleTitle} · ${t.title}`, role: t.formType, text: t.script });
      });
    });
    items.push({ source: '通用模板 · 课后服务 💡 复盘标准格式', role: '学员填写/助教留档', text: WF.REVIEW_TEMPLATE });

    const filtered = items.filter(it => !kw || `${it.source} ${it.text}`.toLowerCase().includes(kw));

    container.innerHTML = `
      <div class="card" style="margin-bottom:16px;">
        <div class="filter-bar" style="margin-bottom:0;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:13px;font-weight:600;">话术姓名变量代入：</span>
            <select id="scriptStudentSelect" class="form-control" style="width:auto;">
              ${projects.map(p => `<option value="${escapeHtml(p.id)}" ${p.id === targetProj.id ? 'selected' : ''}>${escapeHtml(p.name)}（${escapeHtml(p.industry)}）</option>`).join('')}
            </select>
          </div>
          <input id="scriptSearchInput" class="form-control" style="max-width:300px;" placeholder="搜索关键字（如：录取、驾驶舱、形象照）..." value="${escapeHtml(state.scriptSearch)}" />
        </div>
      </div>

      <div class="two-col-grid">
        ${filtered.map((it, idx) => {
          const rendered = WF.renderScript(it.text, targetProj);
          return `
            <div class="card">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px;">
                <strong style="font-size:14px;color:#181411;">${escapeHtml(it.source)}</strong>
                <span class="badge badge-gold">${escapeHtml(it.role)}</span>
              </div>
              <div class="script-preview" style="margin-top:0;margin-bottom:10px;">${escapeHtml(rendered)}</div>
              <button class="btn btn-outline btn-sm js-copy-lib-script" data-idx="${idx}">📋 复制本条话术</button>
            </div>
          `;
        }).join('')}
      </div>
    `;

    document.getElementById('scriptStudentSelect').addEventListener('change', e => {
      state.scriptStudentId = e.target.value;
      renderScriptsView(container);
    });
    document.getElementById('scriptSearchInput').addEventListener('input', e => {
      state.scriptSearch = e.target.value;
      renderScriptsView(container);
    });
    container.querySelectorAll('.js-copy-lib-script').forEach(btn => {
      btn.addEventListener('click', () => {
        const it = filtered[Number(btn.dataset.idx)];
        if (it) copyText(WF.renderScript(it.text, targetProj), '已复制替换好学员姓名的话术');
      });
    });
  }

  // ==================== 视图 4：获客访客雷达 ====================
  function renderRadarView(container) {
    const stats = state.dashboard.visitorStats || {};
    const visitors = state.dashboard.visitors || [];
    const brochure = state.dashboard.brochure || {};

    container.innerHTML = `
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">宣传单累计阅读</div>
          <div class="kpi-val">${brochure.views || stats.totalViews || 0}</div>
          <div class="kpi-sub">独立追踪访客：${stats.totalVisitors || visitors.length} 人</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">累计转发分享</div>
          <div class="kpi-val">${brochure.shares || stats.totalShares || 0}</div>
          <div class="kpi-sub">裂变拉新人数：${stats.totalInvites || 0}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">高意向线索用户</div>
          <div class="kpi-val" style="color:#8d6238;">${stats.totalLeads || 0}</div>
          <div class="kpi-sub">触发加微信或一键拨号</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">数据来源</div>
          <div class="kpi-val" style="font-size:18px;margin-top:6px;">${API.getMode() === 'cloud' ? '云数据库实时读取' : '本地演示样本'}</div>
          <div class="kpi-sub">对应集合：yj_brochure_visits</div>
        </div>
      </div>

      <div class="card">
        <h3 style="font-size:15px;margin-bottom:12px;">最近访问电子宣传单访客列表</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>访客标识</th>
              <th>角色身份</th>
              <th>浏览次数</th>
              <th>转发次数</th>
              <th>点击加微信 / 拨号</th>
              <th>最近访问时间</th>
            </tr>
          </thead>
          <tbody>
            ${visitors.length === 0 ? '<tr><td colspan="6" style="text-align:center;color:#999;">暂无访客追踪记录</td></tr>' : visitors.map(v => `
              <tr>
                <td><strong>${escapeHtml(v.viewerName || ('微信访客 #' + (v.shortId || '0000')))}</strong></td>
                <td><span class="badge badge-gold">${escapeHtml(v.viewerRole || 'guest')}</span></td>
                <td>${v.viewCount || 0}</td>
                <td>${v.shareCount || 0}</td>
                <td>微信 ${v.wechatClickCount || 0} 次 / 电话 ${v.phoneClickCount || 0} 次</td>
                <td style="color:#7a6f64;font-size:12px;">${escapeHtml(v.lastVisitTime || '-')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // ==================== 视图 5：账号与权限中心 ====================
  function renderAccountsView(container) {
    const user = state.dashboard.user || {};
    const isSuper = user.roleType === 'super';
    const admins = state.dashboard.adminAccounts || [];
    const projects = state.dashboard.projects || [];
    const passMap = state.dashboard.clientPasswords || {};

    container.innerHTML = `
      <div class="card" style="margin-bottom:18px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div>
            <h3 style="font-size:16px;">顾问与助教交付账号</h3>
            <div style="font-size:12px;color:#7a6f64;">${isSuper ? '您当前为主管理员，可新增助教/顾问账号或启停权限。' : '当前为普通顾问/助教视角，仅主管理员可增删账号。'}</div>
          </div>
          ${isSuper ? '<button class="btn btn-primary btn-sm" id="btnOpenAddAdmin">+ 新增顾问/助教</button>' : ''}
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>姓名 / 头衔</th>
              <th>登录账号</th>
              <th>权限角色</th>
              <th>账号状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${admins.map(a => `
              <tr>
                <td><strong>${escapeHtml(a.name)}</strong> <span style="font-size:12px;color:#7a6f64;">${escapeHtml(a.title)}</span></td>
                <td>${escapeHtml(a.username)}</td>
                <td><span class="badge ${a.roleType === 'super' ? 'badge-gold' : 'badge-pending'}">${a.roleType === 'super' ? '主管理员' : '助教/顾问'}</span></td>
                <td><span class="badge ${a.status === 'active' ? 'badge-done' : 'badge-red'}">${a.status === 'active' ? '正常启用' : '已停用'}</span></td>
                <td style="font-size:12px;color:#7a6f64;">${escapeHtml(a.createTime || '-')}</td>
                <td>
                  ${isSuper && a.id !== user.id ? `
                    <button class="btn btn-outline btn-sm js-toggle-admin" data-id="${escapeHtml(a.id)}">${a.status === 'active' ? '停用' : '启用'}</button>
                    <button class="btn btn-danger btn-sm js-del-admin" data-id="${escapeHtml(a.id)}">删除</button>
                  ` : '<span style="font-size:12px;color:#999;">—</span>'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="card">
        <h3 style="font-size:16px;margin-bottom:12px;">已立项学员小程序登录密码清单</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>学员姓名</th>
              <th>登录手机号</th>
              <th>当前登录密码</th>
              <th>项目阶段</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${projects.map(p => {
              const pass = passMap[p.phone] || p.phone.slice(-6);
              return `
                <tr>
                  <td><strong>${escapeHtml(p.name)}</strong></td>
                  <td>${escapeHtml(p.phone)}</td>
                  <td style="font-weight:700;color:#8d6238;">${escapeHtml(pass)}</td>
                  <td><span class="badge badge-gold">${escapeHtml(p.stepName)}</span></td>
                  <td>
                    <button class="btn btn-outline btn-sm js-copy-client-pw" data-name="${escapeHtml(p.name)}" data-phone="${escapeHtml(p.phone)}" data-pass="${escapeHtml(pass)}">复制凭据</button>
                    ${isSuper ? `<button class="btn btn-outline btn-sm js-reset-client-pw" data-name="${escapeHtml(p.name)}" data-phone="${escapeHtml(p.phone)}">重置密码</button>` : ''}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    const addBtn = document.getElementById('btnOpenAddAdmin');
    if (addBtn) addBtn.addEventListener('click', openAddAdminModal);

    container.querySelectorAll('.js-toggle-admin').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          await API.manageAccounts('toggleAdminStatus', { id: btn.dataset.id });
          await refreshDashboard(true);
          showToast('账号状态已更新');
        } catch (err) {
          showToast(err.message);
        }
      });
    });

    container.querySelectorAll('.js-del-admin').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!window.confirm('确认删除该顾问/助教账号吗？')) return;
        try {
          await API.manageAccounts('deleteAdmin', { id: btn.dataset.id });
          await refreshDashboard(true);
          showToast('账号已删除');
        } catch (err) {
          showToast(err.message);
        }
      });
    });

    container.querySelectorAll('.js-copy-client-pw').forEach(btn => {
      btn.addEventListener('click', () => {
        copyText(`【岩值商业咨询】账号：${btn.dataset.phone} 密码：${btn.dataset.pass}`, '已复制给客户');
      });
    });

    container.querySelectorAll('.js-reset-client-pw').forEach(btn => {
      btn.addEventListener('click', () => openResetClientPassModal(btn.dataset.phone, btn.dataset.name));
    });
  }

  // ==================== 视图 6：云开发连接设置 ====================
  function renderSettingsView(container) {
    const url = API.getCloudUrl();
    const proxy = API.getProxyInfo();
    container.innerHTML = `
      <div class="card" style="margin-bottom:18px;">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:10px;">
          <h3 style="font-size:16px;">方式一：微信官方服务端 API 代理（推荐 · 体验版免费互通）</h3>
          <span class="badge ${proxy.configured ? 'badge-done' : 'badge-progress'}">${proxy.configured ? '已检测到 .env.local 密钥配置' : '待配置 WX_APP_SECRET'}</span>
        </div>
        <p style="font-size:13px;color:#7a6f64;margin-bottom:12px;">
          无需升级付费环境或开通公网 HTTP 访问服务。本机 <code>pc-web/server.js</code> 会通过微信官方 <code>tcb/invokecloudfunction</code> 接口直连你已部署的云函数 <code>${escapeHtml(proxy.functionName || 'consultApi')}</code>。
        </p>
        <div class="pipe-grid" style="margin-bottom:12px;">
          <div class="pipe-box"><span class="pipe-box-lbl">小程序 AppID</span>${escapeHtml(proxy.appId || 'wx3aa3136395317b1f')}</div>
          <div class="pipe-box"><span class="pipe-box-lbl">云开发环境 ID</span>${escapeHtml(proxy.cloudEnv || 'cloud1-d7gf2c2g59cc2a156')}</div>
          <div class="pipe-box"><span class="pipe-box-lbl">代理接口路径</span><code>${escapeHtml(proxy.endpoint || '/api/cloud')}</code></div>
        </div>
        <div style="font-size:12px;color:#4a4038;margin-bottom:12px;">
          配置方法：打开 <code>pc-web/.env.local</code>，把 <code>WX_APP_SECRET</code> 改成微信小程序后台（mp.weixin.qq.com -> 开发管理 -> 开发设置）中的 AppSecret，然后重启 <code>node pc-web/server.js</code>。
        </div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
          <button class="btn btn-primary" id="btnTestProxyHealth">一键测试官方代理连通性 (/api/cloud)</button>
          <span id="proxyHealthResult" style="font-size:13px;"></span>
        </div>
      </div>

      <div class="two-col-grid">
        <div class="card">
          <h3 style="font-size:16px;margin-bottom:10px;">方式二：CloudBase 公网 HTTP 访问地址（可选）</h3>
          <p style="font-size:13px;color:#7a6f64;margin-bottom:14px;">
            如果你已在腾讯云 CloudBase 控制台开通公网 HTTP 访问服务，可在此填入完整 HTTPS 地址（优先级高于本地代理）。
          </p>
          <div class="form-group">
            <label class="form-label">consultApi 云函数 HTTP 触发地址</label>
            <input id="settingsCloudUrl" class="form-control" placeholder="例如：https://cloud1-xxxx.service.tcloudbase.com/consultApi" value="${escapeHtml(url)}" />
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <button class="btn btn-primary" id="btnSaveAndTestCloud">测试连通性并启用自定义 HTTP</button>
            <button class="btn btn-outline" id="btnSwitchDemoMode">清除自定义地址</button>
          </div>
          <div id="cloudHealthResult" style="margin-top:14px;font-size:13px;"></div>
        </div>

        <div class="card">
          <h3 style="font-size:16px;margin-bottom:10px;">云开发实时同步排查清单</h3>
          <ol style="padding-left:18px;font-size:13px;color:#4a4038;line-height:1.85;">
            <li>确认云函数 <code>consultApi</code> 已在微信开发者工具上传并部署成功。</li>
            <li>核对云开发控制台「设置 -> 环境 ID」与 <code>pc-web/.env.local</code> 中的 <code>WX_CLOUD_ENV</code> 一致。</li>
            <li>若测试提示 <code>40164 IP不在白名单</code>，请登录 mp.weixin.qq.com 在「开发设置 -> IP白名单」中添加本机公网 IP。</li>
          </ol>
          <div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--border);">
            <button class="btn btn-outline btn-sm" id="btnResetDemoData">重置本地演示数据为初始状态</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btnTestProxyHealth').addEventListener('click', async () => {
      const box = document.getElementById('proxyHealthResult');
      box.innerHTML = '<span style="color:#8d6238;">正在向微信服务器发起云函数测试...</span>';
      await API.detectLocalProxy();
      const check = await API.testCloudHealth('/api/cloud');
      if (check.ok) {
        box.innerHTML = `<span class="badge badge-done">✅ ${escapeHtml(check.msg)}（退出重登即可拉取手机端数据）</span>`;
        syncModeBadges();
      } else {
        box.innerHTML = `<span class="badge badge-red">❌ ${escapeHtml(check.msg)}</span>`;
      }
    });

    document.getElementById('btnSaveAndTestCloud').addEventListener('click', async () => {
      const nextUrl = document.getElementById('settingsCloudUrl').value.trim();
      const box = document.getElementById('cloudHealthResult');
      box.innerHTML = '<span style="color:#8d6238;">正在检测云端连通性...</span>';
      const check = await API.testCloudHealth(nextUrl);
      if (check.ok) {
        API.setCloudUrl(nextUrl);
        box.innerHTML = `<span class="badge badge-done">✅ ${escapeHtml(check.msg)}（请重新用云端账号登录刷新凭证）</span>`;
        syncModeBadges();
      } else {
        box.innerHTML = `<span class="badge badge-red">❌ ${escapeHtml(check.msg)}</span>`;
      }
    });

    document.getElementById('btnSwitchDemoMode').addEventListener('click', () => {
      API.setCloudUrl('');
      API.logout();
      enterLoginScreen();
      showToast('已清除自定义 HTTP 地址，请重新登录');
    });

    document.getElementById('btnResetDemoData').addEventListener('click', () => {
      API.resetDemoState();
      refreshDashboard(true);
      showToast('本地演示数据已恢复初始状态');
    });
  }

  // ==================== 弹窗管理 ====================
  function openModal(title, bodyHtml, footerHtml) {
    const mask = document.getElementById('modalContainer');
    mask.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-header">
          <div class="modal-title">${escapeHtml(title)}</div>
          <button type="button" class="modal-close" id="btnCloseModal">×</button>
        </div>
        <div id="modalBodySlot">${bodyHtml}</div>
        <div class="modal-footer">${footerHtml}</div>
      </div>
    `;
    mask.classList.remove('hidden');
    document.getElementById('btnCloseModal').addEventListener('click', closeModal);
    mask.onclick = e => { if (e.target === mask) closeModal(); };
  }

  function closeModal() {
    document.getElementById('modalContainer').classList.add('hidden');
  }

  function openNewStudentModal() {
    openModal(
      '新建陪跑学员档案（同步小程序账号）',
      `
        <div class="two-col-grid">
          <div class="form-group"><label class="form-label">学员姓名 / 创始人称呼 *</label><input id="nsName" class="form-control" placeholder="如：王总" /></div>
          <div class="form-group"><label class="form-label">绑定登录手机号 *</label><input id="nsPhone" class="form-control" placeholder="11位手机号" /></div>
          <div class="form-group"><label class="form-label">所属行业赛道 *</label><input id="nsIndustry" class="form-control" placeholder="如：医疗美容 / 知识IP" /></div>
          <div class="form-group"><label class="form-label">小程序登录密码（留空默认后6位）</label><input id="nsPass" class="form-control" placeholder="可选，6位数字" /></div>
        </div>
        <div class="two-col-grid">
          <div class="form-group"><label class="form-label">签约方案</label><input id="nsType" class="form-control" value="IP实战陪跑营 · 年度顾问全案" /></div>
          <div class="form-group"><label class="form-label">初始客单价基准</label><input id="nsTicket" class="form-control" placeholder="如：¥1,800" /></div>
        </div>
        <div class="form-group"><label class="form-label">核心商业痛点与入营目标</label><textarea id="nsProblem" class="form-control" placeholder="简述该学员的核心卡点与预期成果..."></textarea></div>
      `,
      `<button class="btn btn-outline" id="mCancel">取消</button><button class="btn btn-primary" id="mConfirmNewStudent">确认建档并生成密码</button>`
    );
    document.getElementById('mCancel').addEventListener('click', closeModal);
    document.getElementById('mConfirmNewStudent').addEventListener('click', async () => {
      try {
        const res = await API.createProject({
          name: document.getElementById('nsName').value,
          phone: document.getElementById('nsPhone').value,
          industry: document.getElementById('nsIndustry').value,
          clientPassword: document.getElementById('nsPass').value,
          type: document.getElementById('nsType').value,
          ticketBefore: document.getElementById('nsTicket').value,
          problem: document.getElementById('nsProblem').value
        });
        closeModal();
        state.selectedProjectId = res.project.id;
        state.view = 'cockpit';
        await refreshDashboard(true);
        showToast(`建档成功！初始密码：${res.assignedPassword}`);
      } catch (err) {
        showToast(err.message);
      }
    });
  }

  function openRatingReviewModal(proj, taskId) {
    const task = WF.getAllCockpitTasks().find(t => t.id === taskId);
    const rec = (proj.cockpitProgress && proj.cockpitProgress[taskId]) || {};
    const rating = { professional: 5, attitude: 5, response: 5, result: 5, ...(rec.rating || {}) };
    const defaultReview = rec.reviewText || WF.renderScript(WF.REVIEW_TEMPLATE, proj);

    openModal(
      `四维度服务打星与标准化复盘 · ${(task && task.title) || ''}`,
      `
        <div style="margin-bottom:14px;">
          ${WF.RATING_DIMENSIONS.map(dim => `
            <div class="star-row" data-dim="${dim.key}">
              <span style="width:90px;font-weight:600;font-size:13px;">${dim.label}</span>
              <div>
                ${[1, 2, 3, 4, 5].map(n => `<button type="button" class="star-btn ${rating[dim.key] >= n ? 'on' : ''}" data-dim="${dim.key}" data-val="${n}">★</button>`).join('')}
              </div>
              <span class="js-dim-score" data-dim="${dim.key}" style="font-size:13px;color:#8d6238;font-weight:700;">${rating[dim.key]} 星</span>
            </div>
          `).join('')}
        </div>
        <div class="form-group">
          <label class="form-label">💡 标准化复盘内容（对照《IP实战陪跑营》复盘模版）</label>
          <textarea id="revText" class="form-control" style="min-height:170px;">${escapeHtml(defaultReview)}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">复盘截图 / 附件文件说明</label>
          <input id="revAtt" class="form-control" placeholder="如：复盘截图_01.png" value="${escapeHtml(rec.attachment || '')}" />
        </div>
      `,
      `<button class="btn btn-outline" id="mCancel">取消</button><button class="btn btn-primary" id="mSaveReview">保存评价与复盘并标为完成</button>`
    );

    const modal = document.getElementById('modalContainer');
    modal.querySelectorAll('.star-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const dim = btn.dataset.dim;
        const val = Number(btn.dataset.val);
        rating[dim] = val;
        modal.querySelectorAll(`.star-btn[data-dim="${dim}"]`).forEach(sb => {
          sb.classList.toggle('on', Number(sb.dataset.val) <= val);
        });
        const label = modal.querySelector(`.js-dim-score[data-dim="${dim}"]`);
        if (label) label.textContent = `${val} 星`;
      });
    });

    document.getElementById('mCancel').addEventListener('click', closeModal);
    document.getElementById('mSaveReview').addEventListener('click', async () => {
      const nextProgress = { ...(proj.cockpitProgress || {}) };
      nextProgress[taskId] = {
        ...(nextProgress[taskId] || {}),
        status: 'done',
        rating,
        reviewText: document.getElementById('revText').value.trim(),
        attachment: document.getElementById('revAtt').value.trim(),
        updatedAt: new Date().toISOString().slice(0, 10)
      };
      const res = await API.updateProject(proj.id, { cockpitProgress: nextProgress });
      if (res.ok) {
        closeModal();
        replaceProjectInState(res.project);
        renderCockpitView(document.getElementById('mainAppContent'));
        showToast('四维度评价与复盘记录已保存');
      }
    });
  }

  function openSessionModal(proj, existingSes) {
    const isEdit = !!existingSes;
    const actionsStr = isEdit ? (existingSes.actionItems || []).map(a => a.text).join('\n') : '';
    openModal(
      isEdit ? `编辑第 ${existingSes.sessionNo} 次 1V1 咨询纪要` : `新增第 ${(proj.sessions || []).length + 1} 次 1V1 咨询纪要`,
      `
        <div class="form-group"><label class="form-label">本次咨询主题 *</label><input id="sesTitle" class="form-control" value="${escapeHtml(isEdit ? existingSes.title : '')}" placeholder="如：高价值定位敲定与尖刀产品设计" /></div>
        <div class="two-col-grid">
          <div class="form-group"><label class="form-label">咨询日期时段</label><input id="sesDate" class="form-control" value="${escapeHtml(isEdit ? existingSes.date : new Date().toISOString().slice(0, 10))}" /></div>
          <div class="form-group"><label class="form-label">会议形式 / 地点</label><input id="sesMode" class="form-control" value="${escapeHtml(isEdit ? existingSes.mode : '腾讯会议 1V1 闭门梳理')}" /></div>
        </div>
        <div class="form-group"><label class="form-label">参会人员</label><input id="sesPart" class="form-control" value="${escapeHtml(isEdit ? existingSes.participants : ('岩姐、' + proj.name))}" /></div>
        <div class="form-group"><label class="form-label">01 · 核心商业痛点诊断 *</label><textarea id="sesDiag" class="form-control">${escapeHtml(isEdit ? existingSes.diagnosis : '')}</textarea></div>
        <div class="form-group"><label class="form-label">02 · 岩值咨询破局重构解法 *</label><textarea id="sesSol" class="form-control">${escapeHtml(isEdit ? existingSes.solution : '')}</textarea></div>
        <div class="form-group"><label class="form-label">03 · 课后落地行动清单（每行一条，同步学员小程序打卡）</label><textarea id="sesActions" class="form-control" placeholder="每行一条行动任务">${escapeHtml(actionsStr)}</textarea></div>
        <div class="form-group"><label class="form-label">04 · 顾问复盘批注</label><input id="sesNote" class="form-control" value="${escapeHtml(isEdit ? existingSes.consultantNote : '')}" /></div>
      `,
      `<button class="btn btn-outline" id="mCancel">取消</button><button class="btn btn-primary" id="mSaveSession">${isEdit ? '保存修改并同步小程序' : '发布并同步至学员小程序'}</button>`
    );

    document.getElementById('mCancel').addEventListener('click', closeModal);
    document.getElementById('mSaveSession').addEventListener('click', async () => {
      const payload = {
        title: document.getElementById('sesTitle').value,
        date: document.getElementById('sesDate').value,
        mode: document.getElementById('sesMode').value,
        participants: document.getElementById('sesPart').value,
        diagnosis: document.getElementById('sesDiag').value,
        solution: document.getElementById('sesSol').value,
        actionsText: document.getElementById('sesActions').value,
        consultantNote: document.getElementById('sesNote').value
      };
      try {
        const res = isEdit
          ? await API.updateSession(proj.id, existingSes.sessionId, payload)
          : await API.addSession(proj.id, payload);
        closeModal();
        replaceProjectInState(res.project);
        renderCockpitView(document.getElementById('mainAppContent'));
        showToast(isEdit ? '咨询纪要已更新' : '咨询纪要已发布并同步小程序');
      } catch (err) {
        showToast(err.message);
      }
    });
  }

  function openReplySessionModal(proj, ses) {
    openModal(
      `回复第 ${ses.sessionNo} 次咨询学员评价`,
      `
        <div class="pipe-box" style="margin-bottom:12px;"><span class="pipe-box-lbl">学员评价原话</span>“${escapeHtml(ses.clientFeedback)}”</div>
        <div class="form-group"><label class="form-label">导师回复内容 *</label><textarea id="replyInput" class="form-control" placeholder="输入导师回复，将同步显示在学员小程序中..."></textarea></div>
      `,
      `<button class="btn btn-outline" id="mCancel">取消</button><button class="btn btn-primary" id="mSendReply">发送回复</button>`
    );
    document.getElementById('mCancel').addEventListener('click', closeModal);
    document.getElementById('mSendReply').addEventListener('click', async () => {
      try {
        const res = await API.replySession(proj.id, ses.sessionId, document.getElementById('replyInput').value);
        closeModal();
        replaceProjectInState(res.project);
        renderCockpitView(document.getElementById('mainAppContent'));
        showToast('回复已发送并同步至学员端');
      } catch (err) {
        showToast(err.message);
      }
    });
  }

  function openDeliverableModal(proj) {
    openModal(
      '发布阶段交付方案文档',
      `
        <div class="form-group"><label class="form-label">交付文档标题 *</label><input id="dlTitle" class="form-control" placeholder="如：《爆品设计定价阶梯与发售剧本全案》" /></div>
        <div class="two-col-grid">
          <div class="form-group">
            <label class="form-label">所属闭环阶段</label>
            <select id="dlStage" class="form-control">
              ${WF.DELIVERY_STEPS.map(s => `<option value="${s.code} ${s.title}" ${Number(proj.currentStep) === s.step ? 'selected' : ''}>${s.code} ${s.title}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label class="form-label">文档类型标注</label><input id="dlType" class="form-control" value="PDF / 全案交付文档" /></div>
        </div>
        <div class="two-col-grid">
          <div class="form-group"><label class="form-label">附件名称（选填）</label><input id="dlFileName" class="form-control" placeholder="如：爆品全案终稿.pdf" /></div>
          <div class="form-group"><label class="form-label">云存储或网盘预览链接（选填）</label><input id="dlFileUrl" class="form-control" placeholder="https://..." /></div>
        </div>
        <div class="form-group"><label class="form-label">核心内容与执行要点摘要 *</label><textarea id="dlSummary" class="form-control" placeholder="描述该交付文档的核心亮点与团队执行标准..."></textarea></div>
      `,
      `<button class="btn btn-outline" id="mCancel">取消</button><button class="btn btn-primary" id="mPublishDeliv">发布并同步学员空间</button>`
    );
    document.getElementById('mCancel').addEventListener('click', closeModal);
    document.getElementById('mPublishDeliv').addEventListener('click', async () => {
      try {
        const res = await API.addDeliverable(proj.id, {
          title: document.getElementById('dlTitle').value,
          stage: document.getElementById('dlStage').value,
          fileType: document.getElementById('dlType').value,
          fileName: document.getElementById('dlFileName').value,
          fileUrl: document.getElementById('dlFileUrl').value,
          summary: document.getElementById('dlSummary').value
        });
        closeModal();
        replaceProjectInState(res.project);
        renderCockpitView(document.getElementById('mainAppContent'));
        showToast('交付文档已发布');
      } catch (err) {
        showToast(err.message);
      }
    });
  }

  function openMetricsModal(proj) {
    const m = proj.metrics || {};
    openModal(
      '更新商业增长战果对比指标',
      `
        <div class="two-col-grid">
          <div class="form-group"><label class="form-label">服务前客单价</label><input id="mkTB" class="form-control" value="${escapeHtml(m.ticketBefore || '')}" /></div>
          <div class="form-group"><label class="form-label">服务后客单价</label><input id="mkTA" class="form-control" value="${escapeHtml(m.ticketAfter || '')}" /></div>
          <div class="form-group"><label class="form-label">服务前毛利率</label><input id="mkMB" class="form-control" value="${escapeHtml(m.marginBefore || '')}" /></div>
          <div class="form-group"><label class="form-label">服务后毛利率</label><input id="mkMA" class="form-control" value="${escapeHtml(m.marginAfter || '')}" /></div>
          <div class="form-group"><label class="form-label">服务前月营收</label><input id="mkRB" class="form-control" value="${escapeHtml(m.revenueBefore || '')}" /></div>
          <div class="form-group"><label class="form-label">服务后营收</label><input id="mkRA" class="form-control" value="${escapeHtml(m.revenueAfter || '')}" /></div>
          <div class="form-group"><label class="form-label">服务前转化率</label><input id="mkCB" class="form-control" value="${escapeHtml(m.conversionBefore || '')}" /></div>
          <div class="form-group"><label class="form-label">服务后转化率</label><input id="mkCA" class="form-control" value="${escapeHtml(m.conversionAfter || '')}" /></div>
        </div>
        <div class="form-group"><label class="form-label">阶段实战战果复盘总结</label><textarea id="mkSum" class="form-control">${escapeHtml(m.highlightSummary || '')}</textarea></div>
      `,
      `<button class="btn btn-outline" id="mCancel">取消</button><button class="btn btn-primary" id="mSaveMetrics">保存战果指标</button>`
    );
    document.getElementById('mCancel').addEventListener('click', closeModal);
    document.getElementById('mSaveMetrics').addEventListener('click', async () => {
      const res = await API.updateProject(proj.id, {
        metrics: {
          ticketBefore: document.getElementById('mkTB').value.trim(),
          ticketAfter: document.getElementById('mkTA').value.trim(),
          marginBefore: document.getElementById('mkMB').value.trim(),
          marginAfter: document.getElementById('mkMA').value.trim(),
          revenueBefore: document.getElementById('mkRB').value.trim(),
          revenueAfter: document.getElementById('mkRA').value.trim(),
          conversionBefore: document.getElementById('mkCB').value.trim(),
          conversionAfter: document.getElementById('mkCA').value.trim(),
          highlightSummary: document.getElementById('mkSum').value.trim()
        }
      });
      if (res.ok) {
        closeModal();
        replaceProjectInState(res.project);
        renderCockpitView(document.getElementById('mainAppContent'));
        showToast('战果数据已更新');
      }
    });
  }

  function openAddAdminModal() {
    openModal(
      '新增顾问 / 交付助教账号',
      `
        <div class="two-col-grid">
          <div class="form-group"><label class="form-label">登录账号 *</label><input id="aaUser" class="form-control" placeholder="仅限字母数字下划线" /></div>
          <div class="form-group"><label class="form-label">顾问姓名 *</label><input id="aaName" class="form-control" placeholder="如：张助教" /></div>
          <div class="form-group"><label class="form-label">岗位头衔</label><input id="aaTitle" class="form-control" value="资深交付助教" /></div>
          <div class="form-group"><label class="form-label">初始密码 *</label><input id="aaPass" class="form-control" value="666666" /></div>
        </div>
        <div class="form-group">
          <label class="form-label">权限角色</label>
          <select id="aaRole" class="form-control">
            <option value="staff">助教 / 顾问（交付后台）</option>
            <option value="super">主管理员（含账号管理权）</option>
          </select>
        </div>
      `,
      `<button class="btn btn-outline" id="mCancel">取消</button><button class="btn btn-primary" id="mAddAdmin">确认创建账号</button>`
    );
    document.getElementById('mCancel').addEventListener('click', closeModal);
    document.getElementById('mAddAdmin').addEventListener('click', async () => {
      try {
        await API.manageAccounts('addAdmin', {
          username: document.getElementById('aaUser').value,
          name: document.getElementById('aaName').value,
          title: document.getElementById('aaTitle').value,
          password: document.getElementById('aaPass').value,
          roleType: document.getElementById('aaRole').value
        });
        closeModal();
        await refreshDashboard(true);
        showToast('顾问/助教账号创建成功');
      } catch (err) {
        showToast(err.message);
      }
    });
  }

  function openResetClientPassModal(phone, name) {
    openModal(
      `重置学员登录密码 · ${name}`,
      `
        <div class="form-group"><label class="form-label">登录手机号</label><input class="form-control" value="${escapeHtml(phone)}" disabled /></div>
        <div class="form-group"><label class="form-label">新密码（留空则自动生成6位随机数字）</label><input id="rcNewPass" class="form-control" placeholder="输入4位以上新密码或留空随机生成" /></div>
      `,
      `<button class="btn btn-outline" id="mCancel">取消</button><button class="btn btn-primary" id="mResetPass">确认重置</button>`
    );
    document.getElementById('mCancel').addEventListener('click', closeModal);
    document.getElementById('mResetPass').addEventListener('click', async () => {
      try {
        const res = await API.manageAccounts('resetClientPassword', {
          phone,
          newPassword: document.getElementById('rcNewPass').value
        });
        closeModal();
        await refreshDashboard(true);
        showToast(`已重置密码为：${res.password}`);
      } catch (err) {
        showToast(err.message);
      }
    });
  }

  function printStudentReport(proj, stats) {
    const m = proj.metrics || {};
    const area = document.getElementById('printReportArea');
    area.innerHTML = `
      <div style="border-bottom:2px solid #8d6238;padding-bottom:12px;margin-bottom:18px;">
        <h1 style="font-size:22px;color:#181411;">岩值商业咨询 · IP实战陪跑营阶段交付报告</h1>
        <p style="font-size:13px;color:#666;margin-top:4px;">学员：${escapeHtml(proj.name)} ｜ 赛道：${escapeHtml(proj.industry)} ｜ 方案：${escapeHtml(proj.type)} ｜ 生成日期：${new Date().toISOString().slice(0, 10)}</p>
      </div>
      <h2 style="font-size:16px;margin-bottom:8px;">一、总体陪跑进度概览</h2>
      <p style="font-size:13px;margin-bottom:14px;">当前阶段：<strong>${escapeHtml(proj.stepName)}</strong> ｜ 运营录取把关线完成：${stats.pipeDone}/${stats.pipeTotal} ｜ 12板块驾驶舱完成：${stats.taskDone}/${stats.taskTotal} (${stats.taskPercent}%)</p>
      <h2 style="font-size:16px;margin-bottom:8px;">二、商业战果前后对比</h2>
      <p style="font-size:13px;margin-bottom:6px;">客单价：${escapeHtml(m.ticketBefore || '-')} → ${escapeHtml(m.ticketAfter || '-')} ｜ 毛利率：${escapeHtml(m.marginBefore || '-')} → ${escapeHtml(m.marginAfter || '-')} ｜ 营收：${escapeHtml(m.revenueBefore || '-')} → ${escapeHtml(m.revenueAfter || '-')}</p>
      <p style="font-size:13px;margin-bottom:14px;">战果总结：${escapeHtml(m.highlightSummary || '-')}</p>
      <h2 style="font-size:16px;margin-bottom:8px;">三、核心 1V1 咨询过程纪要</h2>
      ${(proj.sessions || []).map(s => `
        <div style="border:1px solid #ddd;padding:10px;border-radius:6px;margin-bottom:10px;font-size:12px;">
          <div><strong>第 ${s.sessionNo} 次：${escapeHtml(s.title)}</strong>（${escapeHtml(s.date)}）</div>
          <div>痛点诊断：${escapeHtml(s.diagnosis)}</div>
          <div>破局解法：${escapeHtml(s.solution)}</div>
        </div>
      `).join('')}
    `;
    window.print();
  }

  // ==================== 启动与全局事件绑定 ====================
  function bindEvents() {
    document.getElementById('btnFillYanjie').addEventListener('click', () => {
      document.getElementById('loginUsername').value = 'yanjie';
      document.getElementById('loginPassword').value = '888888';
    });
    document.getElementById('btnFillAssistant').addEventListener('click', () => {
      document.getElementById('loginUsername').value = 'assistant';
      document.getElementById('loginPassword').value = '666666';
    });

    document.getElementById('btnLoginSaveCloud').addEventListener('click', async () => {
      const url = document.getElementById('loginCloudUrl').value.trim();
      if (!url) {
        API.setCloudUrl('');
        syncModeBadges();
        showToast('已切回本地演示模式');
        return;
      }
      const check = await API.testCloudHealth(url);
      if (check.ok) {
        API.setCloudUrl(url);
        syncModeBadges();
        showToast(check.msg);
      } else {
        showToast(check.msg);
      }
    });

    document.getElementById('btnLoginSubmit').addEventListener('click', async () => {
      const u = document.getElementById('loginUsername').value;
      const p = document.getElementById('loginPassword').value;
      const res = await API.login(u, p);
      if (!res.ok) {
        showToast(res.msg);
        return;
      }
      enterMainApp();
    });

    document.querySelectorAll('#sidebarNav .nav-item').forEach(el => {
      el.addEventListener('click', () => {
        state.view = el.dataset.view;
        renderShell();
      });
    });

    document.getElementById('btnRefreshData').addEventListener('click', () => refreshDashboard(false));
    document.getElementById('btnOpenNewStudent').addEventListener('click', openNewStudentModal);
    document.getElementById('btnLogout').addEventListener('click', () => {
      API.logout();
      enterLoginScreen();
    });
  }

  async function init() {
    bindEvents();
    await API.detectLocalProxy();
    const sess = API.getSession();
    if (sess && sess.token && sess.user && sess.mode === API.getMode()) {
      enterMainApp();
    } else {
      enterLoginScreen();
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
