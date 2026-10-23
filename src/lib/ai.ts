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

async function callGroq(system: string, user: string): Promise<string> {
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
      max_tokens: 2048,
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
Gunakan format:
📌 Ringkasan
1. Poin penting pertama
2. Poin penting kedua
dst.
Maksimal 8 poin. Jangan mengarang di luar teks.`,

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

  parafrase: `Kamu membantu mahasiswa Indonesia merapikan tulisan akademik.
Parafrase teks berikut agar lebih jelas dan formal, TANPA mengubah makna.
Jangan menambah fakta baru. Jangan jadi plagiat-helper yang sekadar sinonim acak.
Output: versi yang sudah diperbaiki saja, dalam bahasa Indonesia (kecuali istilah teknis tetap).`,

  outline: `Kamu membantu mahasiswa Indonesia membuat outline presentasi / PowerPoint.
Dari materi berikut, buat outline slide dalam bahasa Indonesia.
Format:

Slide 1: Judul
- poin

Slide 2: ...
- poin

Maksimal 10 slide. Padat, cocok dibacakan 5–10 menit.`,
};

export async function generateAI(mode: AIMode, text: string): Promise<string> {
  const system = SYSTEM_PROMPTS[mode];
  const user = `Materi:\n\n${text.slice(0, 12000)}`;
  return callGroq(system, user);
}

export async function generateCram(text: string, minutes: number): Promise<string> {
  const system = SYSTEM_PROMPTS.cram;
  const user = `Waktu tersedia: ${minutes} menit.\n\nMateri:\n\n${text.slice(0, 12000)}`;
  return callGroq(system, user);
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
