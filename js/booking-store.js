/**
 * Corujinha Banho & Tosa - Booking Data Store
 * Simula banco de dados em tempo real via localStorage
 */

const BOOKING_STORE_KEY = 'corujinha_appointments_v1';
const BLOCKED_SLOTS_KEY = 'corujinha_blocked_slots_v1';

// Horários de atendimento padrão
const DEFAULT_SLOTS = [
  '08:30', '09:30', '10:30', '11:30',
  '13:30', '14:30', '15:30', '16:30', '17:30'
];

// Dados iniciais de teste para a cliente ver o painel com agendamentos reais
function getInitialSampleAppointments() {
  const today = new Date();
  const formatDate = (d) => d.toISOString().split('T')[0];
  
  const d0 = formatDate(today);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const d1 = formatDate(tomorrow);

  const afterTomorrow = new Date(today);
  afterTomorrow.setDate(afterTomorrow.getDate() + 2);
  const d2 = formatDate(afterTomorrow);

  return [
    {
      id: 'CRJ-1082',
      clientName: 'Mariana Camargo',
      clientPhone: '(15) 99123-4567',
      petName: 'Thor',
      petBreed: 'Golden Retriever',
      petSize: 'Grande (25kg+)',
      service: 'Banho Especial & Hidratação',
      date: d0,
      time: '09:30',
      status: 'confirmado', // confirmado, concluido, cancelado
      notes: 'Muito dócil, adora escovação.',
      createdAt: new Date().toISOString()
    },
    {
      id: 'CRJ-1083',
      clientName: 'Rodrigo Silva',
      clientPhone: '(15) 99876-5432',
      petName: 'Bob',
      petBreed: 'Shih-tzu',
      petSize: 'Pequeno (até 10kg)',
      service: 'Tosa Bebê & Banho',
      date: d0,
      time: '14:30',
      status: 'confirmado',
      notes: 'Cuidado extra nas orelhinhas.',
      createdAt: new Date().toISOString()
    },
    {
      id: 'CRJ-1084',
      clientName: 'Camila Rocha',
      clientPhone: '(15) 99765-1122',
      petName: 'Mel',
      petBreed: 'Poodle',
      petSize: 'Médio (10 a 25kg)',
      service: 'Tosa Higiênica & Banho',
      date: d1,
      time: '10:30',
      status: 'confirmado',
      notes: '',
      createdAt: new Date().toISOString()
    },
    {
      id: 'CRJ-1085',
      clientName: 'Fernanda Lima',
      clientPhone: '(15) 99654-8899',
      petName: 'Pipoca',
      petBreed: 'Spitz Alemão',
      petSize: 'Pequeno (até 10kg)',
      service: 'Banho Especial',
      date: d2,
      time: '15:30',
      status: 'confirmado',
      notes: 'Usar shampoo hipoalergênico.',
      createdAt: new Date().toISOString()
    }
  ];
}

const BookingStore = {
  // Inicializa dados se não existirem
  init() {
    if (!localStorage.getItem(BOOKING_STORE_KEY)) {
      const initial = getInitialSampleAppointments();
      localStorage.setItem(BOOKING_STORE_KEY, JSON.stringify(initial));
    }
    if (!localStorage.getItem(BLOCKED_SLOTS_KEY)) {
      localStorage.setItem(BLOCKED_SLOTS_KEY, JSON.stringify([]));
    }
  },

  // Retorna todos os agendamentos
  getAll() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(BOOKING_STORE_KEY)) || [];
    } catch (e) {
      return [];
    }
  },

  // Salva lista de agendamentos
  saveAll(list) {
    localStorage.setItem(BOOKING_STORE_KEY, JSON.stringify(list));
    this.notifyUpdate();
  },

  // Retorna slots bloqueados
  getBlockedSlots() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(BLOCKED_SLOTS_KEY)) || [];
    } catch (e) {
      return [];
    }
  },

  saveBlockedSlots(list) {
    localStorage.setItem(BLOCKED_SLOTS_KEY, JSON.stringify(list));
    this.notifyUpdate();
  },

  // Verifica horários disponíveis para uma data (YYYY-MM-DD)
  getAvailableSlots(dateString) {
    const appointments = this.getAll().filter(
      app => app.date === dateString && app.status !== 'cancelado'
    );
    const blocked = this.getBlockedSlots().filter(
      b => b.date === dateString
    );

    const bookedTimes = new Set(appointments.map(a => a.time));
    const blockedTimes = new Set(blocked.map(b => b.time));

    return DEFAULT_SLOTS.map(time => {
      let isAvailable = true;
      let reason = '';

      if (bookedTimes.has(time)) {
        isAvailable = false;
        reason = 'Horário já agendado';
      } else if (blockedTimes.has(time)) {
        isAvailable = false;
        const blockObj = blocked.find(b => b.time === time);
        reason = blockObj ? blockObj.reason : 'Horário bloqueado';
      }

      return {
        time,
        isAvailable,
        reason
      };
    });
  },

  // Cria novo agendamento
  create(data) {
    const appointments = this.getAll();
    const id = 'CRJ-' + Math.floor(1000 + Math.random() * 9000);
    const newAppointment = {
      id,
      clientName: data.clientName.trim(),
      clientPhone: data.clientPhone.trim(),
      petName: data.petName.trim(),
      petBreed: data.petBreed.trim() || 'SRD / Vira-lata',
      petSize: data.petSize,
      service: data.service,
      date: data.date,
      time: data.time,
      status: 'confirmado',
      notes: (data.notes || '').trim(),
      createdAt: new Date().toISOString()
    };

    appointments.unshift(newAppointment);
    this.saveAll(appointments);
    return newAppointment;
  },

  // Atualiza status (confirmado, concluido, cancelado)
  updateStatus(id, newStatus) {
    const appointments = this.getAll();
    const target = appointments.find(a => a.id === id);
    if (target) {
      target.status = newStatus;
      this.saveAll(appointments);
      return true;
    }
    return false;
  },

  // Bloqueia um horário manualmente
  blockSlot(date, time, reason) {
    const blocked = this.getBlockedSlots();
    // remove se já existia
    const filtered = blocked.filter(b => !(b.date === date && b.time === time));
    filtered.push({
      id: 'BLK-' + Date.now(),
      date,
      time,
      reason: reason || 'Bloqueio da loja'
    });
    this.saveBlockedSlots(filtered);
  },

  // Desbloqueia horário
  unblockSlot(date, time) {
    const blocked = this.getBlockedSlots().filter(
      b => !(b.date === date && b.time === time)
    );
    this.saveBlockedSlots(blocked);
  },

  // Notifica outras abas/componentes
  notifyUpdate() {
    window.dispatchEvent(new CustomEvent('corujinha_store_updated'));
  }
};

// Auto inicializa
BookingStore.init();
