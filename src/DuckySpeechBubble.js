// DuckySpeechBubble.js
class DuckySpeechBubble {
  constructor(duckyEntity, container) {
    this.ducky = duckyEntity;
    this.container = container;
    
    // Membuat elemen speech bubble
    this.element = document.createElement('div');
    this.element.className = 'ducky-speech-bubble';
    this.element.style.cssText = `
      position: absolute;
      background-color: white;
      border: 2px solid #333;
      border-radius: 10px;
      padding: 8px 12px;
      font-family: Arial, sans-serif;
      font-size: 14px;
      color: #333;
      z-index: 1001;
      min-width: 80px;
      text-align: center;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
      display: none;
      max-width: 150px;
    `;
    
    // Membuat segitiga speech bubble
    this.tail = document.createElement('div');
    this.tail.style.cssText = `
      position: absolute;
      width: 0;
      height: 0;
      border-left: 8px solid transparent;
      border-right: 8px solid transparent;
      border-top: 8px solid #fff;
      bottom: -8px;
      left: 50%;
      transform: translateX(-50%);
    `;
    
    // Tambahkan atribut aksesibilitas
    this.element.setAttribute('role', 'alert');
    this.element.setAttribute('aria-live', 'polite');
    this.element.setAttribute('aria-atomic', 'true');
    
    this.element.appendChild(this.tail);
    this.container.appendChild(this.element);
  }

  show(text) {
    // Set teks
    this.element.textContent = text;
    
    // Tambahkan tail kembali karena textContent akan menghapusnya
    this.element.appendChild(this.tail);
    
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
    
    // Hitung posisi speech bubble agar muncul di atas Ducky
    const bubbleTop = duckyRect.top - containerRect.top - this.element.offsetHeight - 10;
    const bubbleLeft = duckyRect.left - containerRect.left + (duckyRect.width / 2) - (this.element.offsetWidth / 2);
    
    // Pastikan bubble tidak keluar dari container
    const boundedLeft = Math.max(0, Math.min(bubbleLeft, containerRect.width - this.element.offsetWidth));
    
    this.element.style.top = `${bubbleTop}px`;
    this.element.style.left = `${boundedLeft}px`;
    
    // Update posisi tail
    const tailOffset = bubbleLeft - boundedLeft;
    this.tail.style.left = `calc(50% + ${tailOffset}px)`;
  }

  // Metode untuk mengupdate teks tanpa mengubah visibilitas
  updateText(text) {
    this.element.textContent = text;
    
    // Tambahkan tail kembali
    this.element.appendChild(this.tail);
  }
}