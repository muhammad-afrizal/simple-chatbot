/**
 * Ducky Landing Page Implementation
 * 
 * Implements the landing page with Ducky character that moves along a line
 * and redirects to chatbot page after certain interactions or timeouts.
 */

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
    
    console.log(`Event emitted: ${eventType}`, data);
    
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

// DuckyStateMachine.js
class DuckyStateMachine {
  constructor(duckyEntity) {
    this.ducky = duckyEntity;
    this.currentState = null;
    this.previousState = null;
    this.stateStartTime = null;
    this.timeoutId = null;
    this.redirectTimeoutId = null;
    
    // Definisi state
    this.states = {
      IDLE: { priority: 1 },
      WALK: { priority: 2 },
      INTERACTED: { priority: 5 },
      WAITING_TO_REDIRECT: { priority: 6 }
    };
    
    // Aturan transisi
    this.transitions = {
      'INIT': { to: 'WALK' },
      'IDLE': { 
        'TIMEOUT': { to: 'WALK' } 
      },
      'WALK': { 
        'TIMEOUT': { to: 'IDLE' } 
      },
      'INTERACTED': { 
        'TIMEOUT': { to: 'WAITING_TO_REDIRECT' },
        'REDIRECT_TIMER_EXPIRED': { to: 'REDIRECT' }
      },
      'WAITING_TO_REDIRECT': {
        'REDIRECT_TIMER_EXPIRED': { to: 'REDIRECT' }
      },
      'ANY': { 
        'DUCKY_CLICKED': { to: 'INTERACTED' }
      }
    };
  }

  transitionTo(newState, params = {}) {
    console.log(`Attempting to transition from ${this.currentState} to ${newState}`);

    // Hapus timeout sebelumnya jika ada
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    // Hapus redirect timeout jika ada
    if (this.redirectTimeoutId) {
      clearTimeout(this.redirectTimeoutId);
      this.redirectTimeoutId = null;
    }

    // Cek apakah transisi valid berdasarkan prioritas
    if (!this.canTransitionTo(newState)) {
      console.log(`Transition to ${newState} denied due to priority rules`);
      return false;
    }

    // Simpan state sebelumnya
    this.previousState = this.currentState;

    // Update state
    const oldState = this.currentState;
    this.currentState = newState;
    this.stateStartTime = Date.now();

    console.log(`State transitioned from ${oldState} to ${newState}`);

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
    console.log(`Handling state change from ${oldState} to ${newState}`);

    // Tangani efek samping perubahan state
    switch (newState) {
      case 'INTERACTED':
        // Tampilkan speech bubble saat state berubah ke INTERACTED
        console.log('Showing speech bubble with "what u want?"');
        this.ducky.speechBubble.show("what u want?");

        // Atur timer untuk mengganti bubble jika tidak ada interaksi
        this.timeoutId = setTimeout(() => {
          this.ducky.eventSystem.emit('TIMEOUT');
        }, 1000); // 1 detik sebelum mengganti bubble

        break;
      case 'WAITING_TO_REDIRECT':
        // Ganti bubble dengan pesan baru
        console.log('Changing bubble to "i will direct u to the chatbot"');
        this.ducky.speechBubble.updateText("i will direct u to the chatbot");

        // Atur timer untuk redirect
        this.redirectTimeoutId = setTimeout(() => {
          this.ducky.eventSystem.emit('REDIRECT_TIMER_EXPIRED');
        }, 1000); // 1 detik sebelum redirect

        break;
      case 'REDIRECT':
        // Lakukan redirect ke halaman chatbot
        console.log('Redirecting to chatbot page');
        window.location.href = 'index.html';
        break;
      case 'WALK':
        // Pastikan Ducky berjalan saat state WALK dan gunakan animasi walk.gif
        console.log('Entering WALK state');
        if (this.ducky.renderer) {
          this.ducky.renderer.startWalking();
          this.ducky.renderer.updateAnimation('WALK');
        }
        break;
      case 'IDLE':
        // Hentikan gerakan dan gunakan animasi idle.gif saat state IDLE
        console.log('Entering IDLE state');
        if (this.ducky.renderer) {
          this.ducky.renderer.stopWalking();
          this.ducky.renderer.updateAnimation('IDLE');
        }
        // Sembunyikan speech bubble saat kembali ke IDLE
        console.log('Hiding speech bubble');
        this.ducky.speechBubble.hide();
        break;
      default:
        // Untuk state lainnya, sembunyikan speech bubble
        console.log('Hiding speech bubble for other state');
        this.ducky.speechBubble.hide();
    }
  }

