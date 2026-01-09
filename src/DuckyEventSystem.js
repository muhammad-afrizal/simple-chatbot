// DuckyEventSystem.js
class DuckyEventSystem {
  constructor(duckyEntity) {
    this.ducky = duckyEntity;
    this.listeners = new Map();
    this.eventQueue = [];
  }

  // Mendaftarkan listener untuk event tertentu
  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(callback);
  }

  // Menghapus listener untuk event tertentu
  off(eventType, callback) {
    if (this.listeners.has(eventType)) {
      const eventListeners = this.listeners.get(eventType);
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  // Mengirim event ke state machine
  emit(eventType, data = {}) {
    // Tambahkan event ke queue
    this.eventQueue.push({ type: eventType, data });
    
    // Proses event
    this.processEvent(eventType, data);
  }

  // Memproses event
  processEvent(eventType, data) {
    // Kirim event ke state machine untuk diproses
    const handled = this.handleEventByStateMachine(eventType, data);
    
    // Jika tidak ditangani oleh state machine, proses listener
    if (!handled) {
      this.notifyListeners(eventType, data);
    }
  }

  // Menangani event berdasarkan state machine
  handleEventByStateMachine(eventType, data) {
    // Dapatkan transisi yang mungkin berdasarkan state saat ini
    const currentState = this.ducky.getCurrentState();
    let transition = null;

    // Cek transisi spesifik untuk state saat ini
    if (currentState && this.ducky.stateMachine.transitions[currentState]) {
      transition = this.ducky.stateMachine.transitions[currentState][eventType];
    }

    // Jika tidak ditemukan, cek transisi global (ANY)
    if (!transition && this.ducky.stateMachine.transitions['ANY']) {
      transition = this.ducky.stateMachine.transitions['ANY'][eventType];
    }

    // Jika ditemukan transisi, lakukan perubahan state
    if (transition && transition.to) {
      this.ducky.updateState(transition.to, data);
      return true;
    }

    return false;
  }

  // Memberi tahu listener tentang event
  notifyListeners(eventType, data) {
    if (this.listeners.has(eventType)) {
      const eventListeners = this.listeners.get(eventType);
      eventListeners.forEach(callback => {
        callback(data);
      });
    }
  }

  // Menghapus semua listener
  removeAllListeners() {
    this.listeners.clear();
    this.eventQueue = [];
  }
}