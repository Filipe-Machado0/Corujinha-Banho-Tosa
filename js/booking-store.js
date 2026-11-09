/**
 * Corujinha Banho & Tosa - Booking Data Store
 * Integrado ao Banco de Dados Supabase com Realtime e Fallback Local
 */

const SUPABASE_CONFIG = {
  url: 'https://fmbrycxpmpszeyizkuub.supabase.co',
  anonKey: 'sb_publishable_KV-QpkWj2NwE7GqwmEU6cA_IoVnVdr9'
};

const BOOKING_STORE_KEY = 'corujinha_appointments_v2';
const BLOCKED_SLOTS_KEY = 'corujinha_blocked_slots_v2';

// Horários de atendimento padrão
const DEFAULT_SLOTS = [
  '08:30', '09:30', '10:30', '11:30',
  '13:30', '14:30', '15:30', '16:30', '17:30'
];

// Conversores entre o formato do Frontend e as colunas do Supabase
function mapFromSupabase(row) {
  return {
    id: row.id,
    clientName: row.client_name,
    clientPhone: row.client_phone,
    petName: row.pet_name,
    petBreed: row.pet_breed || 'SRD / Vira-lata',
    petSize: row.pet_size,
    service: row.service,
    date: row.date,
    time: row.time,
    status: row.status || 'confirmado',
    notes: row.notes || '',
    createdAt: row.created_at
  };
}

function mapToSupabase(app) {
  return {
    id: app.id,
    client_name: app.clientName,
    client_phone: app.clientPhone,
    pet_name: app.petName,
    pet_breed: app.petBreed || 'SRD / Vira-lata',
    pet_size: app.petSize,
    service: app.service,
    date: app.date,
    time: app.time,
    status: app.status || 'confirmado',
    notes: app.notes || '',
    created_at: app.createdAt || new Date().toISOString()
  };
}

// Canal de comunicação instantânea entre abas no mesmo navegador
const corujinhaBroadcast = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('corujinha_channel_v1') : null;
if (corujinhaBroadcast) {
  corujinhaBroadcast.onmessage = (event) => {
    if (event.data && event.data.type === 'NEW_APPOINTMENT' && event.data.appointment) {
      window.dispatchEvent(new CustomEvent('corujinha_new_appointment', {
        detail: event.data.appointment
      }));
    }
  };
}

