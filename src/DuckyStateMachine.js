// DuckyStateMachine.js
class DuckyStateMachine {
  constructor(duckyEntity) {
    this.ducky = duckyEntity;
    this.currentState = null;
    this.previousState = null;
    this.stateStartTime = null;
    this.timeoutId = null;
    
    // Definisi state
    this.states = {
      IDLE: { priority: 1 },
      WALK: { priority: 2 },
      INTERACTED: { priority: 5 },
      THINKING: { priority: 4 },
      ERROR: { priority: 6 }
    };
    
    // Aturan transisi
    this.transitions = {
      'INIT': { to: 'IDLE' },
      'IDLE': { 
        'TIMEOUT': { to: 'WALK' } 
      },
      'WALK': { 
        'TIMEOUT': { to: 'IDLE' } 
      },
      'INTERACTED': { 
        'TIMEOUT': { to: 'IDLE' } 
      },
      'ANY': { 
        'DUCKY_CLICKED': { to: 'INTERACTED' },
        'API_START': { to: 'THINKING' },
        'API_END': { to: 'IDLE' }
      },
      'THINKING': { 
        'API_END': { to: 'IDLE' } 
      }
    };
  }

  transitionTo(newState, params = {}) {
    // Cek apakah transisi valid berdasarkan prioritas
    if (!this.canTransitionTo(newState)) {
      return false;
    }

    // Hapus timeout sebelumnya jika ada
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    // Simpan state sebelumnya
    this.previousState = this.currentState;
    
    // Update state
    const oldState = this.currentState;
    this.currentState = newState;
    this.stateStartTime = Date.now();

    // Emit event perubahan state
    this.ducky.renderer.updateAnimation(newState);
    
    // Tangani efek samping dari state change
    this.handleStateChange(newState, oldState, params);
    
    // Atur timeout jika diperlukan
    this.scheduleTimeout(newState);

    return true;
  }

  canTransitionTo(newState) {
    // Jika tidak ada state sebelumnya, transisi diperbolehkan
    if (!this.currentState) {
      return true;
    }

    // Dapatkan prioritas state saat ini dan state tujuan
    const currentStatePriority = this.states[this.currentState]?.priority || 0;
    const newStatePriority = this.states[newState]?.priority || 0;

    // State dengan prioritas lebih tinggi dapat menggantikan state saat ini
    // Atau jika state saat ini adalah interruptible
    return newStatePriority >= currentStatePriority;
  }

  handleStateChange(newState, oldState, params) {
    // Tangani efek samping perubahan state
    switch (newState) {
      case 'INTERACTED':
        // Tampilkan speech bubble saat state berubah ke INTERACTED
        this.ducky.speechBubble.show("what u want?");
        break;
      case 'IDLE':
        // Sembunyikan speech bubble saat kembali ke IDLE
        this.ducky.speechBubble.hide();
        break;
      default:
        // Untuk state lainnya, sembunyikan speech bubble
        this.ducky.speechBubble.hide();
    }
  }

  scheduleTimeout(state) {
    let timeoutDuration = 0;

    // Tentukan durasi timeout berdasarkan state
    switch (state) {
      case 'IDLE':
        timeoutDuration = 5000; // 5 detik sebelum beralih ke WALK
        break;
      case 'WALK':
        timeoutDuration = 8000; // 8 detik sebelum beralih ke IDLE
        break;
      case 'INTERACTED':
        timeoutDuration = 3000; // 3 detik sebelum kembali ke IDLE
        break;
      case 'THINKING':
        timeoutDuration = 10000; // 10 detik sebelum kembali ke IDLE jika API tidak merespons
        break;
      default:
        return; // Tidak ada timeout untuk state ini
    }

    // Atur timeout
    this.timeoutId = setTimeout(() => {
      this.ducky.eventSystem.emit('TIMEOUT');
    }, timeoutDuration);
  }

  getCurrentState() {
    return this.currentState;
  }

  getPreviousState() {
    return this.previousState;
  }
}