  scheduleTimeout(state) {
    let timeoutDuration = 0;

    // Tentukan durasi timeout berdasarkan state dengan nilai acak untuk perilaku alami
    switch (state) {
      case 'IDLE':
        // Ducky bisa idle antara 2-5 detik sebelum berjalan
        timeoutDuration = 2000 + Math.random() * 3000; // 2-5 detik
        console.log(`Scheduled timeout for IDLE state: ${timeoutDuration}ms`);
        break;
      case 'WALK':
        // Ducky bisa berjalan antara 3-5 detik sebelum idle
        timeoutDuration = 3000 + Math.random() * 2000; // 3-5 detik
        console.log(`Scheduled timeout for WALK state: ${timeoutDuration}ms`);
        break;
      default:
        console.log(`No timeout scheduled for state: ${state}`);
        return; // Tidak ada timeout untuk state ini
    }

    // Atur timeout
    if (timeoutDuration > 0) {
      this.timeoutId = setTimeout(() => {
        console.log(`Timeout expired for state: ${state}, emitting TIMEOUT event`);
        this.ducky.eventSystem.emit('TIMEOUT');
      }, timeoutDuration);
    }
  }

  getCurrentState() {
    return this.currentState;
  }

  getPreviousState() {
    return this.previousState;
  }
}

// DuckyRenderer.js
class DuckyRenderer {
  constructor(duckyEntity, container) {
    this.ducky = duckyEntity;
    this.container = container;
    this.element = duckyEntity.element;
    
    // Mapping state ke animasi
    this.animationMap = {
      'IDLE': 'idle.gif',
      'WALK': 'walk.gif',
      'INTERACTED': 'crouch.gif',
      'WAITING_TO_REDIRECT': 'crouch.gif'
    };
    
    // Posisi saat ini
    this.position = { x: 0, y: 0 };
    this.velocity = { x: 0, y: 0 };
    
    // Batas gerakan (berdasarkan garis tempat Ducky berjalan)
    this.bounds = {
      left: 0,
      right: container.clientWidth - (this.element.width || this.element.offsetWidth || 100),
      top: 0,
      bottom: 0
    };
    
    // Status apakah sedang berjalan
    this.isWalking = false;
    this.animationFrameId = null;
    
    // Inisialisasi posisi
    this.initializePosition();
  }

  initializePosition() {
    // Set posisi awal di tengah container
    const elementWidth = this.element.width || this.element.offsetWidth || 100;
    this.position.x = (this.container.clientWidth - elementWidth) / 2;

    // Ambil posisi garis tanah sebagai posisi Y
    const groundLine = document.getElementById('ground-line');
    if (groundLine) {
      const groundRect = groundLine.getBoundingClientRect();
      const containerRect = this.container.getBoundingClientRect();
      // Tempatkan Ducky tepat di atas garis
      this.position.y = groundRect.top - containerRect.top - (this.element.height || this.element.offsetHeight || 100);
    } else {
      // Fallback jika garis tidak ditemukan
      this.position.y = this.container.clientHeight - (this.element.height || this.element.offsetHeight || 100) - 20;
    }

    this.updateElementPosition();

    // Mulai dengan idle, bukan langsung berjalan
    // Gerakan akan dimulai saat state berubah ke WALK melalui state machine
  }

