/**
 * Corujinha Banho & Tosa - Admin Dashboard Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  let activeDateFilter = 'hoje';
  let activeStatusFilter = 'todos';

  const pad = (n) => String(n).padStart(2, '0');
  const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const todayISO = toISO(new Date());

  const tomorrowObj = new Date();
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowISO = toISO(tomorrowObj);

  // Calcula início e fim da semana atual
  const curr = new Date();
  const firstDay = new Date(curr.setDate(curr.getDate() - curr.getDay()));
  const lastDay = new Date(curr.setDate(curr.getDate() - curr.getDay() + 6));
  const weekStartISO = toISO(firstDay);
  const weekEndISO = toISO(lastDay);

  // Elementos do DOM
  const kpiTotalToday = document.getElementById('kpiTotalToday');
  const kpiPendingToday = document.getElementById('kpiPendingToday');
  const kpiDoneToday = document.getElementById('kpiDoneToday');
  const kpiTotalAll = document.getElementById('kpiTotalAll');

  const appointmentsGrid = document.getElementById('appointmentsGridContainer');
  const appointmentsViewTitle = document.getElementById('appointmentsViewTitle');
  const appointmentsViewCount = document.getElementById('appointmentsViewCount');
  const blockedTagsContainer = document.getElementById('blockedTagsContainer');

  const statusFilterSelect = document.getElementById('statusFilterSelect');
  const dateTabs = document.querySelectorAll('#dateFilterTabs .tab-btn');

  // Modal de Bloqueio
  const blockModalBackdrop = document.getElementById('blockModalBackdrop');
  const btnOpenBlockModal = document.getElementById('btnOpenBlockModal');
  const btnCloseBlockModal = document.getElementById('btnCloseBlockModal');
  const btnCancelBlockModal = document.getElementById('btnCancelBlockModal');
  const btnConfirmBlockSlot = document.getElementById('btnConfirmBlockSlot');
  const blockDateInput = document.getElementById('blockDateInput');
  const blockTimeSelect = document.getElementById('blockTimeSelect');
  const blockReasonInput = document.getElementById('blockReasonInput');

  blockDateInput.value = todayISO;

  // Atualiza KPIs
  function updateKPIs() {
    const all = BookingStore.getAll();
    const todayList = all.filter(a => a.date === todayISO);

    const pendingToday = todayList.filter(a => a.status === 'confirmado').length;
    const doneToday = todayList.filter(a => a.status === 'concluido').length;

    kpiTotalToday.textContent = todayList.length;
    kpiPendingToday.textContent = pendingToday;
    kpiDoneToday.textContent = doneToday;
    kpiTotalAll.textContent = all.length;
  }

  // Formata data ISO para legível (ex: "11/11/2026")
  function formatBRDate(iso) {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  // Renderiza Lista de Agendamentos
  function renderAppointments() {
    const all = BookingStore.getAll();

    // Filtro por Data
    let filtered = all.filter(item => {
      if (activeDateFilter === 'hoje') return item.date === todayISO;
      if (activeDateFilter === 'amanha') return item.date === tomorrowISO;
      if (activeDateFilter === 'semana') return item.date >= weekStartISO && item.date <= weekEndISO;
      return true; // 'todos'
    });

    // Filtro por Status
    if (activeStatusFilter !== 'todos') {
      filtered = filtered.filter(item => item.status === activeStatusFilter);
    }

    // Ordena por horário crescente
    filtered.sort((a, b) => {
      if (a.date === b.date) {
        return a.time.localeCompare(b.time);
      }
      return a.date.localeCompare(b.date);
    });

    // Atualiza cabeçalho
    const titles = {
      hoje: 'Agendamentos de Hoje',
      amanha: 'Agendamentos de Amanhã',
      semana: 'Agendamentos Desta Semana',
      todos: 'Todos os Agendamentos'
    };
    appointmentsViewTitle.textContent = titles[activeDateFilter];
    appointmentsViewCount.textContent = `${filtered.length} agendamento(s)`;

    appointmentsGrid.innerHTML = '';

    if (filtered.length === 0) {
      appointmentsGrid.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></svg>
          <h4>Nenhum agendamento encontrado</h4>
          <p>Nenhum atendimento corresponde aos filtros selecionados.</p>
        </div>
      `;
      return;
    }

    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = `appointment-card is-${item.status}`;

      const statusLabels = {
        confirmado: 'Aguardando Atendimento',
        concluido: 'Concluído',
        cancelado: 'Cancelado'
      };

      // Limpa número de WhatsApp para link
      const cleanPhone = (item.clientPhone || '').replace(/\D/g, '');
      const waPhone = cleanPhone.length === 11 ? `55${cleanPhone}` : cleanPhone;
      const readyMsg = encodeURIComponent(
        `Olá ${item.clientName}! 🐾\nO(a) ${item.petName} já finalizou o atendimento na Corujinha Banho & Tosa e está cheiroso(a) e prontinho(a) para ser buscado(a)! 🐶✨`
      );

      card.innerHTML = `
        <div class="card-top">
          <div class="card-time">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>${item.time} &bull; ${formatBRDate(item.date)}</span>
          </div>
          <span class="card-status-pill status-${item.status}">
            ${statusLabels[item.status] || item.status}
          </span>
        </div>

        <div class="card-body">
          <div class="card-pet">
            <span class="card-pet__name">${item.petName}</span>
            <span class="card-pet__size">${item.petSize.split(' ')[0]}</span>
          </div>
          <span class="card-pet__breed">${item.petBreed}</span>

          <div class="card-service">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span>${item.service}</span>
          </div>

          <div class="card-client">
            Tutor: <strong>${item.clientName}</strong> &bull; ${item.clientPhone}
          </div>

          ${item.notes ? `<div class="card-notes">Obs: &ldquo;${item.notes}&rdquo;</div>` : ''}
        </div>

        <div class="card-actions">
          <a href="https://wa.me/${waPhone}?text=${readyMsg}" target="_blank" rel="noopener noreferrer" class="btn-card-wa" title="Avisar que o pet está pronto">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            <span>Pet Pronto!</span>
          </a>

          <div class="card-action-btns">
            ${item.status !== 'concluido' ? `
              <button type="button" class="btn-icon-action btn-icon-action--done" title="Marcar como Concluído" data-action="concluir" data-id="${item.id}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              </button>
            ` : ''}

            ${item.status !== 'cancelado' ? `
              <button type="button" class="btn-icon-action btn-icon-action--cancel" title="Cancelar Agendamento" data-action="cancelar" data-id="${item.id}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            ` : ''}
          </div>
        </div>
      `;

      appointmentsGrid.appendChild(card);
    });

    // Eventos de Ação nos Cards
    appointmentsGrid.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id');

        if (action === 'concluir') {
          BookingStore.updateStatus(id, 'concluido');
        } else if (action === 'cancelar') {
          if (confirm('Deseja realmente cancelar este agendamento? O horário será liberado na agenda.')) {
            BookingStore.updateStatus(id, 'cancelado');
          }
        }
        renderAll();
      });
    });
  }

  // Renderiza Horários Bloqueados
  function renderBlockedSlots() {
    const blocked = BookingStore.getBlockedSlots();
    blockedTagsContainer.innerHTML = '';

    if (blocked.length === 0) {
      blockedTagsContainer.innerHTML = '<span style="font-size: 0.85rem; color: #94a3b8;">Nenhum horário bloqueado no momento. Todos os horários livres estão abertos para os clientes.</span>';
      return;
    }

    blocked.forEach(b => {
      const tag = document.createElement('div');
      tag.className = 'blocked-tag';
      tag.innerHTML = `
        <span><strong>${formatBRDate(b.date)} às ${b.time}</strong> &bull; ${b.reason}</span>
        <button type="button" class="btn-unblock" title="Desbloquear este horário" data-date="${b.date}" data-time="${b.time}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      `;

      tag.querySelector('.btn-unblock').addEventListener('click', () => {
        BookingStore.unblockSlot(b.date, b.time);
        renderAll();
      });

      blockedTagsContainer.appendChild(tag);
    });
  }

  function renderAll() {
    updateKPIs();
    renderAppointments();
    renderBlockedSlots();
  }

  // Eventos de Abas de Data
  dateTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      dateTabs.forEach(t => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      activeDateFilter = tab.getAttribute('data-date-filter');
      renderAppointments();
    });
  });

  // Evento de Filtro de Status
  statusFilterSelect.addEventListener('change', (e) => {
    activeStatusFilter = e.target.value;
    renderAppointments();
  });

  // Modal de Bloqueio Events
  function openBlockModal() {
    blockModalBackdrop.classList.add('is-open');
  }

  function closeBlockModal() {
    blockModalBackdrop.classList.remove('is-open');
    blockReasonInput.value = '';
  }

  btnOpenBlockModal.addEventListener('click', openBlockModal);
  btnCloseBlockModal.addEventListener('click', closeBlockModal);
  btnCancelBlockModal.addEventListener('click', closeBlockModal);

  btnConfirmBlockSlot.addEventListener('click', () => {
    const d = blockDateInput.value;
    const t = blockTimeSelect.value;
    const r = blockReasonInput.value.trim() || 'Bloqueio da equipe';

    if (!d || !t) return;

    BookingStore.blockSlot(d, t, r);
    closeBlockModal();
    renderAll();
  });

  // Escuta atualizações de outras abas ou agendamentos feitos no site
  window.addEventListener('corujinha_store_updated', renderAll);
  window.addEventListener('storage', renderAll);

  // Status da conexão com Supabase
  const dbSyncIndicator = document.getElementById('dbSyncIndicator');
  const dbSyncText = document.getElementById('dbSyncText');

  function updateDbBadge(connected, message) {
    if (!dbSyncIndicator || !dbSyncText) return;
    if (connected) {
      dbSyncIndicator.className = 'db-sync-indicator is-connected';
      dbSyncText.textContent = 'Supabase Conectado';
      dbSyncIndicator.title = message || 'Conexão ativa em tempo real com o banco de dados';
    } else {
      dbSyncIndicator.className = 'db-sync-indicator is-offline';
      dbSyncText.textContent = 'Modo Local';
      dbSyncIndicator.title = message || 'Offline ou tabelas pendentes no Supabase';
    }
  }

  window.addEventListener('corujinha_db_status', (e) => {
    updateDbBadge(e.detail.connected, e.detail.message);
  });

  if (BookingStore.isCloudConnected) {
    updateDbBadge(true, BookingStore.cloudStatusMessage);
  }

  // ========================================================================
  // SISTEMA DE NOTIFICAÇÕES (SOM, TOAST VISUAL E ALERTA NATIVO)
  // ========================================================================
  const btnNotifyToggle = document.getElementById('btnNotifyToggle');
  const btnNotifyText = document.getElementById('btnNotifyText');
  const toastContainer = document.getElementById('adminToastContainer');
  let audioContext = null;
  let notificationsEnabled = localStorage.getItem('corujinha_notifications_enabled') === 'true';

  // Inicializa estado visual do botão
  function updateNotifyButtonUI() {
    if (!btnNotifyToggle) return;
    if (notificationsEnabled) {
      btnNotifyToggle.classList.add('is-active');
      btnNotifyText.textContent = 'Alertas Ativos';
      btnNotifyToggle.title = 'Alertas sonoros e notificações ativados';
    } else {
      btnNotifyToggle.classList.remove('is-active');
      btnNotifyText.textContent = 'Ativar Alertas';
      btnNotifyToggle.title = 'Clique para ativar som e notificações';
    }
  }
  updateNotifyButtonUI();

  // Emite som de sino suave e profissional via Web Audio API (sem dependência de arquivos externos)
  function playNotificationChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContext) audioContext = new AudioCtx();
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      const now = audioContext.currentTime;

      // Nota 1: Mi alto (E5 - 659.25Hz)
      const osc1 = audioContext.createOscillator();
      const gain1 = audioContext.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(audioContext.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Nota 2: Si alto (B5 - 987.77Hz)
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(987.77, now + 0.12);
      gain2.gain.setValueAtTime(0.3, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.65);
    } catch (err) {
      console.warn('Erro ao reproduzir alerta sonoro:', err);
    }
  }

  // Ativa / Desativa notificações ao clicar
  if (btnNotifyToggle) {
    btnNotifyToggle.addEventListener('click', async () => {
      // Cria/desbloqueia o contexto de áudio pelo clique do usuário
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx && !audioContext) audioContext = new AudioCtx();
      if (audioContext && audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      if (!notificationsEnabled) {
        notificationsEnabled = true;
        localStorage.setItem('corujinha_notifications_enabled', 'true');
        updateNotifyButtonUI();
        playNotificationChime();

        // Solicita permissão do navegador para notificações na barra do Windows/Android
        if ('Notification' in window && Notification.permission !== 'granted') {
          try {
            await Notification.requestPermission();
          } catch (e) {
            console.log('Permissão de notificação:', e);
          }
        }

        showToast({
          petName: 'Alertas Ativados!',
          service: 'Você receberá avisos sonoros e pop-ups quando clientes agendarem.',
          date: todayISO,
          time: 'Agora',
          clientName: 'Sistema Corujinha'
        });
      } else {
        notificationsEnabled = false;
        localStorage.setItem('corujinha_notifications_enabled', 'false');
        updateNotifyButtonUI();
      }
    });
  }

  // Notificação Pop-up Toast na tela do painel
  function showToast(app) {
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = 'admin-toast';
    toast.innerHTML = `
      <div class="admin-toast__header">
        <div class="admin-toast__title-wrap">
          <div class="admin-toast__badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          </div>
          <span class="admin-toast__title">Novo Agendamento!</span>
        </div>
        <button type="button" class="admin-toast__close" aria-label="Fechar notificação">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      <div class="admin-toast__body">
        <div class="admin-toast__pet-name">🐾 ${escapeHtml(app.petName || 'Pet')}</div>
        <div class="admin-toast__details">
          <strong>${escapeHtml(app.service || 'Serviço')}</strong><br>
          Cliente: ${escapeHtml(app.clientName || 'Cliente')}
        </div>
        <div class="admin-toast__footer">
          <span class="admin-toast__time">📅 ${app.date} às ${app.time}</span>
          <button type="button" class="admin-toast__action" id="btnToastView">Ver no painel</button>
        </div>
      </div>
    `;

    // Fechar botão
    const closeBtn = toast.querySelector('.admin-toast__close');
    const dismiss = () => {
      toast.classList.add('is-leaving');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    };
    closeBtn.addEventListener('click', dismiss);

    // Botão "Ver no painel"
    const viewBtn = toast.querySelector('#btnToastView');
    if (viewBtn) {
      viewBtn.addEventListener('click', () => {
        // Se a data for hoje, seleciona aba hoje, senão semana ou todos
        if (app.date === todayISO) {
          activeDateFilter = 'hoje';
        } else if (app.date === tomorrowISO) {
          activeDateFilter = 'amanha';
        } else {
          activeDateFilter = 'todos';
        }
        dateTabs.forEach(t => {
          t.classList.toggle('is-active', t.getAttribute('data-date-filter') === activeDateFilter);
        });
        renderAll();
        dismiss();
      });
    }

    // Auto dismiss após 8 segundos
    setTimeout(dismiss, 8000);

    toastContainer.appendChild(toast);
  }

  // Notificação Nativa do Sistema Operacional (Windows / Android)
  function showNativeNotification(app) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const n = new Notification(`🐾 Novo Agendamento: ${app.petName || 'Pet'}`, {
          body: `${app.service} • ${app.date} às ${app.time}\nCliente: ${app.clientName}`,
          icon: 'assets/logo.png',
          badge: 'assets/logo.png',
          tag: 'corujinha-booking-' + (app.id || Date.now())
        });
        n.onclick = () => {
          window.focus();
        };
      } catch (err) {
        console.warn('Erro ao disparar notificação nativa:', err);
      }
    }
  }

  // Altera o título da aba do navegador para chamar a atenção
  let originalTitle = document.title;
  let titleBlinkInterval = null;
  function triggerTabTitleAlert(petName) {
    if (titleBlinkInterval) clearInterval(titleBlinkInterval);
    let state = false;
    titleBlinkInterval = setInterval(() => {
      document.title = state ? `🔔 (1) Novo Pet: ${petName}!` : originalTitle;
      state = !state;
    }, 1000);

    const stopBlink = () => {
      clearInterval(titleBlinkInterval);
      titleBlinkInterval = null;
      document.title = originalTitle;
      window.removeEventListener('focus', stopBlink);
    };
    window.addEventListener('focus', stopBlink);
  }

  // ESCUTA O EVENTO DE NOVO AGENDAMENTO (EM TEMPO REAL)
  const handledIds = new Set();
  window.addEventListener('corujinha_new_appointment', (e) => {
    const app = e.detail;
    if (!app || !app.id) return;
    if (handledIds.has(app.id)) return;
    handledIds.add(app.id);

    // Se as notificações estiverem ativas (ou padrão na primeira vez)
    if (notificationsEnabled) {
      playNotificationChime();
    }
    showToast(app);
    showNativeNotification(app);
    triggerTabTitleAlert(app.petName || 'Agendamento');
  });

  // ========================================================================
  // CONTROLE DE AUTENTICAÇÃO / LOGIN DO PAINEL
  // ========================================================================
  const AUTH_KEY = 'corujinha_admin_auth_v1';
  const VALID_USER = 'admincorujinha1';
  const VALID_PASS = 'corujinha2026';

  const loginScreen = document.getElementById('adminLoginScreen');
  const loginForm = document.getElementById('adminLoginForm');
  const loginUserInput = document.getElementById('loginUsername');
  const loginPassInput = document.getElementById('loginPassword');
  const loginRememberMe = document.getElementById('loginRememberMe');
  const loginErrorMessage = document.getElementById('loginErrorMessage');
  const btnTogglePassword = document.getElementById('btnTogglePassword');
  const btnLogoutAdmin = document.getElementById('btnLogoutAdmin');

  function isAuthenticated() {
    return localStorage.getItem(AUTH_KEY) === 'true' || sessionStorage.getItem(AUTH_KEY) === 'true';
  }

  function setAuthenticated(remember) {
    if (remember) {
      localStorage.setItem(AUTH_KEY, 'true');
    } else {
      sessionStorage.setItem(AUTH_KEY, 'true');
    }
    if (loginScreen) {
      loginScreen.classList.add('is-hidden');
    }
    renderAll();
  }

  function logout() {
    localStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(AUTH_KEY);
    if (loginScreen) {
      loginScreen.classList.remove('is-hidden');
    }
    if (loginPassInput) loginPassInput.value = '';
    if (loginErrorMessage) loginErrorMessage.style.display = 'none';
    if (loginUserInput) loginUserInput.focus();
  }

  // Verifica estado inicial de login
  if (!isAuthenticated()) {
    if (loginScreen) loginScreen.classList.remove('is-hidden');
  } else {
    if (loginScreen) loginScreen.classList.add('is-hidden');
  }

  // Toggle mostrar/ocultar senha
  if (btnTogglePassword && loginPassInput) {
    btnTogglePassword.addEventListener('click', () => {
      const isPass = loginPassInput.type === 'password';
      loginPassInput.type = isPass ? 'text' : 'password';
      btnTogglePassword.style.color = isPass ? 'var(--royal-main)' : '#94a3b8';
    });
  }

  // Submissão do login
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const user = (loginUserInput.value || '').trim();
      const pass = (loginPassInput.value || '').trim();

      if (user === VALID_USER && pass === VALID_PASS) {
        if (loginErrorMessage) loginErrorMessage.style.display = 'none';
        const remember = loginRememberMe ? loginRememberMe.checked : true;
        setAuthenticated(remember);
      } else {
        if (loginErrorMessage) {
          loginErrorMessage.style.display = 'flex';
          loginErrorMessage.classList.remove('admin-login-error');
          void loginErrorMessage.offsetWidth;
          loginErrorMessage.classList.add('admin-login-error');
        }
        if (loginPassInput) {
          loginPassInput.value = '';
          loginPassInput.focus();
        }
      }
    });
  }

  // Botão Sair
  if (btnLogoutAdmin) {
    btnLogoutAdmin.addEventListener('click', () => {
      if (confirm('Deseja realmente sair do Painel de Atendimentos?')) {
        logout();
      }
    });
  }

  // Inicializa renderização
  renderAll();
});
