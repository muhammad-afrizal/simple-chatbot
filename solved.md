# Solusi Masalah Chatbot Tidak Bisa Berulang Kali Mengirim Pesan

## Masalah yang Terjadi
Chatbot hanya bisa menerima satu kali pengiriman pesan (post), dan pengiriman kedua dan seterusnya selalu gagal dengan error "Failed to get response from server".

## Penyebab Masalah
Setelah menganalisis log secara mendalam, ditemukan dua masalah utama:

### 1. Struktur Akses ke Respons GenAI
- **Masalah**: Kode awal mencoba mengakses `response.text` sebagai properti langsung
- **Fakta**: Respons dari Google GenAI API memiliki struktur yang berbeda, yaitu teks berada di `result.candidates[0].content.parts[0].text`
- **Error**: `TypeError: responseText.substring is not a function`

### 2. Perbedaan Role dalam Percakapan
- **Masalah**: Frontend mengirimkan role `bot`, sedangkan GenAI API hanya menerima role `user` dan `model`
- **Fakta**: API GenAI mengharapkan role `user` dan `model`, bukan `bot`
- **Error**: `ApiError: {"error":{"code":400,"message":"Please use a valid role: user, model.","status":"INVALID_ARGUMENT"}}`

## Solusi yang Diterapkan

### 1. Perbaikan Akses ke Respons GenAI
Mengganti cara mengakses teks dari respons menjadi:
```javascript
let responseText;
if (result.candidates && result.candidates.length > 0) {
    const candidate = result.candidates[0];
    if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        const part = candidate.content.parts[0];
        if (part.text) {
            responseText = part.text;
        }
    }
}
```

### 2. Perbaikan Mapping Role
Mengganti mapping role dalam konversasi dari:
```javascript
const contents = conversation.map(({ role, text }) => ({
    role,
    parts: [{ text }]
}));
```

Menjadi:
```javascript
const contents = conversation.map(({ role, text }) => ({
    role: role === 'bot' ? 'model' : role,  // Ganti 'bot' menjadi 'model' agar sesuai dengan API GenAI
    parts: [{ text }]
}));
```

## Hasil
Setelah implementasi solusi:
- Chatbot dapat menerima pesan berulang kali tanpa error
- Percakapan kontekstual berjalan dengan baik
- Backend dapat mengakses respons GenAI dengan benar
- Mapping role sesuai dengan ekspektasi API GenAI

## Kesimpulan
Masalah utama terletak pada ketidaksesuaian struktur data antara frontend dan ekspektasi API GenAI, khususnya dalam hal struktur respons dan role yang digunakan dalam percakapan.