  updateAnimation(state) {
    console.log('Updating animation for state:', state);

    // Dapatkan nama file animasi berdasarkan state
    const animationFile = this.animationMap[state];

    if (animationFile) {
      console.log('Loading animation file:', animationFile);

      // Update src gambar
      const imagePath = `assets/Ducky/${animationFile}`;
      this.element.src = imagePath;

      // Set alt text
      this.element.alt = this.getAltTextForState(state);

      // Hentikan animasi sebelumnya jika perlu
      if (this.isWalking && state !== 'WALK') {
        console.log('Stopping walking animation');
        this.stopWalking();
      }

      // Mulai perilaku khusus untuk state tertentu
      if (state === 'WALK') {
        console.log('Starting walking animation');
        this.startWalking();
      } else if (state === 'IDLE') {
        console.log('Setting idle animation, stopping movement');
        // Jika state IDLE, pastikan tidak berjalan
        this.stopWalking();
      }
    }
  }

  getAltTextForState(state) {
    const altTexts = {
      'IDLE': 'Ducky idle',
      'WALK': 'Ducky walking',
      'INTERACTED': 'Ducky crouched after being clicked',
      'WAITING_TO_REDIRECT': 'Ducky waiting to redirect'
    };
    
    return altTexts[state] || 'Ducky';
  }

  startWalking() {
    if (this.isWalking) return;

    this.isWalking = true;

    // Set kecepatan dan arah acak untuk gerakan
    // Acak arah (kiri atau kanan) dan kecepatan
    const direction = Math.random() > 0.5 ? 1 : -1; // 1 untuk kanan, -1 untuk kiri
    const speed = 1 + Math.random() * 2; // Kecepatan antara 1-3
    this.velocity.x = direction * speed;

    // Mulai loop animasi
    this.animationLoop();
  }

  stopWalking() {
    this.isWalking = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  animationLoop() {
    if (!this.isWalking) return;

    // Update posisi
    this.position.x += this.velocity.x;

    // Cek batas dan pantulkan jika perlu
    if (this.position.x <= this.bounds.left || this.position.x >= this.bounds.right) {
      this.velocity.x = -this.velocity.x;
      this.position.x = Math.max(this.bounds.left, Math.min(this.bounds.right, this.position.x));
    }

    // Update posisi elemen
    this.updateElementPosition();

    // Balik gambar berdasarkan arah gerakan
    this.flipImageIfNeeded();

    // Lanjutkan loop
    this.animationFrameId = requestAnimationFrame(() => this.animationLoop());
  }

  updateElementPosition() {
    this.element.style.left = `${this.position.x}px`;
    this.element.style.top = `${this.position.y}px`;
  }

  flipImageIfNeeded() {
    // Balik gambar berdasarkan arah gerakan
    if (this.velocity.x > 0) {
      // Berjalan ke kanan - gambar normal
      this.element.style.transform = 'scaleX(1)';
    } else if (this.velocity.x < 0) {
      // Berjalan ke kiri - balik gambar
      this.element.style.transform = 'scaleX(-1)';
    }
  }

  updateBounds() {
    // Update batas gerakan berdasarkan ukuran container baru
    const elementWidth = this.element.width || this.element.offsetWidth || 100;
    this.bounds = {
      left: 0,
      right: this.container.clientWidth - elementWidth,
      top: 0,
      bottom: 0
    };
  }
}

// DuckySpeechBubble.js
class DuckySpeechBubble {
  constructor(duckyEntity, container) {
    this.ducky = duckyEntity;
    this.container = container;
    
    // Membuat elemen speech bubble
    this.element = document.getElementById('ducky-speech-bubble');
    
    if (!this.element) {
      this.element = document.createElement('div');
      this.element.id = 'ducky-speech-bubble';
      this.element.className = 'ducky-speech-bubble';
      
      // Tambahkan ke container
      this.container.appendChild(this.element);
    }
    
    // Tambahkan atribut aksesibilitas
    this.element.setAttribute('role', 'alert');
    this.element.setAttribute('aria-live', 'polite');
    this.element.setAttribute('aria-atomic', 'true');
  }

  show(text) {
    console.log(`Showing speech bubble with text: ${text}`);
    
    // Set teks
    this.element.textContent = text;
    
    // Tampilkan speech bubble
    this.element.style.display = 'block';
    
    // Update posisi
    this.updatePosition();
    
    // Pastikan elemen dapat diakses oleh assistive technology
    this.element.setAttribute('aria-hidden', 'false');
  }

