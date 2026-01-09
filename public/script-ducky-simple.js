/**
 * Simple Ducky Landing Page Implementation
 * 
 * Implements the landing page with Ducky character that moves along a line
 * and redirects to chatbot page after certain interactions or timeouts.
 */

// Simple Ducky State Machine
class SimpleDuckyStateMachine {
  constructor(duckyEntity) {
    this.ducky = duckyEntity;
    this.currentState = null;
    this.timeoutId = null;
    
    // Definisi state
    this.states = {
      IDLE: { priority: 1 },
      WALK: { priority: 2 },
      INTERACTED: { priority: 5 },
      WAITING_TO_REDIRECT: { priority: 6 }
    };
  }

  transitionTo(newState) {
    console.log(`Transitioning from ${this.currentState} to ${newState}`);
    
    // Hapus timeout sebelumnya
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    
    // Simpan state sebelumnya
    const oldState = this.currentState;
    this.currentState = newState;
    
    // Update animasi dan perilaku berdasarkan state
    this.ducky.updateForState(newState, oldState);
    
    // Atur timeout jika diperlukan
    this.scheduleTimeout(newState);
  }

  scheduleTimeout(state) {
    let timeoutDuration = 0;

    switch (state) {
      case 'IDLE':
        timeoutDuration = 2000 + Math.random() * 3000; // 2-5 detik
        break;
      case 'WALK':
        timeoutDuration = 3000 + Math.random() * 2000; // 3-5 detik
        break;
      default:
        return;
    }

    if (timeoutDuration > 0) {
      this.timeoutId = setTimeout(() => {
        console.log(`Timeout expired for ${state}, transitioning...`);
        if (state === 'WALK') {
          this.transitionTo('IDLE');
        } else if (state === 'IDLE') {
          this.transitionTo('WALK');
        }
      }, timeoutDuration);
    }
  }

  getCurrentState() {
    return this.currentState;
  }
}

// Simple Ducky Renderer
class SimpleDuckyRenderer {
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
    
    // Posisi dan gerakan
    this.position = { x: 0, y: 0 };
    this.velocity = { x: 0, y: 0 };
    this.isMoving = false;
    this.animationFrameId = null;
    
