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

  // Inicializa renderização
  renderAll();
});
