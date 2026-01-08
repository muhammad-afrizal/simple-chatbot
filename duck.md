# Dokumentasi Sistem Ducky: State-driven Animated Entity with Event-based Reactions

## 1. Pendahuluan

Dokumen ini menjelaskan rancangan sistem Ducky sebagai entitas animasi berbasis state dengan reaksi berbasis event. Sistem ini dirancang untuk memberikan pengalaman interaktif yang lebih hidup dan responsif dalam chatbot.

## 2. Konsep Dasar

### 2.1 Ducky sebagai Entitas
Ducky bukan hanya sekumpulan animasi yang diganti-ganti, tetapi sebuah entitas dengan karakteristik berikut:
- Memiliki state internal yang menentukan perilakunya
- Dapat merespons terhadap event-event tertentu
- Memiliki siklus hidup dan perilaku yang konsisten
- Dapat berinteraksi dengan lingkungan chatbot

### 2.2 State-driven Approach
Sistem Ducky beroperasi berdasarkan state machine yang terstruktur:
- Setiap state memiliki durasi dan perilaku tertentu
- Transisi antar state mengikuti aturan dan prioritas tertentu
- State menentukan animasi dan perilaku visual yang ditampilkan

### 2.3 Event-based Reactions
Entitas Ducky merespons terhadap berbagai event:
- Event dari pengguna (mengetik, mengirim pesan)
- Event dari sistem (respon API, error)
- Event waktu (timeout, durasi tertentu)
- Event kontekstual (isi pesan, mood percakapan)

### 2.4 Physics-lite Loop
Loop sederhana yang memberikan gerakan dan kehidupan pada Ducky:
- Simulasi sederhana dari fisika untuk gerakan yang lebih alami
- Memberikan sensasi bahwa Ducky adalah entitas yang hidup
- Tidak kompleks seperti fisika penuh, tetapi memberikan efek yang realistis

## 3. Arsitektur Sistem

### 3.1 Struktur Entitas Ducky
```javascript
class DuckyEntity {
  constructor() {
    this.state = new EntityState();      // State internal
    this.animation = new Animation();     // Representasi visual
    this.physics = new PhysicsLite();     // Simulasi gerakan
    this.eventHandler = new EventHandler(); // Penanganan event
  }
}
```

### 3.2 Komponen Utama

#### 3.2.1 EntityState
- Menyimpan state saat ini (IDLE, LISTENING, PROCESSING, dll)
- Menyimpan metadata state (durasi, parameter, dll)
- Menangani transisi state berdasarkan aturan

#### 3.2.2 Animation
- Menyimpan dan mengelola animasi saat ini
- Menangani transisi animasi yang halus
- Mengelola durasi dan loop animasi

#### 3.2.3 PhysicsLite
- Simulasi sederhana dari gerakan (bounce, sway, float)
- Memberikan efek natural pada animasi
- Tidak berat secara komputasi

#### 3.2.4 EventHandler
- Menangani event masuk
- Menentukan reaksi berdasarkan event
- Memfasilitasi komunikasi antar komponen

## 4. State Machine Ducky

### 4.1 Daftar State
| State | Prioritas | Deskripsi | Durasi |
|-------|-----------|-----------|---------|
| IDLE | 1 | Tidak ada aktivitas | Tak terbatas |
| LISTENING | 4 | Pengguna mengetik | Maks 30s |
| PROCESSING | 2 | Menunggu API | Maks timeout |
| RESPONDING | 3 | Menampilkan respon | 1.5-2s |
| ERROR | 5 | Kesalahan sistem | 2s |
| SURPRISE | 6 | Reaksi terhadap event tak terduga | 1.5s |
| HAPPY | 3 | Respon positif | 1.5s |
| CONFUSED | 3 | Respon terhadap input ambigu | 2s |
| EXCITED | 4 | Respon terhadap input menarik | 2s |

### 4.2 Aturan Transisi
1. State dengan prioritas lebih tinggi dapat menggantikan state dengan prioritas lebih rendah
2. State dengan prioritas sama tidak menggantikan kecuali kondisi tertentu terpenuhi
3. Setiap state memiliki durasi minimum sebelum bisa diganti
4. Transisi harus smooth dan tidak menyebabkan flickering

### 4.3 Implementasi State
```javascript
class EntityState {
  constructor() {
    this.currentState = DuckyState.IDLE;
    this.previousState = null;
    this.stateStartTime = Date.now();
    this.stateDuration = 0;
  }
  
  transitionTo(newState, params = {}) {
    if (this.canTransitionTo(newState)) {
      this.previousState = this.currentState;
      this.currentState = newState;
      this.stateStartTime = Date.now();
      this.onStateChange(newState, params);
    }
  }
  
  canTransitionTo(newState) {
    // Implementasi logika prioritas dan durasi minimum
  }
}
```

## 5. Event System

### 5.1 Jenis Event
| Event | Trigger | Reaksi Ducky |
|-------|---------|--------------|
| USER_TYPING_START | Pengguna mulai mengetik | LISTENING state |
| USER_TYPING_STOP | Pengguna berhenti mengetik | Kembali ke IDLE jika perlu |
| MESSAGE_SENT | Pengguna mengirim pesan | TRANSITION ke PROCESSING |
| API_RESPONSE | Respon API diterima | RESPONDING state |
| API_ERROR | Error API | ERROR state |
| CONTEXT_POSITIVE | Kata kunci positif | HAPPY state |
| CONTEXT_NEGATIVE | Kata kunci negatif | CONFUSED atau SAD state |
| CONTEXT_QUESTION | Pertanyaan | ATTENTION state |
| CONTEXT_SURPRISE | Kata kunci kejutan | SURPRISE state |