    // Batas gerakan
    this.bounds = {
      left: 0,
      right: container.clientWidth - (this.element.width || this.element.offsetWidth || 100)
    };
  }

  updateForState(newState, oldState) {
    // Ganti animasi
    const animationFile = this.animationMap[newState];
    if (animationFile) {
      const imagePath = `assets/Ducky/${animationFile}`;
      this.element.src = imagePath;
      this.element.alt = this.getAltTextForState(newState);
    }
    
    // Hentikan gerakan sebelumnya
    if (this.isMoving) {
      this.stopMoving();
    }
    
    // Mulai perilaku sesuai state
    if (newState === 'WALK') {
      this.startMoving();
    } else if (newState === 'INTERACTED' || newState === 'WAITING_TO_REDIRECT') {
      this.stopMoving();
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

  startMoving() {
    if (this.isMoving) return;

    this.isMoving = true;

    // Ganti ke animasi walk saat mulai bergerak
    const animationFile = this.animationMap[this.ducky.getCurrentState()];
    if (animationFile) {
      const imagePath = `assets/Ducky/walk.gif`; // Paksa gunakan walk.gif saat bergerak
      this.element.src = imagePath;
    }

    // Acak arah dan kecepatan
    const direction = Math.random() > 0.5 ? 1 : -1;
    const speed = 1 + Math.random() * 2;
    this.velocity.x = direction * speed;

    // Mulai loop gerakan
    this.moveLoop();
  }

  stopMoving() {
    this.isMoving = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.velocity.x = 0;

    // Ganti ke animasi idle saat berhenti
    const animationFile = this.animationMap[this.ducky.getCurrentState()];
    if (animationFile) {
      const imagePath = `assets/Ducky/idle.gif`; // Paksa gunakan idle.gif saat berhenti
      this.element.src = imagePath;
    }
  }

  moveLoop() {
    if (!this.isMoving) return;

    // Update posisi
    this.position.x += this.velocity.x;

    // Cek batas dan pantulkan
    if (this.position.x <= this.bounds.left || this.position.x >= this.bounds.right) {
      this.velocity.x = -this.velocity.x;
      this.position.x = Math.max(this.bounds.left, Math.min(this.bounds.right, this.position.x));

      // Saat mencapai ujung, acak kecepatan dan arah baru
      setTimeout(() => {
        if (this.isMoving) {
          const direction = Math.random() > 0.5 ? 1 : -1;
          const speed = 1 + Math.random() * 2;
          this.velocity.x = direction * speed;
        }
      }, 500); // Tunggu sebentar sebelum mengacak arah
    }

    // Secara acak, buat Ducky berhenti sejenak dan pilih arah baru
    if (Math.random() < 0.002) { // 0.2% chance per frame
      this.stopMoving();

      setTimeout(() => {
        if (this.isMoving) {
          // Pilih arah dan kecepatan baru secara acak
          const direction = Math.random() > 0.5 ? 1 : -1;
          const speed = 1 + Math.random() * 2;
          this.velocity.x = direction * speed;

          // Lanjutkan gerakan
          this.moveLoop();
        }
      }, 500 + Math.random() * 1000); // Berhenti antara 0.5-1.5 detik
      return; // Hentikan loop sementara
    }

    // Update posisi elemen
    this.updateElementPosition();

    // Balik gambar berdasarkan arah
    this.flipImageIfNeeded();

    // Lanjutkan loop
    this.animationFrameId = requestAnimationFrame(() => this.moveLoop());
  }

  updateElementPosition() {
    this.element.style.left = `${this.position.x}px`;
  }

  flipImageIfNeeded() {
    if (this.velocity.x > 0) {
      // Berjalan ke kanan - gambar normal
      this.element.style.transform = 'scaleX(1)';
    } else if (this.velocity.x < 0) {
      // Berjalan ke kiri - balik gambar
      this.element.style.transform = 'scaleX(-1)';
    }
  }

  initializePosition() {
    const elementWidth = this.element.width || this.element.offsetWidth || 100;
    this.position.x = (this.container.clientWidth - elementWidth) / 2;
    
    // Ambil posisi garis tanah
    const groundLine = document.getElementById('ground-line');
    if (groundLine) {
      const groundRect = groundLine.getBoundingClientRect();
      const containerRect = this.container.getBoundingClientRect();
      this.position.y = groundRect.top - containerRect.top - (this.element.height || this.element.offsetHeight || 100);
    } else {
      this.position.y = this.container.clientHeight - (this.element.height || this.element.offsetHeight || 100) - 20;
    }
    
    this.updateElementPosition();
    this.element.style.top = `${this.position.y}px`;
  }
}

// Simple Ducky Speech Bubble
class SimpleDuckySpeechBubble {
  constructor(container) {
    this.element = document.getElementById('ducky-speech-bubble');
    this.container = container;
  }

  show(text) {
    this.element.textContent = text;
    this.element.style.display = 'block';
    this.updatePosition();
  }

  hide() {
    this.element.style.display = 'none';
  }

  updatePosition() {
    const duckyElement = document.getElementById('ducky-animation');
    if (duckyElement) {
      const duckyRect = duckyElement.getBoundingClientRect();
      const containerRect = this.container.getBoundingClientRect();
      
      const bubbleTop = duckyRect.top - containerRect.top - (this.element.offsetHeight || 40) - 10;
      const bubbleLeft = duckyRect.left - containerRect.left + (duckyRect.width / 2) - ((this.element.offsetWidth || 150) / 2);
      
      const boundedLeft = Math.max(0, Math.min(bubbleLeft, containerRect.width - (this.element.offsetWidth || 150)));
      
      this.element.style.top = `${bubbleTop}px`;
      this.element.style.left = `${boundedLeft}px`;
    }
  }

  updateText(text) {
    this.element.textContent = text;
    this.updatePosition();
  }
}

// Simple Ducky Entity
class SimpleDuckyEntity {
  constructor(containerElement) {
    this.container = containerElement;
    this.element = document.getElementById('ducky-animation');
    this.stateMachine = new SimpleDuckyStateMachine(this);
    this.renderer = new SimpleDuckyRenderer(this, this.container);
    this.speechBubble = new SimpleDuckySpeechBubble(this.container);
    
    this.redirectTimeoutId = null;
    
    this.init();
  }

  init() {
    // Set posisi awal
    this.renderer.initializePosition();
    
    // Tambahkan event listener
    this.element.addEventListener('click', () => {
      console.log('Ducky clicked!');
      this.handleInteraction();
    });
    
    // Mulai dengan state WALK
    setTimeout(() => {
      this.stateMachine.transitionTo('WALK');
    }, 100);
  }

  updateForState(newState, oldState) {
    this.renderer.updateForState(newState, oldState);
    
    switch (newState) {
      case 'INTERACTED':
        this.speechBubble.show("what u want?");
        
        // Ganti bubble setelah 1 detik jika tidak ada interaksi
        setTimeout(() => {
          if (this.stateMachine.getCurrentState() === 'INTERACTED') {
            this.stateMachine.transitionTo('WAITING_TO_REDIRECT');
          }
        }, 1000);
        break;
        
      case 'WAITING_TO_REDIRECT':
        this.speechBubble.updateText("i will direct u to the chatbot");

        // Tampilkan customer service widget setelah 1 detik
        this.redirectTimeoutId = setTimeout(() => {
          if (window.showCustomerService) {
            window.showCustomerService();
          }
          // Sembunyikan speech bubble
          this.speechBubble.hide();
        }, 1000);
        break;
        
      case 'IDLE':
      case 'WALK':
        this.speechBubble.hide();
        break;
    }
  }

  handleInteraction() {
    console.log('Handling interaction, current state:', this.stateMachine.getCurrentState());
    if (this.stateMachine.getCurrentState() !== 'INTERACTED') {
      this.stateMachine.transitionTo('INTERACTED');
    }
  }

  getCurrentState() {
    return this.stateMachine.getCurrentState();
  }
}

// Inisialisasi Ducky saat DOM siap
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('ducky-container');
  
  // Buat instance SimpleDuckyEntity
  const ducky = new SimpleDuckyEntity(container);
  
  console.log('Simple DuckyEntity initialized');
});