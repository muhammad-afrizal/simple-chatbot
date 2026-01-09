// DuckyEntity.js
class DuckyEntity {
  constructor(containerElement, options = {}) {
    // Entity Layer - representasi data dan state Ducky
    this.container = containerElement;
    this.options = {
      basePath: options.basePath || './assets/Ducky/',
      prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      ...options
    };

    // Deteksi preferensi pengguna terkait animasi
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Tambahkan event listener untuk mengupdate preferensi saat berubah
    window.matchMedia('(prefers-reduced-motion: reduce)').addListener((e) => {
      this.prefersReducedMotion = e.matches;
      this.updateMotionPreferences();
    });

    // Inisialisasi komponen
    this.stateMachine = new DuckyStateMachine(this);
    this.eventSystem = new DuckyEventSystem(this);
    this.renderer = new DuckyRenderer(this, this.container);
    this.speechBubble = new DuckySpeechBubble(this, this.container);

    // Elemen visual utama
    this.element = null;
    
    // Inisialisasi
    this.init();
  }

  init() {
    // Membuat elemen visual
    this.createElement();
    
    // Menginisialisasi event listener
    this.setupEventListeners();
    
    // Mengirim event INIT
    this.eventSystem.emit('INIT');
  }

  createElement() {
    this.element = document.createElement('img');
    this.element.className = 'ducky-entity';
    
    // Tambahkan atribut aksesibilitas
    this.element.setAttribute('alt', 'Ducky - Interactive Character');
    this.element.setAttribute('role', 'img');
    this.element.setAttribute('aria-label', 'Ducky - Interactive Character');
    
    // Tambahkan title untuk informasi tambahan
    this.element.setAttribute('title', 'Interactive Ducky Character - Click to interact');
    
    this.element.style.position = 'absolute';
    this.element.style.zIndex = '1000';
    
    // Menyesuaikan dengan preferensi motion
    if (this.prefersReducedMotion) {
      this.element.style.animation = 'none';
    }
    
    this.container.appendChild(this.element);
  }

  setupEventListeners() {
    // Menambahkan event listener untuk klik
    this.element.addEventListener('click', () => {
      this.eventSystem.emit('DUCKY_CLICKED');
    });
  }

  // Metode untuk mengupdate state
  updateState(newState, params = {}) {
    this.stateMachine.transitionTo(newState, params);
  }

  // Metode untuk mendapatkan state saat ini
  getCurrentState() {
    return this.stateMachine.getCurrentState();
  }

  // Metode untuk mengupdate preferensi motion
  updateMotionPreferences() {
    if (this.prefersReducedMotion) {
      // Nonaktifkan animasi jika pengguna memilih reduced motion
      this.element.style.animation = 'none';
      this.element.style.transition = 'none';
      
      // Untuk renderer, nonaktifkan gerakan
      if (this.renderer) {
        this.renderer.stopWalking();
      }
    } else {
      // Aktifkan kembali animasi jika pengguna tidak memilih reduced motion
      this.element.style.animation = '';
      this.element.style.transition = '';
    }
  }

  // Cleanup resources
  destroy() {
    if (this.element && this.container.contains(this.element)) {
      this.container.removeChild(this.element);
    }
    this.eventSystem.removeAllListeners();
  }
}