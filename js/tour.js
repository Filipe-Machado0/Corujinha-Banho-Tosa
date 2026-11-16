/**
 * Corujinha Banho & Tosa - Guia Interativo de Agendamento
 * Arquitetura limpa, institucional e sem elementos artificiais/emojis.
 */

(function () {
  'use strict';

  const TOUR_STEPS = [
    {
      id: 'step-care',
      selector: '.hero__rating-badge, .hero__title, #inicio',
      stepNum: '01',
      title: 'Atendimento Individual',
      content: 'Trabalhamos exclusivamente com agendamento prévio. Cada pet tem seu horário reservado para um atendimento calmo, seguro e sem estresse de gaiolas.'
    },
    {
      id: 'step-services',
      selector: '#servicos .servicos__grid, #servicos',
      stepNum: '02',
      title: 'Serviços & Linha Hydra',
      content: 'Banhos completos com tosa higiênica inclusa, tosa máquina, tosa bebê na tesoura e Táxi Dog gratuito na cidade. Usamos exclusivamente cosméticos profissionais Hydra.'
    },
    {
      id: 'step-booking',
      selector: '#servicos .service-card:first-child .btn, #servicos .btn--card-whatsapp, .hero__actions .btn--secondary',
      stepNum: '03',
      title: 'Escolha de Data & Horário',
      content: 'No assistente online, você seleciona o porte do cão, o serviço desejado e consulta a estimativa de valor em tempo real antes de enviar.'
    },
    {
      id: 'step-whatsapp',
      selector: '.whatsapp-float, #contato',
      stepNum: '04',
      title: 'Confirmação Direta',
      content: 'Os detalhes do agendamento chegam estruturados diretamente no WhatsApp da Corujinha para confirmação rápida com Maíra e Rodrigo.'
    }
  ];

  let currentStepIdx = 0;
  let isTourActive = false;
  let overlayContainer = null;
  let spotlightEl = null;
  let popoverEl = null;
  let currentTargetEl = null;

  function createTourElements() {
    if (document.getElementById('tourOverlayContainer')) return;

    overlayContainer = document.createElement('div');
    overlayContainer.id = 'tourOverlayContainer';
    overlayContainer.className = 'tour-overlay-container';

    overlayContainer.innerHTML = `
      <div class="tour-backdrop" id="tourBackdrop"></div>
      <div class="tour-spotlight" id="tourSpotlight"></div>
      <div class="tour-popover" id="tourPopover" role="dialog" aria-modal="true" aria-labelledby="tourTitle">
        <!-- Barra de Progresso Superior -->
        <div class="tour-popover__progress-track">
          <div class="tour-popover__progress-bar" id="tourProgressBar"></div>
        </div>

        <div class="tour-popover__inner">
          <div class="tour-popover__top">
            <span class="tour-popover__counter" id="tourCounter">ETAPA 01 / 04</span>
            <button class="tour-popover__close" id="tourCloseBtn" type="button" aria-label="Fechar guia">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <h3 class="tour-popover__title" id="tourTitle">Título</h3>
          <p class="tour-popover__description" id="tourDescription">Conteúdo</p>

          <div class="tour-popover__actions">
            <button type="button" class="tour-btn tour-btn--skip" id="tourSkipBtn">Pular guia</button>
            <div class="tour-popover__nav-group">
              <button type="button" class="tour-btn tour-btn--back" id="tourPrevBtn">Anterior</button>
              <button type="button" class="tour-btn tour-btn--primary" id="tourNextBtn">Continuar</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlayContainer);

    spotlightEl = document.getElementById('tourSpotlight');
    popoverEl = document.getElementById('tourPopover');

    document.getElementById('tourCloseBtn').addEventListener('click', () => endTour(false));
    document.getElementById('tourSkipBtn').addEventListener('click', () => endTour(false));
    document.getElementById('tourBackdrop').addEventListener('click', (e) => {
      if (e.target.id === 'tourBackdrop') endTour(false);
    });

    document.getElementById('tourPrevBtn').addEventListener('click', prevStep);
    document.getElementById('tourNextBtn').addEventListener('click', handleNextAction);

    document.addEventListener('keydown', (e) => {
      if (!isTourActive) return;
      if (e.key === 'Escape') endTour(false);
      if (e.key === 'ArrowRight') handleNextAction();
      if (e.key === 'ArrowLeft') prevStep();
    });

    window.addEventListener('resize', updatePosition, { passive: true });
    window.addEventListener('scroll', updatePosition, { passive: true });
  }

  function updatePosition() {
    if (!isTourActive || !currentTargetEl || !spotlightEl || !popoverEl) return;

    const rect = currentTargetEl.getBoundingClientRect();
    const pad = 8;

    const top = Math.max(0, rect.top - pad);
    const left = Math.max(0, rect.left - pad);
    const width = Math.min(window.innerWidth - left, rect.width + (pad * 2));
    const height = Math.min(window.innerHeight - top, rect.height + (pad * 2));

    spotlightEl.style.top = `${top}px`;
    spotlightEl.style.left = `${left}px`;
    spotlightEl.style.width = `${width}px`;
    spotlightEl.style.height = `${height}px`;

    // Mobile: doca limpa na base
    if (window.innerWidth <= 640) {
      popoverEl.classList.add('is-positioned');
      return;
    }

    const popoverRect = popoverEl.getBoundingClientRect();
    const popoverH = popoverRect.height || 210;
    const popoverW = popoverRect.width || 360;

    let popTop = top + height + 14;
    if (popTop + popoverH > window.innerHeight - 20) {
      popTop = Math.max(20, top - popoverH - 14);
    }

    let popLeft = left + (width / 2) - (popoverW / 2);
    popLeft = Math.max(20, Math.min(window.innerWidth - popoverW - 20, popLeft));

    popoverEl.style.top = `${popTop}px`;
    popoverEl.style.left = `${popLeft}px`;
    popoverEl.classList.add('is-positioned');
  }

  function renderStep(idx) {
    currentStepIdx = idx;
    const step = TOUR_STEPS[idx];
    if (!step) return;

    let target = document.querySelector(step.selector);
    if (!target) target = document.body;
    currentTargetEl = target;

    if (target !== document.body) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Atualiza barra de progresso e textos
    const progressPercent = ((idx + 1) / TOUR_STEPS.length) * 100;
    document.getElementById('tourProgressBar').style.width = `${progressPercent}%`;
    document.getElementById('tourCounter').textContent = `ETAPA ${step.stepNum} / 04`;
    document.getElementById('tourTitle').textContent = step.title;
    document.getElementById('tourDescription').innerHTML = step.content;

    const prevBtn = document.getElementById('tourPrevBtn');
    const nextBtn = document.getElementById('tourNextBtn');

    prevBtn.disabled = (idx === 0);

    if (idx === TOUR_STEPS.length - 1) {
      nextBtn.textContent = 'Agendar Horário';
      nextBtn.classList.add('tour-btn--final');
    } else {
      nextBtn.textContent = 'Continuar';
      nextBtn.classList.remove('tour-btn--final');
    }

    setTimeout(updatePosition, 280);
  }

  function handleNextAction() {
    if (currentStepIdx < TOUR_STEPS.length - 1) {
      nextStep();
    } else {
      endTour(true);
    }
  }

  function nextStep() {
    if (currentStepIdx < TOUR_STEPS.length - 1) {
      renderStep(currentStepIdx + 1);
    }
  }

  function prevStep() {
    if (currentStepIdx > 0) {
      renderStep(currentStepIdx - 1);
    }
  }

  function startTour(initialStep = 0) {
    createTourElements();
    isTourActive = true;
    overlayContainer.classList.add('is-active');
    document.body.classList.add('tour-is-open');

    renderStep(initialStep);
  }

  function endTour(triggerBooking = false) {
    isTourActive = false;
    if (overlayContainer) {
      overlayContainer.classList.remove('is-active');
    }
    document.body.classList.remove('tour-is-open');

    if (triggerBooking && window.CorujinhaBooking && typeof window.CorujinhaBooking.open === 'function') {
      setTimeout(() => {
        window.CorujinhaBooking.open('Banho com Tosa Higiênica');
      }, 200);
    }
  }

  function bindTriggerButtons() {
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('#startTourNavBtn, #startTourFloatBtn, #startTourSectionBtn, .js-trigger-tour');
      if (trigger) {
        e.preventDefault();
        startTour(0);
      }
    });
  }

  // Início automático e direto no carregamento
  function initAutoStart() {
    setTimeout(() => {
      startTour(0);
    }, 450);
  }

  window.CorujinhaTour = {
    start: startTour,
    next: nextStep,
    prev: prevStep,
    end: endTour
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      bindTriggerButtons();
      initAutoStart();
    });
  } else {
    bindTriggerButtons();
    initAutoStart();
  }
})();
