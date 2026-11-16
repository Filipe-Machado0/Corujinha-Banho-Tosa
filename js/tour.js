/**
 * Corujinha Banho & Tosa - Interactive Guided Client Tour
 * Inicia o tour automaticamente ao acessar a página.
 */

(function () {
  'use strict';

  // 4 passos essenciais do tour guiado
  const TOUR_STEPS = [
    {
      id: 'step-welcome',
      selector: '.hero__rating-badge, .hero__title, #inicio',
      title: '1. Bem-vindo(a) à Corujinha!',
      content: 'O melhor cuidado para o seu melhor amigo em Angatuba! Aqui trabalhamos <strong>exclusivamente com horário marcado</strong> para que seu cão receba atenção individual, paciência e <strong>sem estresse de gaiolas</strong>.',
      tip: 'Fique tranquilo(a): vamos te mostrar em 30 segundos como agendar sem complicações!',
      icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`
    },
    {
      id: 'step-services',
      selector: '#servicos .servicos__grid, #servicos',
      title: '2. Nossos Serviços & Valores Claros',
      content: 'Temos opções de <strong>Banho com Tosa Higiênica inclusa</strong>, <strong>Tosa na Máquina</strong>, <strong>Tosa Bebê na Tesoura</strong> e <strong>Táxi Dog gratuito</strong> na cidade. Trabalhamos exclusivamente com a <strong>Linha Hydra</strong> original!',
      tip: 'Os valores são transparentes de acordo com o porte do pet.',
      icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><line x1="20" y1="4" x2="8.12" y2="15.88"></line><line x1="14.47" y1="14.48" x2="20" y2="20"></line><line x1="8.12" y1="8.12" x2="12" y2="12"></line></svg>`
    },
    {
      id: 'step-booking',
      selector: '#servicos .service-card:first-child .btn, #servicos .btn--card-whatsapp, .hero__actions .btn--secondary',
      title: '3. Simule e Escolha seu Horário',
      content: 'Basta clicar no botão <strong>Agendar Horário</strong> para abrir nosso assistente online. Nele você seleciona o serviço, o porte do seu pet e escolhe o melhor dia e horário na agenda.',
      tip: 'Você já vê a estimativa de preço na hora, sem surpresas!',
      icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`
    },
    {
      id: 'step-whatsapp',
      selector: '.whatsapp-float, #contato',
      title: '4. Confirmação Rápida no WhatsApp',
      content: 'Ao finalizar, todos os dados do agendamento são enviados organizadinhos diretamente para o WhatsApp oficial da Corujinha. A Maíra e o Rodrigo recebem e confirmam tudo com você!',
      tip: 'Fácil, rápido e com todo o carinho que seu companheiro merece.',
      icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.072.043.419-.101.824z"/></svg>`
    }
  ];

  let currentStepIdx = 0;
  let isTourActive = false;
  let overlayContainer = null;
  let spotlightEl = null;
  let popoverEl = null;
  let currentTargetEl = null;

  // Cria os elementos do tour guiado (spotlight) no DOM
  function createTourElements() {
    if (document.getElementById('tourOverlayContainer')) return;

    overlayContainer = document.createElement('div');
    overlayContainer.id = 'tourOverlayContainer';
    overlayContainer.className = 'tour-overlay-container';

    overlayContainer.innerHTML = `
      <div class="tour-backdrop" id="tourBackdrop"></div>
      <div class="tour-spotlight has-pulse" id="tourSpotlight"></div>
      <div class="tour-popover" id="tourPopover" role="dialog" aria-modal="true" aria-labelledby="tourTitle">
        <div class="tour-popover__header">
          <span class="tour-popover__step-badge" id="tourStepBadge">Passo 1 de 4</span>
          <button class="tour-popover__close-btn" id="tourCloseBtn" aria-label="Fechar Tutorial">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div class="tour-popover__body">
          <h4 class="tour-popover__title" id="tourTitle">
            <span class="tour-popover__icon" id="tourIcon"></span>
            <span id="tourTitleText">Título</span>
          </h4>
          <p class="tour-popover__content" id="tourContent">Texto</p>
          <div class="tour-popover__tip" id="tourTip">
            <span>💡</span>
            <span id="tourTipText">Dica</span>
          </div>
        </div>
        <div class="tour-popover__footer">
          <div class="tour-popover__dots" id="tourDots"></div>
          <div class="tour-popover__nav-btns">
            <button type="button" class="tour-btn tour-btn--prev" id="tourPrevBtn">Voltar</button>
            <button type="button" class="tour-btn tour-btn--next" id="tourNextBtn">Próximo</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlayContainer);

    spotlightEl = document.getElementById('tourSpotlight');
    popoverEl = document.getElementById('tourPopover');

    // Eventos
    document.getElementById('tourCloseBtn').addEventListener('click', () => endTour(false));
    document.getElementById('tourBackdrop').addEventListener('click', (e) => {
      if (e.target.id === 'tourBackdrop') {
        endTour(false);
      }
    });

    document.getElementById('tourPrevBtn').addEventListener('click', prevStep);
    document.getElementById('tourNextBtn').addEventListener('click', handleNextAction);

    // Navegação via teclado
    document.addEventListener('keydown', (e) => {
      if (!isTourActive) return;
      if (e.key === 'Escape') endTour(false);
      if (e.key === 'ArrowRight') handleNextAction();
      if (e.key === 'ArrowLeft') prevStep();
    });

    // Manter alinhamento com resize e scroll
    window.addEventListener('resize', updateSpotlightAndPopover, { passive: true });
    window.addEventListener('scroll', updateSpotlightAndPopover, { passive: true });
  }

  // Atualiza a posição do spotlight e popover
  function updateSpotlightAndPopover() {
    if (!isTourActive || !currentTargetEl || !spotlightEl || !popoverEl) return;

    const rect = currentTargetEl.getBoundingClientRect();
    const padding = 10;

    const top = Math.max(0, rect.top - padding);
    const left = Math.max(0, rect.left - padding);
    const width = Math.min(window.innerWidth - left, rect.width + (padding * 2));
    const height = Math.min(window.innerHeight - top, rect.height + (padding * 2));

    spotlightEl.style.top = `${top}px`;
    spotlightEl.style.left = `${left}px`;
    spotlightEl.style.width = `${width}px`;
    spotlightEl.style.height = `${height}px`;

    // Em mobile (<=640px), o CSS fixa suavemente na base da tela
    if (window.innerWidth <= 640) {
      popoverEl.classList.add('is-positioned');
      return;
    }

    // Em desktop, posiciona inteligentemente acima ou abaixo
    const popoverRect = popoverEl.getBoundingClientRect();
    const popoverHeight = popoverRect.height || 260;
    const popoverWidth = popoverRect.width || 380;

    let popoverTop = top + height + 16;
    if (popoverTop + popoverHeight > window.innerHeight - 20) {
      popoverTop = Math.max(20, top - popoverHeight - 16);
    }

    let popoverLeft = left + (width / 2) - (popoverWidth / 2);
    popoverLeft = Math.max(20, Math.min(window.innerWidth - popoverWidth - 20, popoverLeft));

    popoverEl.style.top = `${popoverTop}px`;
    popoverEl.style.left = `${popoverLeft}px`;
    popoverEl.classList.add('is-positioned');
  }

  // Renderiza o passo atual
  function renderStep(idx) {
    currentStepIdx = idx;
    const step = TOUR_STEPS[idx];
    if (!step) return;

    let target = document.querySelector(step.selector);
    if (!target) {
      target = document.body;
    }
    currentTargetEl = target;

    if (target !== document.body) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    document.getElementById('tourStepBadge').textContent = `Passo ${idx + 1} de ${TOUR_STEPS.length}`;
    document.getElementById('tourIcon').innerHTML = step.icon || '';
    document.getElementById('tourTitleText').textContent = step.title;
    document.getElementById('tourContent').innerHTML = step.content;

    const tipContainer = document.getElementById('tourTip');
    const tipText = document.getElementById('tourTipText');
    if (step.tip) {
      tipText.textContent = step.tip;
      tipContainer.style.display = 'flex';
    } else {
      tipContainer.style.display = 'none';
    }

    const dotsContainer = document.getElementById('tourDots');
    dotsContainer.innerHTML = '';
    TOUR_STEPS.forEach((_, i) => {
      const dot = document.createElement('div');
      dot.className = `tour-popover__dot ${i === idx ? 'is-active' : ''}`;
      dotsContainer.appendChild(dot);
    });

    const prevBtn = document.getElementById('tourPrevBtn');
    const nextBtn = document.getElementById('tourNextBtn');

    prevBtn.disabled = (idx === 0);

    if (idx === TOUR_STEPS.length - 1) {
      nextBtn.textContent = 'Agendar Horário Agora 🐾';
      nextBtn.className = 'tour-btn tour-btn--finish';
    } else {
      nextBtn.textContent = 'Próximo →';
      nextBtn.className = 'tour-btn tour-btn--next';
    }

    setTimeout(updateSpotlightAndPopover, 320);
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

    // Se concluiu no último passo, abre o modal de agendamento online
    if (triggerBooking && window.CorujinhaBooking && typeof window.CorujinhaBooking.open === 'function') {
      setTimeout(() => {
        window.CorujinhaBooking.open('Banho com Tosa Higiênica');
      }, 250);
    }
  }

  // Intercepta cliques nos botões manuais de re-abrir o tutorial
  function bindTriggerButtons() {
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('#startTourNavBtn, #startTourFloatBtn, #startTourSectionBtn, .js-trigger-tour');
      if (trigger) {
        e.preventDefault();
        startTour(0);
      }
    });
  }

  // Auto-start: Ao acessar o site, já começa o tour interativo!
  function autoStartOnAccess() {
    // Pequeno delay de 450ms para permitir carregamento das fontes e layout
    setTimeout(() => {
      startTour(0);
    }, 450);
  }

  // API Global
  window.CorujinhaTour = {
    start: startTour,
    next: nextStep,
    prev: prevStep,
    end: endTour
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      bindTriggerButtons();
      autoStartOnAccess();
    });
  } else {
    bindTriggerButtons();
    autoStartOnAccess();
  }
})();
