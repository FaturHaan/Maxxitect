import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const API_KEY = Deno.env.get('GEMINI_API_KEY');

const SYSTEM_INSTRUCTION = "Anda adalah ahli agronomi. Tugas Anda adalah menganalisis foto dan/atau teks keluhan petani. DILARANG merekomendasikan obat/merek apapun. Anda hanya boleh mengidentifikasi nama penyakit, hama, atau defisiensi nutrisinya. Kembalikan respons murni dalam format JSON seperti ini: {\"penyakit\": \"Nama Penyakit/Hama\", \"penjelasan\": \"Penjelasan singkat 1-2 kalimat\"} tanpa blok kode markdown (```json).";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!API_KEY) {
      throw new Error("API Key tidak ditemukan di environment server.");
    }

    const { text, base64Image, mimeType = 'image/jpeg', model = 'gemini-3.5-flash-lite' } = await req.json();

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

    const parts = [];
    
    if (text && text.trim() !== '') {
      parts.push({ text: text });
    } else if (!base64Image) {
      throw new Error("Mohon masukkan gambar atau deskripsi gejala terlebih dahulu.");
    } else {
      parts.push({ text: "Tolong analisis penyakit atau hama pada tanaman di foto ini." });
    }

    if (base64Image) {
      parts.push({
        inline_data: {
          mime_type: mimeType,
          data: base64Image
        }
      });
    }

    const payload = {
      system_instruction: {
        parts: [
          { text: SYSTEM_INSTRUCTION }
        ]
      },
      contents: [
        {
          parts: parts
        }
      ],
      generationConfig: {
        responseMimeType: "application/json"
      }
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.text();
      return new Response(JSON.stringify({ error: `Gagal memanggil Google API: ${response.status}`, details: errorData, status: response.status }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    const aiText = data.candidates[0].content.parts[0].text;
    
    return new Response(JSON.stringify({ result: aiText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