  hide() {
    this.element.style.display = 'none';
    this.element.setAttribute('aria-hidden', 'true');
  }

  updatePosition() {
    // Dapatkan posisi Ducky
    const duckyRect = this.ducky.element.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();
    
    console.log('Ducky rect:', duckyRect);
    console.log('Container rect:', containerRect);
    
    // Hitung posisi speech bubble agar muncul di atas Ducky
    const bubbleTop = duckyRect.top - containerRect.top - (this.element.offsetHeight || 40) - 10;
    const bubbleLeft = duckyRect.left - containerRect.left + (duckyRect.width / 2) - ((this.element.offsetWidth || 150) / 2);
    
    // Pastikan bubble tidak keluar dari container
    const boundedLeft = Math.max(0, Math.min(bubbleLeft, containerRect.width - (this.element.offsetWidth || 150)));
    
    console.log(`Setting bubble position: top=${bubbleTop}px, left=${boundedLeft}px`);
    
    this.element.style.top = `${bubbleTop}px`;
    this.element.style.left = `${boundedLeft}px`;
  }

  // Metode untuk mengupdate teks tanpa mengubah visibilitas
  updateText(text) {
    console.log(`Updating speech bubble text to: ${text}`);
    this.element.textContent = text;
    
    // Update posisi karena ukuran mungkin berubah
    this.updatePosition();
  }
}

// DuckyEntity.js
class DuckyEntity {
  constructor(containerElement, options = {}) {
    // Entity Layer - representasi data dan state Ducky
    this.container = containerElement;
    this.options = {
      basePath: options.basePath || 'assets/Ducky/',
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

    // Inisialisasi awal komponen
    this.stateMachine = new DuckyStateMachine(this);
    this.eventSystem = new DuckyEventSystem(this);
    
    // Elemen visual utama
    this.element = null;
    
    // Inisialisasi
    this.init();
  }

  init() {
    // Membuat elemen visual
    this.createElement();

    // Inisialisasi komponen setelah elemen dibuat
    this.renderer = new DuckyRenderer(this, this.container);
    this.speechBubble = new DuckySpeechBubble(this, this.container);

    // Menginisialisasi event listener
    this.setupEventListeners();

    // Mengirim event INIT
    this.eventSystem.emit('INIT');

    // Pastikan state berubah ke WALK setelah inisialisasi
    setTimeout(() => {
      if (this.getCurrentState() !== 'WALK') {
        this.updateState('WALK');
      }
    }, 500); // Delay kecil agar state machine siap
  }

  createElement() {
    this.element = document.getElementById('ducky-animation'); // Gunakan elemen yang sudah ada
    
    if (!this.element) {
      // Jika elemen tidak ditemukan, buat baru
      this.element = document.createElement('img');
      this.element.id = 'ducky-animation';
      this.element.className = 'ducky-animation';
      
      // Tambahkan atribut aksesibilitas
      this.element.setAttribute('alt', 'Ducky - Interactive Character');
      this.element.setAttribute('role', 'img');
      this.element.setAttribute('aria-label', 'Ducky - Interactive Character');
      
      // Tambahkan title untuk informasi tambahan
      this.element.setAttribute('title', 'Interactive Ducky Character - Click to interact');
      
      // Tambahkan ke container
      this.container.appendChild(this.element);
    }
    
    // Menyesuaikan dengan preferensi motion
    if (this.prefersReducedMotion) {
      this.element.style.animation = 'none';
    }
  }

  setupEventListeners() {
    // Menambahkan event listener untuk klik
    this.element.addEventListener('click', () => {
      console.log('Ducky clicked!');
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

// Inisialisasi Ducky saat DOM siap
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('ducky-container');

  // Buat instance DuckyEntity
  const ducky = new DuckyEntity(container, {
    basePath: 'assets/Ducky/'
  });

  console.log('DuckyEntity initialized:', ducky);
  console.log('Initial state:', ducky.getCurrentState());
});