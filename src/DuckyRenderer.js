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
      'THINKING': 'roll_1.gif',
      'ERROR': 'duckee_death.gif'
    };
    
    // Posisi saat ini
    this.position = { x: 0, y: 0 };
    this.velocity = { x: 0, y: 0 };
    
    // Batas gerakan
    this.bounds = {
      left: 0,
      right: container.clientWidth - this.element.width,
      top: 0,
      bottom: container.clientHeight - this.element.height
    };
    
    // Status apakah sedang berjalan
    this.isWalking = false;
    this.animationFrameId = null;
    
    // Inisialisasi posisi
    this.initializePosition();
  }

  initializePosition() {
    // Set posisi awal di tengah container
    this.position.x = (this.container.clientWidth - this.element.width) / 2;
    this.position.y = (this.container.clientHeight - this.element.height) / 2;
    this.updateElementPosition();
  }

  updateAnimation(state) {
    // Hentikan animasi sebelumnya jika perlu
    if (this.isWalking) {
      this.stopWalking();
    }
    
    // Dapatkan nama file animasi berdasarkan state
    const animationFile = this.animationMap[state];
    
    if (animationFile) {
      // Update src gambar
      const imagePath = this.ducky.options.basePath + animationFile;
      this.element.src = imagePath;
      
      // Set alt text
      this.element.alt = this.getAltTextForState(state);
      
      // Mulai perilaku khusus untuk state tertentu
      if (state === 'WALK') {
        this.startWalking();
      } else if (state === 'INTERACTED') {
        // Untuk animasi INTERACTED, kita tidak loop karena hanya sekali
        this.handleNonLoopingAnimation();
      }
    }
  }

  getAltTextForState(state) {
    const altTexts = {
      'IDLE': 'Ducky idle',
      'WALK': 'Ducky walking',
      'INTERACTED': 'Ducky crouched after being clicked',
      'THINKING': 'Ducky thinking',
      'ERROR': 'Ducky error'
    };
    
    return altTexts[state] || 'Ducky';
  }

  startWalking() {
    if (this.isWalking) return;
    
    this.isWalking = true;
    
    // Set kecepatan acak untuk gerakan
    this.velocity.x = (Math.random() > 0.5 ? 1 : -1) * (0.5 + Math.random() * 1.5);
    
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
    
    // Lanjutkan loop
    this.animationFrameId = requestAnimationFrame(() => this.animationLoop());
  }

  updateElementPosition() {
    this.element.style.left = `${this.position.x}px`;
    this.element.style.top = `${this.position.y}px`;
  }

  handleNonLoopingAnimation() {
    // Untuk animasi yang tidak loop, kita perlu mendeteksi saat animasi selesai
    // Karena GIF tidak memberikan event khusus saat selesai, kita gunakan timeout
    setTimeout(() => {
      // Setelah animasi selesai, kembali ke state sebelumnya atau IDLE
      if (this.ducky.getCurrentState() === 'INTERACTED') {
        this.ducky.eventSystem.emit('TIMEOUT');
      }
    }, 1500); // Sesuaikan dengan durasi animasi crouch.gif
  }

  updateBounds() {
    // Update batas gerakan berdasarkan ukuran container baru
    this.bounds = {
      left: 0,
      right: this.container.clientWidth - this.element.width,
      top: 0,
      bottom: this.container.clientHeight - this.element.height
    };
  }
}