  Dalam implementasi saat ini, Ducky adalah:
   - Entitas Visual Sederhana: Berupa elemen gambar yang berubah-ubah sesuai state
   - State-driven: Animasi berubah berdasarkan state (IDLE, LISTENING, PROCESSING, RESPONDING, ERROR)
   - Reaksi Kontekstual: Memilih animasi berdasarkan isi pesan (positif, negatif, pertanyaan, dll)
   - Event-triggered: Merespons event seperti pengguna mengetik atau mengirim pesan
   - Tanpa Fisika: Hanya animasi statis yang diganti-ganti

  Implementasi Saat Ini:
   - Menggunakan file GIF untuk setiap animasi
   - Sistem state machine sederhana dengan prioritas
   - Transisi animasi dengan efek fade
   - Tidak ada gerakan "live" atau simulasi fisika

  -----------------------------------------------

  Konsep Ideal: "State-driven Animated Entity with Event-based Reactions & Physics-lite Loop"

  Dalam rencana pengembangan, Ducky akan menjadi:
   - Entitas Penuh: Bukan hanya gambar, tapi entitas dengan perilaku kompleks
   - State-driven: Memiliki state internal yang menentukan perilaku
   - Event-based Reactions: Merespons berbagai event dengan cara yang konsisten
   - Physics-lite Loop: Simulasi gerakan sederhana untuk efek natural
   - Interaktif: Memiliki "kehidupan" di dalam animasi

  Implementasi Rencana:
   - Kelas DuckyEntity dengan komponen: EntityState, Animation, PhysicsLite, EventHandler
   - Loop fisika sederhana untuk gerakan natural (bounce, sway, float)
   - Event system yang lebih kompleks
   - Spritesheets untuk kontrol animasi yang lebih halus
   - Simulasi perilaku yang lebih "hidup"

  Perbedaan Utama:


  ┌────────────────┬─────────────────────────────┬─────────────────────────────────────┐
  │ Aspek          │ Saat Ini                    │ Rencana                             │
  ├────────────────┼─────────────────────────────┼─────────────────────────────────────┤
  │ Nature         │ Animasi statis yang diganti │ Entitas dengan perilaku             │
  │ Physics        │ Tidak ada                   │ Ada simulasi sederhana              │
  │ Interaktivitas │ Reaksi sederhana            │ Reaksi kompleks terhadap event      │
  │ Asset          │ GIF saja                    │ GIF + Spritesheets                  │
  │ Kehidupan      │ Tidak ada "kehidupan"       │ Ada "kehidupan" dalam animasi       │
  │ Kompleksitas   │ Sederhana                   │ Lebih kompleks tapi lebih realistis │
  └────────────────┴─────────────────────────────┴─────────────────────────────────────┘


  Dengan kata lain, saat ini Ducky adalah "animasi yang diganti-ganti", sedangkan dalam rencana, Ducky akan   
  menjadi "entitas hidup" yang memiliki perilaku dan respons yang lebih kompleks dan natural.