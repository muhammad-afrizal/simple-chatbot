# Simple Chatbot with Google Gemini API Integration

## Deskripsi Proyek

Proyek ini merupakan implementasi dari tugas sesi 5: **AI Productivity and AI API Integration for Developers - Hacktiv8**. Ini adalah sebuah chatbot sederhana yang terintegrasi dengan API Google Gemini untuk menghasilkan respon otomatis terhadap pertanyaan pengguna.

## Fitur Utama

- Integrasi dengan Google Gemini API untuk memproses dan menghasilkan respon AI
- Antarmuka web yang sederhana dan fungsional
- Penyimpanan riwayat percakapan untuk konteks kontinu
- Implementasi API endpoint yang sesuai dengan spesifikasi

## Struktur Proyek

```
simple-chatbot/
├── .env
├── index.js (backend)
├── package.json
├── package-lock.json
└── public/
    ├── index.html
    ├── script.js (frontend)
    └── style.css
```

## Teknologi yang Digunakan

- Node.js
- Express.js
- Google GenAI SDK
- HTML5
- CSS3
- JavaScript (Vanilla)

## Instalasi

1. Clone atau download repository ini
2. Install dependensi dengan perintah:
   ```
   npm install
   ```
3. Buat file `.env` di root direktori dan tambahkan API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```
4. Jalankan server:
   ```
   node index.js
   ```
5. Buka browser dan akses `http://localhost:3000`

## Penggunaan

- Ketik pertanyaan Anda di kotak input
- Tekan tombol "Send" atau Enter untuk mengirim
- Tunggu respons dari chatbot AI
- Percakapan akan terus berjalan dengan konteks yang dipertahankan

## Endpoint API

- `POST /api/chat` - Mengirim pesan dan menerima respons dari model AI
  - Request body: `{ "conversation": [{ "role": "user", "text": "pesan pengguna" }] }`
  - Response: `{ "result": "respons dari AI" }`

## Tantangan dan Solusi

Selama pembuatan proyek ini, terdapat beberapa tantangan teknis yang dihadapi dan solusi yang diterapkan:

### 1. Akses Respons dari Google GenAI API
- **Masalah**: Kode awal mencoba mengakses `response.text` sebagai properti langsung, tetapi mengalami error `TypeError: responseText.substring is not a function`
- **Solusi**: Menyesuaikan struktur akses ke respons menjadi `result.candidates[0].content.parts[0].text` sesuai dengan format respons API

### 2. Perbedaan Role dalam Percakapan
- **Masalah**: Frontend menggunakan role `bot`, sementara GenAI API hanya menerima role `user` dan `model`, menyebabkan error `ApiError: "Please use a valid role: user, model"`
- **Solusi**: Melakukan mapping role dengan mengganti role `bot` menjadi `model` sebelum dikirim ke API

### 3. Pengiriman Pesan Berulang
- **Masalah**: Chatbot hanya bisa menerima satu kali pengiriman pesan, pengiriman kedua dan seterusnya selalu gagal
- **Solusi**: Setelah perbaikan struktur akses ke respons dan mapping role, chatbot dapat menerima pesan berulang kali dengan percakapan kontekstual yang berjalan dengan baik


## Tujuan Pembelajaran

- Memahami cara mengintegrasikan API pihak ketiga ke aplikasi web
- Menerapkan konsep full-stack development
- Menggunakan environment variables untuk menyimpan informasi sensitif
- Membangun antarmuka pengguna yang interaktif
- Mengatasi perbedaan format data antara frontend dan API