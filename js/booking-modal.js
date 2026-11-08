/**
 * Corujinha Banho & Tosa - Interactive Booking Modal Logic
 */

(function () {
  const WHATSAPP_NUMBER = '5515997500417'; // WhatsApp oficial da Corujinha

  // Estado do agendamento em andamento
  const bookingState = {
    service: 'Banho Especial',
    petSize: 'Pequeno (até 10kg)',
    date: '',
    time: '',
    petName: '',
    petBreed: '',
    clientName: '',
    clientPhone: '',
    notes: '',
    currentStep: 1
  };

  // Cria estrutura do modal no DOM se não existir
  function injectModalHTML() {
    if (document.getElementById('bookingModalBackdrop')) return;

    // Data mínima: hoje; Data padrão: amanhã se for depois das 17h
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    
    let defaultDate = new Date();
    if (now.getHours() >= 17) {
      defaultDate.setDate(defaultDate.getDate() + 1);
    }
    // Não defaultar para domingo (domingo = 0)
    if (defaultDate.getDay() === 0) {
      defaultDate.setDate(defaultDate.getDate() + 1);
    }
    bookingState.date = toISO(defaultDate);

    const modalHTML = `
      <div class="booking-modal-backdrop" id="bookingModalBackdrop">
        <div class="booking-modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
          <!-- Header -->
          <div class="booking-modal__header">
            <div class="booking-modal__header-info">
              <div class="booking-modal__logo-badge">
                <img src="assets/logo.png" alt="Corujinha">
              </div>
              <div>
                <h3 class="booking-modal__title" id="modalTitle">Agendamento Online</h3>
                <p class="booking-modal__subtitle">Corujinha Banho &amp; Tosa &bull; Rápido e Sem Espera</p>
              </div>
            </div>
            <button class="booking-modal__close" id="modalCloseBtn" aria-label="Fechar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          <!-- Steps Progress Bar -->
          <div class="booking-steps-bar" id="bookingStepsBar">
            <div class="booking-step-dot is-active" data-step="1">
              <span class="booking-step-dot__num">1</span>
              <span>Serviço &amp; Pet</span>
            </div>
            <div class="booking-step-dot" data-step="2">
              <span class="booking-step-dot__num">2</span>
              <span>Data &amp; Horário</span>
            </div>
            <div class="booking-step-dot" data-step="3">
              <span class="booking-step-dot__num">3</span>
              <span>Seus Dados</span>
            </div>
            <div class="booking-step-dot" data-step="4">
              <span class="booking-step-dot__num">4</span>
              <span>Confirmação</span>
            </div>
          </div>

          <!-- Body -->
          <div class="booking-modal__body">
            <!-- STEP 1: Serviço e Porte -->
            <div class="booking-step-panel is-active" id="stepPanel1">
              <h4 class="step-instruction">Qual cuidado o seu amigo precisa?</h4>
              <p class="step-hint">Selecione o serviço principal para calcularmos o tempo de atendimento:</p>

              <div class="booking-options-grid" id="serviceOptions">
                <label class="option-card-radio">
                  <input type="radio" name="bookingService" value="Banho Especial" checked>
                  <div class="option-card-radio__content">
                    <div class="option-card-radio__main">
                      <strong>Banho Especial</strong>
                      <span>Shampoo profissional, ouvidos limpos, unhas cortadas e perfume</span>
                    </div>
                    <div class="option-card-radio__indicator"></div>
                  </div>
                </label>

                <label class="option-card-radio">
                  <input type="radio" name="bookingService" value="Banho &amp; Tosa Geral">
                  <div class="option-card-radio__content">
                    <div class="option-card-radio__main">
                      <strong>Banho &amp; Tosa Geral</strong>
                      <span>Tosa na máquina/tesoura para alívio do calor e higiene completa</span>
                    </div>
                    <div class="option-card-radio__indicator"></div>
                  </div>
                </label>

                <label class="option-card-radio">
                  <input type="radio" name="bookingService" value="Tosa Bebê &amp; Banho">
                  <div class="option-card-radio__content">
                    <div class="option-card-radio__main">
                      <strong>Tosa Bebê &amp; Banho</strong>
                      <span>Corte artesanal na tesoura, pelagem fofa e acabamento de filhote</span>
                    </div>
                    <div class="option-card-radio__indicator"></div>
                  </div>
                </label>

                <label class="option-card-radio">
                  <input type="radio" name="bookingService" value="Tosa Higiênica &amp; Banho">
                  <div class="option-card-radio__content">
                    <div class="option-card-radio__main">
                      <strong>Tosa Higiênica &amp; Banho</strong>
                      <span>Patinhas (coxins), região íntima e olhos + banho relaxante</span>
                    </div>
                    <div class="option-card-radio__indicator"></div>
                  </div>
                </label>

                <label class="option-card-radio">
                  <input type="radio" name="bookingService" value="Banho &amp; Hidratação Profunda">
                  <div class="option-card-radio__content">
                    <div class="option-card-radio__main">
                      <strong>Banho &amp; Hidratação Profunda</strong>
                      <span>Nutrição intensiva, brilho espelhado e desembaraço de nós</span>
                    </div>
                    <div class="option-card-radio__indicator"></div>
                  </div>
                </label>
              </div>

              <h4 class="step-instruction" style="margin-top: 18px;">Qual o porte do pet?</h4>
              <p class="step-hint">Isso ajuda a equipe a reservar o tempo ideal de secagem:</p>

              <div class="pet-size-selector" id="sizeOptions">
                <label class="size-pill-radio">
                  <input type="radio" name="petSize" value="Pequeno (até 10kg)" checked>
                  <div class="size-pill-radio__box">
                    <strong>Pequeno</strong>
                    <span>Até 10kg</span>
                  </div>
                </label>
                <label class="size-pill-radio">
                  <input type="radio" name="petSize" value="Médio (10 a 25kg)">
                  <div class="size-pill-radio__box">
                    <strong>Médio</strong>
                    <span>10 a 25kg</span>
                  </div>
                </label>
                <label class="size-pill-radio">
                  <input type="radio" name="petSize" value="Grande (25kg+)">
                  <div class="size-pill-radio__box">
                    <strong>Grande</strong>
                    <span>25kg ou mais</span>
                  </div>
                </label>
              </div>
            </div>

            <!-- STEP 2: Data e Horário -->
            <div class="booking-step-panel" id="stepPanel2">
              <h4 class="step-instruction">Escolha a data e o horário disponível</h4>
              <p class="step-hint">Horários atualizados em tempo real conforme a agenda da loja:</p>

              <div class="date-selector-group">
                <label for="bookingDateInput">Selecione o Dia:</label>
                <input type="date" id="bookingDateInput" class="booking-date-input" value="${bookingState.date}">
              </div>

              <div class="slots-grid-wrapper">
                <div class="slots-grid-title">
                  <span>Horários para este dia:</span>
                  <span id="slotAvailabilitySummary">Carregando horários...</span>
                </div>
                <div class="slots-grid" id="slotsGridContainer">
                  <!-- Injetado via JS -->
                </div>
              </div>
            </div>

            <!-- STEP 3: Dados do Pet e do Tutor -->
            <div class="booking-step-panel" id="stepPanel3">
              <h4 class="step-instruction">Quem é o seu amigo de quatro patas?</h4>
              <p class="step-hint">Preencha os dados para a equipe identificar o seu pet:</p>

              <div class="form-row form-row--two-col">
                <div>
                  <label for="inputPetName">Nome do Pet *</label>
                  <input type="text" id="inputPetName" placeholder="Ex: Bob, Mel, Thor..." required>
                </div>
                <div>
                  <label for="inputPetBreed">Raça do Pet</label>
                  <input type="text" id="inputPetBreed" placeholder="Ex: Shih-tzu, Vira-lata...">
                </div>
              </div>

              <div class="form-row form-row--two-col">
                <div>
                  <label for="inputClientName">Seu Nome (Tutor) *</label>
                  <input type="text" id="inputClientName" placeholder="Nome completo" required>
                </div>
                <div>
                  <label for="inputClientPhone">Seu WhatsApp *</label>
                  <input type="tel" id="inputClientPhone" placeholder="(15) 99999-9999" required>
                </div>
              </div>

              <div class="form-row">
                <label for="inputNotes">Observações Especiais (Opcional)</label>
                <textarea id="inputNotes" rows="2" placeholder="Ex: tem medo de secador, velhinho, alérgico a perfumes fortes..."></textarea>
              </div>
            </div>

            <!-- STEP 4: Confirmação & Sucesso -->
            <div class="booking-step-panel" id="stepPanel4">
              <div class="booking-success-box">
                <div class="booking-success-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h3 class="booking-success-title">Horário Reservado com Sucesso!</h3>
                <p class="booking-success-text">
                  Seu horário já foi salvo na agenda da Corujinha. Para finalizar e garantir o atendimento, envie a confirmação no WhatsApp com 1 clique:
                </p>

                <div class="booking-ticket" id="bookingTicketSummary">
                  <!-- Gerado dinamicamente -->
                </div>

                <a href="#" id="btnWhatsAppConfirmSend" target="_blank" rel="noopener noreferrer" class="btn-whatsapp-confirm">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                  <span>Enviar Confirmação no WhatsApp</span>
                </a>
              </div>
            </div>
          </div>

          <!-- Footer Buttons -->
          <div class="booking-modal__footer" id="modalFooterNav">
            <button type="button" class="btn-modal-prev" id="btnStepPrev" style="display: none;">Voltar</button>
            <button type="button" class="btn-modal-next" id="btnStepNext">
              <span>Continuar</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    setupModalEvents();
  }

  // Renderiza slots de horário com base na data
  function renderSlots() {
    const container = document.getElementById('slotsGridContainer');
    const summary = document.getElementById('slotAvailabilitySummary');
    if (!container) return;

    const slots = BookingStore.getAvailableSlots(bookingState.date);
    const availableCount = slots.filter(s => s.isAvailable).length;

    summary.textContent = `${availableCount} disponíveis`;
    container.innerHTML = '';

    if (slots.length === 0) {
      container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 20px;">Nenhum horário cadastrado para este dia.</p>';
      return;
    }

    slots.forEach(slot => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'slot-btn';
      if (!slot.isAvailable) {
        btn.disabled = true;
      }
      if (bookingState.time === slot.time && slot.isAvailable) {
        btn.classList.add('is-selected');
      }

      btn.innerHTML = `
        <strong>${slot.time}</strong>
        <span>${slot.isAvailable ? 'Disponível' : 'Ocupado'}</span>
      `;

      btn.addEventListener('click', () => {
        document.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('is-selected'));
        btn.classList.add('is-selected');
        bookingState.time = slot.time;
        updateNavButtons();
      });

      container.appendChild(btn);
    });

    // Se o horário selecionado anteriormente ficou indisponível, reseta
    const currentStillAvailable = slots.find(s => s.time === bookingState.time && s.isAvailable);
    if (!currentStillAvailable) {
      bookingState.time = '';
    }
    updateNavButtons();
  }

  // Atualiza botões do rodapé e indicadores de etapas
  function updateNavButtons() {
    const btnPrev = document.getElementById('btnStepPrev');
    const btnNext = document.getElementById('btnStepNext');
    const footer = document.getElementById('modalFooterNav');

    if (bookingState.currentStep === 4) {
      footer.style.display = 'none'; // Na tela de sucesso, só o botão do WhatsApp importa
      return;
    } else {
      footer.style.display = 'flex';
    }

    // Botão Voltar
    if (bookingState.currentStep === 1) {
      btnPrev.style.display = 'none';
    } else {
      btnPrev.style.display = 'inline-block';
    }

    // Botão Avançar / Finalizar
    if (bookingState.currentStep === 1) {
      btnNext.disabled = false;
      btnNext.querySelector('span').textContent = 'Escolher Horário';
    } else if (bookingState.currentStep === 2) {
      btnNext.disabled = !bookingState.time;
      btnNext.querySelector('span').textContent = bookingState.time ? `Confirmar ${bookingState.time}` : 'Selecione um Horário';
    } else if (bookingState.currentStep === 3) {
      const petName = document.getElementById('inputPetName').value.trim();
      const clientName = document.getElementById('inputClientName').value.trim();
      const clientPhone = document.getElementById('inputClientPhone').value.trim();
      const valid = petName && clientName && clientPhone;
      btnNext.disabled = !valid;
      btnNext.querySelector('span').textContent = 'Finalizar Agendamento';
    }

    // Atualiza barras de progresso
    document.querySelectorAll('.booking-step-dot').forEach(dot => {
      const stepNum = parseInt(dot.getAttribute('data-step'), 10);
      dot.classList.remove('is-active', 'is-done');
      if (stepNum === bookingState.currentStep) {
        dot.classList.add('is-active');
      } else if (stepNum < bookingState.currentStep) {
        dot.classList.add('is-done');
      }
    });
  }

  function goToStep(step) {
    bookingState.currentStep = step;
    document.querySelectorAll('.booking-step-panel').forEach(p => p.classList.remove('is-active'));
    const target = document.getElementById(`stepPanel${step}`);
    if (target) target.classList.add('is-active');

    if (step === 2) {
      renderSlots();
    }
    updateNavButtons();
  }

  // Formata data ISO para legível em português (ex: "Quarta-feira, 11 de Novembro")
  function formatHumanDate(isoDate) {
    if (!isoDate) return '';
    const [y, m, d] = isoDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return `${days[dateObj.getDay()]}, ${d} de ${months[m - 1]}`;
  }

  // Executa o agendamento
  function submitBooking() {
    bookingState.petName = document.getElementById('inputPetName').value.trim();
    bookingState.petBreed = document.getElementById('inputPetBreed').value.trim() || 'SRD / Vira-lata';
    bookingState.clientName = document.getElementById('inputClientName').value.trim();
    bookingState.clientPhone = document.getElementById('inputClientPhone').value.trim();
    bookingState.notes = document.getElementById('inputNotes').value.trim();

    // Salva no store compartilhado
    const record = BookingStore.create({
      service: bookingState.service,
      petSize: bookingState.petSize,
      date: bookingState.date,
      time: bookingState.time,
      petName: bookingState.petName,
      petBreed: bookingState.petBreed,
      clientName: bookingState.clientName,
      clientPhone: bookingState.clientPhone,
      notes: bookingState.notes
    });

    // Monta o comprovante visual
    const summaryContainer = document.getElementById('bookingTicketSummary');
    summaryContainer.innerHTML = `
      <div class="booking-ticket__row">
        <strong>Código do Agendamento:</strong>
        <span>#${record.id}</span>
      </div>
      <div class="booking-ticket__row">
        <strong>Serviço:</strong>
        <span>${record.service}</span>
      </div>
      <div class="booking-ticket__row">
        <strong>Pet:</strong>
        <span>${record.petName} (${record.petBreed} - ${record.petSize.split(' ')[0]})</span>
      </div>
      <div class="booking-ticket__row">
        <strong>Data &amp; Horário:</strong>
        <span>${formatHumanDate(record.date)} às ${record.time}</span>
      </div>
      <div class="booking-ticket__row">
        <strong>Tutor:</strong>
        <span>${record.clientName}</span>
      </div>
    `;

    // Monta link oficial do WhatsApp
    const msg = `Olá Corujinha Banho & Tosa! 🐾\nAcabei de realizar um agendamento pelo site:\n\n` +
      `📌 *Código:* #${record.id}\n` +
      `🐶 *Pet:* ${record.petName} (${record.petBreed} - ${record.petSize})\n` +
      `✂️ *Serviço:* ${record.service}\n` +
      `📅 *Data:* ${formatHumanDate(record.date)} às ${record.time}\n` +
      `👤 *Tutor:* ${record.clientName}\n` +
      (record.notes ? `📝 *Observação:* ${record.notes}\n\n` : `\n`) +
      `Obrigado(a)!`;

    const encodedMsg = encodeURIComponent(msg);
    const waBtn = document.getElementById('btnWhatsAppConfirmSend');
    waBtn.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMsg}`;

    goToStep(4);
  }

  function setupModalEvents() {
    const backdrop = document.getElementById('bookingModalBackdrop');
    const closeBtn = document.getElementById('modalCloseBtn');
    const btnPrev = document.getElementById('btnStepPrev');
    const btnNext = document.getElementById('btnStepNext');
    const dateInput = document.getElementById('bookingDateInput');

    // Fechar
    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });

    // Botão de envio WhatsApp na etapa final
    const waConfirmBtn = document.getElementById('btnWhatsAppConfirmSend');
    if (waConfirmBtn) {
      waConfirmBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Não previne default para abrir o WhatsApp normalmente em nova aba
        setTimeout(() => {
          closeModal();
        }, 1200);
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && backdrop.classList.contains('is-open')) {
        closeModal();
      }
    });

    // Mudança de Serviço
    document.querySelectorAll('input[name="bookingService"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        bookingState.service = e.target.value;
      });
    });

    // Mudança de Porte
    document.querySelectorAll('input[name="petSize"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        bookingState.petSize = e.target.value;
      });
    });

    // Mudança de Data
    dateInput.addEventListener('change', (e) => {
      bookingState.date = e.target.value;
      renderSlots();
    });

    // Inputs no Step 3 para validar em tempo real
    ['inputPetName', 'inputClientName', 'inputClientPhone'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', updateNavButtons);
      }
    });

    // Avançar / Voltar
    btnPrev.addEventListener('click', () => {
      if (bookingState.currentStep > 1) {
        goToStep(bookingState.currentStep - 1);
      }
    });

    btnNext.addEventListener('click', () => {
      if (bookingState.currentStep === 1) {
        goToStep(2);
      } else if (bookingState.currentStep === 2) {
        if (!bookingState.time) return;
        goToStep(3);
      } else if (bookingState.currentStep === 3) {
        submitBooking();
      }
    });
  }

  function openModal(presetService) {
    injectModalHTML();
    if (presetService) {
      bookingState.service = presetService;
      const targetRadio = document.querySelector(`input[name="bookingService"][value="${presetService}"]`);
      if (targetRadio) targetRadio.checked = true;
    }
    goToStep(1);
    const backdrop = document.getElementById('bookingModalBackdrop');
    backdrop.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    const backdrop = document.getElementById('bookingModalBackdrop');
    if (backdrop) {
      backdrop.classList.remove('is-open');
      document.body.style.overflow = '';
    }
  }

  // Intercepta todos os cliques em botões de agendamento na página
  function attachTriggerButtons() {
    document.addEventListener('click', (e) => {
      // Se clicou dentro do próprio modal de agendamento, NUNCA intercepta
      if (e.target.closest('#bookingModalBackdrop') || e.target.closest('.booking-modal')) {
        return;
      }

      // Se clicou num botão que é CTA de agendamento
      const target = e.target.closest('a, button');
      if (!target) return;

      const href = target.getAttribute('href') || '';
      const text = target.innerText || '';

      // Se for botão de agendamento do site (hero, header, cards)
      if (
        (href.includes('wa.me') && !target.classList.contains('whatsapp-float') && !target.closest('.contact') && !target.closest('.footer')) ||
        target.classList.contains('js-trigger-booking') ||
        (text.includes('Agendar') && !target.closest('.booking-modal'))
      ) {
        e.preventDefault();
        
        let preset = 'Banho Especial';
        if (text.toLowerCase().includes('tosa')) {
          preset = 'Banho & Tosa Geral';
        } else if (text.toLowerCase().includes('hidrata')) {
          preset = 'Banho & Hidratação Profunda';
        }
        
        openModal(preset);
      }
    });
  }

  // Expor globalmente
  window.CorujinhaBooking = {
    open: openModal,
    close: closeModal
  };

  document.addEventListener('DOMContentLoaded', () => {
    attachTriggerButtons();
  });
})();