### 5.2 Event Handler
```javascript
class EventHandler {
  constructor(duckyEntity) {
    this.ducky = duckyEntity;
    this.eventQueue = [];
  }
  
  handleEvent(eventType, eventData) {
    switch(eventType) {
      case 'USER_TYPING_START':
        this.ducky.state.transitionTo(DuckyState.LISTENING);
        break;
      case 'MESSAGE_SENT':
        this.ducky.state.transitionTo(DuckyState.PROCESSING);
        break;
      // ... implementasi lainnya
    }
  }
}
```

## 6. Physics-lite Implementation

### 6.1 Konsep Physics-lite
Sistem ini memberikan efek gerakan alami tanpa simulasi fisika penuh:
- Gerakan bounce ringan saat idle
- Efek sway saat listening
- Float halus saat processing
- Gerakan cepat saat excited

### 6.2 Implementasi
```javascript
class PhysicsLite {
  constructor(element) {
    this.element = element;
    this.position = { x: 0, y: 0 };
    this.velocity = { x: 0, y: 0 };
    this.acceleration = { x: 0, y: 0 };
    this.bounceFactor = 0.7;
    this.swayIntensity = 0.5;
  }
  
  update(state, deltaTime) {
    switch(state) {
      case 'IDLE':
        this.applyIdlePhysics(deltaTime);
        break;
      case 'LISTENING':
        this.applyListeningPhysics(deltaTime);
        break;
      // ... implementasi lainnya
    }
  }
  
  applyIdlePhysics(deltaTime) {
    // Efek bounce ringan
    this.velocity.y += 0.01;
    this.position.y += this.velocity.y * deltaTime;
    
    if (this.position.y > 0) {
      this.position.y = 0;
      this.velocity.y *= -this.bounceFactor;
    }
  }
}
```

## 7. Integrasi dengan Chatbot

### 7.1 Event Binding
```javascript
// Binding event dari chatbot ke Ducky
chatForm.addEventListener('submit', () => {
  ducky.eventHandler.handleEvent('MESSAGE_SENT');
});

userInput.addEventListener('input', () => {
  if (userInput.value.length > 0) {
    ducky.eventHandler.handleEvent('USER_TYPING_START');
  }
});
```

### 7.2 State Sync
- Ducky state selalu sinkron dengan state chatbot
- Perubahan state chatbot memicu perubahan state Ducky
- Ducky tidak mengontrol chatbot, hanya merespons

## 8. Lifecycle Management

### 8.1 Initialization
1. Buat instance DuckyEntity
2. Inisialisasi semua komponen
3. Set state awal ke IDLE
4. Mulai event listeners
5. Jalankan physics loop

### 8.2 Runtime
1. Event handler menerima event
2. State machine menentukan transisi
3. Physics engine memperbarui posisi
4. Animation system memperbarui visual
5. Loop terus berjalan

### 8.3 Cleanup
1. Hentikan event listeners
2. Hentikan physics loop
3. Bersihkan resources
4. Reset state

## 9. Optimasi dan Performa

### 9.1 Render Optimization
- Gunakan requestAnimationFrame untuk physics loop
- Batch update animasi
- Gunakan CSS transforms daripada perubahan layout

### 9.2 Memory Management
- Bersihkan event listeners saat tidak digunakan
- Gunakan object pooling untuk efek sementara
- Optimalkan preload animasi

### 9.3 Responsiveness
- Prioritaskan event penting
- Gunakan debounce untuk event yang sering
- Minimalisir blocking operations

## 10. Testing dan Debugging

### 10.1 Unit Testing
- Testing untuk state transitions
- Testing untuk event handling
- Testing untuk physics calculations

### 10.2 Integration Testing
- Testing integrasi dengan chatbot
- Testing respon terhadap berbagai event
- Testing edge cases dan error conditions

### 10.3 Debug Tools
- Visual debugging tools untuk state
- Logging sistem event
- Performance monitoring

## 11. Ekstensibilitas

### 11.1 Plugin Architecture
- Sistem event yang dapat diextend
- State baru dapat ditambahkan dengan mudah
- Physics behavior dapat disesuaikan

### 11.2 Configuration
- Parameter dapat dikonfigurasi (kecepatan, intensitas, dll)
- Theme dan skin dapat diganti
- Behavior dapat diadjust tanpa merubah core logic

## 12. Kesimpulan

Sistem Ducky sebagai state-driven animated entity with event-based reactions memberikan:
- Pengalaman pengguna yang lebih hidup dan interaktif
- Arsitektur yang modular dan dapat diskalakan
- Performa yang baik dengan efek visual yang menarik
- Kemudahan dalam pengembangan dan perawatan

Implementasi sistem ini akan membuat Ducky bukan hanya sebagai dekorasi visual, tetapi sebagai entitas yang benar-benar berkontribusi pada pengalaman berinteraksi dengan chatbot.