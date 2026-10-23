/**
 * AI helper menggunakan Groq (OpenAI-compatible API).
 * Dapatkan API key gratis di: https://console.groq.com/keys
 */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b";

export type AIMode =
  | "ringkas"
  | "flashcard"
  | "soal"
  | "cram"
  | "parafrase"
  | "outline";

function getApiKey(): string | null {
  const key = import.meta.env.VITE_GROQ_API_KEY;
  return key && key !== "your_key_here" ? key : null;
}

export function hasAIKey(): boolean {
  return !!getApiKey();
}

async function callGroq(system: string, user: string, maxTokens = 2048): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("NO_API_KEY");
  }

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.4,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "Tidak ada respons.";
}

const SYSTEM_PROMPTS: Record<AIMode, string> = {
  ringkas: `Kamu adalah asisten belajar untuk mahasiswa Indonesia.
Ringkas teks materi kuliah berikut dalam bahasa Indonesia yang jelas dan padat.
Tulis satu kalimat yang menangkap inti materi, lalu susun 3 sampai 6 poin utama berdasarkan gagasan (gabungkan detail yang saling berkaitan).
Gunakan bahasa yang natural dan mudah dipahami mahasiswa. Tebalkan hanya istilah atau konsep kunci dengan Markdown **tebal**. Hindari mengulang isi, kalimat pembuka yang generik, dan detail teknis yang tidak penting bagi inti materi. Jangan mengarang di luar teks.`,

  flashcard: `Kamu adalah asisten belajar untuk mahasiswa Indonesia.
Dari teks materi berikut, buat 5–8 flashcard (pertanyaan & jawaban singkat) dalam bahasa Indonesia.
Format WAJIB (satu kartu per blok):

DEAPAN: [pertanyaan singkat]
BELAKANG: [jawaban singkat]

Jangan tambah penjelasan lain di luar format itu.`,

  soal: `Kamu adalah asisten belajar untuk mahasiswa Indonesia.
Dari teks materi berikut, buat 5 soal pilihan ganda (A B C D) dalam bahasa Indonesia.
Format WAJIB:

1. [pertanyaan]
A. ...
B. ...
C. ...
D. ...
Jawaban: [huruf]

Jangan tambah teks di luar format itu.`,

  cram: `Kamu adalah tutor kilat untuk mahasiswa Indonesia yang akan ujian sebentar lagi.
Buat RENCANA BELAJAR CRAM berdasarkan materi yang diberikan.
Format WAJIB dalam bahasa Indonesia:

🔥 Mode Cram
Waktu total: (sesuaikan input user)

1. [menit] – Fokus: ...
   Poin wajib hafal: ...
2. ...
dst.

Di akhir:
⚠️ Jangan lewatkan: (3 poin paling penting)
✅ Cek cepat: (3 pertanyaan self-test singkat)

Hanya dari materi yang diberi. Jangan mengarang.`,

  parafrase: `Kamu membantu mahasiswa Indonesia merapikan tulisan.
Parafrase teks agar lebih jelas, TANPA mengubah makna.
Jangan menambah fakta baru. Jangan hanya ganti sinonim acak.
Output: teks hasil saja, bahasa Indonesia (istilah teknis boleh tetap).`,

  outline: `Kamu adalah perancang presentasi akademik yang membantu mahasiswa Indonesia.
Buat isi presentasi yang bernas, spesifik, dan siap dipindahkan ke slide. Hindari isi generik seperti "poin penting", "contoh", atau "kesimpulan" tanpa menjelaskan maksudnya.
Gunakan materi yang diberikan sebagai sumber utama. Kembangkan penjelasan agar mudah dipahami, tetapi jangan mengarang data, kutipan, atau fakta. Jika materi terlalu tipis, buat presentasi lebih singkat dan tandai bagian yang perlu dilengkapi.

Buat 8�12 slide sesuai banyaknya materi. Sertakan alur yang masuk akal: judul dan konteks, tujuan/pertanyaan utama, konsep atau pembahasan bertahap, contoh atau penerapan yang memang didukung materi, lalu kesimpulan. Tambahkan definisi istilah penting bila relevan.
Setiap slide pembahasan berisi 3�5 poin informatif. Tiap poin harus menyampaikan satu gagasan yang jelas (umumnya 1 kalimat), termasuk penjelasan, alasan, hubungan sebab-akibat, atau contoh spesifik dari materi. Hindari mengulang poin antarslide. Slide judul dan penutup boleh lebih ringkas.

Ikuti format ini persis agar bisa dibaca aplikasi:
Slide 1: Judul yang spesifik
- Konteks atau pengantar yang menjelaskan topik
- Tujuan presentasi

Slide 2: Judul bagian
- Gagasan lengkap dan spesifik
- Penjelasan atau bukti dari materi
- Contoh atau dampak yang relevan

Gunakan bahasa Indonesia yang jelas dan cocok untuk presentasi sekitar 8�12 menit. Keluarkan isi slide saja, tanpa pengantar atau catatan di luar format.`,
};