const BookingStore = {
  supabaseClient: null,
  isCloudConnected: false,
  cloudStatusMessage: 'Iniciando sincronização...',
  knownAppointmentIds: null,
  _pollInterval: null,

  // Inicializa dados locais e conexão na nuvem
  init() {
    try {
      localStorage.removeItem('corujinha_appointments_v1');
      localStorage.removeItem('corujinha_blocked_slots_v1');
    } catch (e) {}

    if (!localStorage.getItem(BOOKING_STORE_KEY)) {
      localStorage.setItem(BOOKING_STORE_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(BLOCKED_SLOTS_KEY)) {
      localStorage.setItem(BLOCKED_SLOTS_KEY, JSON.stringify([]));
    }

    this.initSupabase();
  },

  // Inicializa o cliente do Supabase
  initSupabase() {
    if (typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
      try {
        this.supabaseClient = window.supabase.createClient(
          SUPABASE_CONFIG.url,
          SUPABASE_CONFIG.anonKey
        );
        this.syncWithCloud();
        this.setupRealtime();
        this.startPolling();
      } catch (err) {
        console.warn('[Corujinha Store] Erro ao instanciar Supabase:', err);
        this.updateDbStatus(false, 'Falha ao conectar com o Supabase');
      }
    } else {
      // SDK do Supabase ainda carregando ou não disponível
      window.addEventListener('load', () => {
        if (window.supabase && window.supabase.createClient && !this.supabaseClient) {
          this.supabaseClient = window.supabase.createClient(
            SUPABASE_CONFIG.url,
            SUPABASE_CONFIG.anonKey
          );
          this.syncWithCloud();
          this.setupRealtime();
          this.startPolling();
        }
      });
    }
  },

  startPolling() {
    if (this._pollInterval) return;
    this._pollInterval = setInterval(() => {
      this.refreshAppointmentsFromCloud(true);
      this.refreshBlockedSlotsFromCloud();
    }, 3500);
  },

  // Atualiza status e emite evento para a interface
  updateDbStatus(connected, message) {
    this.isCloudConnected = connected;
    this.cloudStatusMessage = message;
    window.dispatchEvent(new CustomEvent('corujinha_db_status', {
      detail: { connected, message }
    }));
  },

  // Busca agendamentos e bloqueios na nuvem
  async syncWithCloud() {
    if (!this.supabaseClient) return;

    try {
      // 1. Busca agendamentos
      const { data: cloudAppointments, error: appErr } = await this.supabaseClient
        .from('appointments')
        .select('*')
        .order('date', { ascending: true });

      if (appErr) {
        if (appErr.code === 'PGRST205' || appErr.message?.includes('schema cache')) {
          this.updateDbStatus(false, 'Tabelas pendentes no Supabase. Execute o script schema.sql no SQL Editor.');
        } else {
          this.updateDbStatus(false, 'Erro Supabase: ' + (appErr.message || 'Verifique as permissões'));
        }
        return;
      }

      // Atualiza o cache local com os dados reais vindos do banco (ou vazio se zerado)
      if (cloudAppointments) {
        const mapped = cloudAppointments.map(mapFromSupabase);
        if (this.knownAppointmentIds === null) {
          this.knownAppointmentIds = new Set(mapped.map(a => a.id));
        }
        localStorage.setItem(BOOKING_STORE_KEY, JSON.stringify(mapped));
      }

      // 2. Busca bloqueios de horários
      const { data: cloudBlocks, error: blockErr } = await this.supabaseClient
        .from('blocked_slots')
        .select('*');

      if (!blockErr && cloudBlocks) {
        const mappedBlocks = cloudBlocks.map(b => ({
          id: b.id,
          date: b.date,
          time: b.time,
          reason: b.reason || 'Bloqueio da loja'
        }));
        localStorage.setItem(BLOCKED_SLOTS_KEY, JSON.stringify(mappedBlocks));
      }

      this.updateDbStatus(true, 'Supabase Cloud Conectado (Realtime Ativo)');
      this.notifyUpdate();
    } catch (e) {
      console.warn('[Corujinha Store] Erro durante sincronização com nuvem:', e);
      this.updateDbStatus(false, 'Modo Local (Offline)');
    }
  },

  // Configura Realtime no Supabase para sincronização instantânea
  setupRealtime() {
    if (!this.supabaseClient) return;

    try {
      this.supabaseClient
        .channel('corujinha-realtime-channel')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'appointments' },
          async (payload) => {
            console.log('[Corujinha Realtime] Mudança em appointments:', payload);
            if (payload.eventType === 'INSERT' && payload.new) {
              const newApp = mapFromSupabase(payload.new);
              window.dispatchEvent(new CustomEvent('corujinha_new_appointment', {
                detail: newApp
              }));
            }
            await this.refreshAppointmentsFromCloud();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'blocked_slots' },
          async (payload) => {
            console.log('[Corujinha Realtime] Mudança em blocked_slots:', payload);
            await this.refreshBlockedSlotsFromCloud();
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('[Corujinha Realtime] Conectado e ouvindo atualizações ao vivo!');
          }
        });
    } catch (err) {
      console.warn('[Corujinha Realtime] Falha ao assinar realtime:', err);
    }
  },

  async refreshAppointmentsFromCloud(triggerAlerts = true) {
    if (!this.supabaseClient) return;
    try {
      const { data, error } = await this.supabaseClient
        .from('appointments')
        .select('*')
        .order('date', { ascending: true });

      if (!error && data) {
        const mapped = data.map(mapFromSupabase);

        if (this.knownAppointmentIds === null) {
          this.knownAppointmentIds = new Set(mapped.map(a => a.id));
        } else if (triggerAlerts) {
          mapped.forEach(app => {
            if (!this.knownAppointmentIds.has(app.id) && app.status !== 'cancelado') {
              this.knownAppointmentIds.add(app.id);
              window.dispatchEvent(new CustomEvent('corujinha_new_appointment', {
                detail: app
              }));
            }
          });
        }

        localStorage.setItem(BOOKING_STORE_KEY, JSON.stringify(mapped));
        this.notifyUpdate();
      }
    } catch (e) {
      console.warn('Erro ao atualizar agendamentos do realtime:', e);
    }
  },

  async refreshBlockedSlotsFromCloud() {
    if (!this.supabaseClient) return;
    try {
      const { data, error } = await this.supabaseClient
        .from('blocked_slots')
        .select('*');

      if (!error && data) {
        const mapped = data.map(b => ({
          id: b.id,
          date: b.date,
          time: b.time,
          reason: b.reason || 'Bloqueio da loja'
        }));
        localStorage.setItem(BLOCKED_SLOTS_KEY, JSON.stringify(mapped));
        this.notifyUpdate();
      }
    } catch (e) {
      console.warn('Erro ao atualizar bloqueios do realtime:', e);
    }
  },

  // Retorna todos os agendamentos (do cache rápido)
  getAll() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(BOOKING_STORE_KEY)) || [];
    } catch (e) {
      return [];
    }
  },

  // Salva lista de agendamentos no cache local e notifica
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

    // Notifica instantaneamente outras abas abertas no mesmo navegador
    if (corujinhaBroadcast) {
      corujinhaBroadcast.postMessage({
        type: 'NEW_APPOINTMENT',
        appointment: newAppointment
      });
    }

    // Salva de forma assíncrona no Supabase
    if (this.supabaseClient) {
      this.supabaseClient
        .from('appointments')
        .insert([mapToSupabase(newAppointment)])
        .then(({ error }) => {
          if (error) {
            console.warn('[Corujinha Store] Erro ao sincronizar novo agendamento no Supabase:', error);
          } else {
            console.log('[Corujinha Store] Agendamento salvo no Supabase com sucesso!', id);
          }
        })
        .catch(err => console.warn('[Corujinha Store] Falha de rede ao salvar agendamento:', err));
    }

    return newAppointment;
  },

  // Atualiza status (confirmado, concluido, cancelado)
  updateStatus(id, newStatus) {
    const appointments = this.getAll();
    const target = appointments.find(a => a.id === id);
    if (target) {
      target.status = newStatus;
      this.saveAll(appointments);

      // Atualiza no Supabase
      if (this.supabaseClient) {
        this.supabaseClient
          .from('appointments')
          .update({ status: newStatus })
          .eq('id', id)
          .then(({ error }) => {
            if (error) console.warn('[Corujinha Store] Erro ao atualizar status no Supabase:', error);
          })
          .catch(err => console.warn('[Corujinha Store] Falha de rede ao atualizar status:', err));
      }

      return true;
    }
    return false;
  },

  // Bloqueia um horário manualmente
  blockSlot(date, time, reason) {
    const blocked = this.getBlockedSlots();
    const filtered = blocked.filter(b => !(b.date === date && b.time === time));
    const newBlock = {
      id: 'BLK-' + Date.now(),
      date,
      time,
      reason: reason || 'Bloqueio da loja'
    };
    filtered.push(newBlock);
    this.saveBlockedSlots(filtered);

    // Salva no Supabase
    if (this.supabaseClient) {
      this.supabaseClient
        .from('blocked_slots')
        .insert([{
          id: newBlock.id,
          date: newBlock.date,
          time: newBlock.time,
          reason: newBlock.reason
        }])
        .then(({ error }) => {
          if (error) console.warn('[Corujinha Store] Erro ao gravar bloqueio no Supabase:', error);
        })
        .catch(err => console.warn('[Corujinha Store] Falha de rede ao gravar bloqueio:', err));
    }
  },

  // Desbloqueia horário
  unblockSlot(date, time) {
    const blocked = this.getBlockedSlots().filter(
      b => !(b.date === date && b.time === time)
    );
    this.saveBlockedSlots(blocked);

    // Remove no Supabase
    if (this.supabaseClient) {
      this.supabaseClient
        .from('blocked_slots')
        .delete()
        .eq('date', date)
        .eq('time', time)
        .then(({ error }) => {
          if (error) console.warn('[Corujinha Store] Erro ao deletar bloqueio no Supabase:', error);
        })
        .catch(err => console.warn('[Corujinha Store] Falha de rede ao deletar bloqueio:', err));
    }
  },

  // Notifica componentes locais
  notifyUpdate() {
    window.dispatchEvent(new CustomEvent('corujinha_store_updated'));
  }
};

// Auto inicializa
BookingStore.init();