export async function generateAI(mode: AIMode, text: string): Promise<string> {
  const system = SYSTEM_PROMPTS[mode];
  const user = `Materi:\n\n${text.slice(0, 12000)}`;
  return callGroq(system, user, mode === "outline" ? 4096 : 2048);
}


export type ParafraseStyle = "natural" | "kasual" | "formal";

const PARAFRASE_STYLE: Record<ParafraseStyle, string> = {
  natural: `Gaya NATURAL (prioritas):
- Kurangi frasa klise AI seperti "penting untuk dicatat bahwa", "secara keseluruhan", "dalam era modern", "perlu digarisbawahi".
- Kalimat lebih langsung, variasi panjang kalimat, hindari pola terlalu rapi/simetris.
- Tetap jelas dan mudah dibaca mahasiswa. Jangan slang berlebihan.`,
  kasual: `Gaya KASUAL kuliah:
- Seperti menjelaskan ke teman sekelas: hangat, sederhana, tetap sopan.
- Boleh "kamu"/nada santai ringan, hindari bahasa chat kasar.
- Jangan terlalu kaku atau terkesan template.`,
  formal: `Gaya FORMAL akademik:
- Cocok laporan/makalah: baku, rapi, objektif.
- Hindari kata gaul; tetap jangan kaku berlebihan atau frasa AI klise.`,
};

/** Parafrase dengan pilihan gaya tulis */
export async function generateParafrase(
  text: string,
  style: ParafraseStyle = "natural"
): Promise<string> {
  const system = `${SYSTEM_PROMPTS.parafrase}

${PARAFRASE_STYLE[style]}

Aturan tambahan:
- Pertahankan makna dan poin penting.
- Jangan klaim ini untuk lolos deteksi AI/plagiasi.
- Output hanya teks hasil, tanpa pembuka/penutup meta.`;
  return callGroq(system, text.slice(0, 12000), 2048);
}

export async function generateCram(text: string, minutes: number): Promise<string> {
  const system = SYSTEM_PROMPTS.cram;
  const user = `Waktu tersedia: ${minutes} menit.\n\nMateri:\n\n${text.slice(0, 12000)}`;
  return callGroq(system, user, 2048);
}

export function parseFlashcards(raw: string): { front: string; back: string }[] {
  const cards: { front: string; back: string }[] = [];
  const blocks = raw.split(/DEAPAN\s*:/i).slice(1);
  for (const block of blocks) {
    const parts = block.split(/BELAKANG\s*:/i);
    if (parts.length >= 2) {
      const front = parts[0].trim().replace(/\n+/g, " ");
      const back = parts[1].split(/DEAPAN\s*:/i)[0].trim().replace(/\n+/g, " ");
      if (front && back) cards.push({ front, back });
    }
  }
  return cards;
}

/** Chat multi-turn: jawab HANYA dari materi konteks */
export async function chatWithContext(
  context: string,
  messages: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
  const apiKey = (import.meta.env.VITE_GROQ_API_KEY as string) || "";
  if (!apiKey || apiKey === "your_key_here") throw new Error("NO_API_KEY");

  const system = `Kamu asisten belajar mahasiswa Indonesia.
Jawab HANYA berdasarkan materi konteks di bawah. Jika tidak ada di materi, katakan: "Tidak ditemukan di materi yang diberikan."
Jangan mengarang di luar konteks. Bahasa jelas; boleh analogi sederhana jika diminta.
--- MATERI ---
${context.slice(0, 12000)}
--- AKHIR MATERI ---`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: system },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      temperature: 0.3,
      max_tokens: 1500,
    }),
  });
  if (!res.ok) throw new Error(`Groq error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "Tidak ada respons.";
}

export async function explainTerm(context: string, term: string): Promise<string> {
  return chatWithContext(context || "(tidak ada materi tambahan)", [
    {
      role: "user",
      content: `Jelaskan istilah/konsep ini singkat untuk mahasiswa: "${term}".${
        context.trim() ? " Utamakan arti sesuai materi konteks jika ada." : ""
      }`,
    },
  ]);
}

export async function generateStudyQuestions(context: string): Promise<string> {
  return callGroq(
    `Dari materi berikut, buat 10 pertanyaan esai singkat self-test mahasiswa Indonesia.
Format:
1. [pertanyaan]
2. ...
Jangan tulis kunci jawaban.`,
    context.slice(0, 10000),
    1500
  );
}

export async function gradeStudyAnswer(
  context: string,
  question: string,
  answer: string
): Promise<string> {
  return callGroq(
    `Kamu tutor. Nilai jawaban mahasiswa berdasarkan materi.
Beri: skor 1-10, apa yang benar, apa yang kurang, kunci singkat. Bahasa Indonesia.`,
    `Materi:\n${context.slice(0, 6000)}\n\nPertanyaan: ${question}\nJawaban mahasiswa: ${answer}`,
    1024
  );
}
