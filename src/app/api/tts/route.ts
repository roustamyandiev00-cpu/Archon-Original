import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import {
  NOVA_TTS_FORMAT,
  NOVA_TTS_MODEL,
  NOVA_VOICE_ID,
} from "@/lib/speech/constants";

export const runtime = "nodejs";

const MAX_CHARS = 1200;

export async function POST(request: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "ElevenLabs API-sleutel ontbreekt." },
      { status: 503 },
    );
  }

  let body: { text?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Ongeldige aanvraag." }, { status: 400 });
  }

  const text = body.text?.trim();
  if (!text) {
    return Response.json({ error: "Geen tekst opgegeven." }, { status: 400 });
  }
  if (text.length > MAX_CHARS) {
    return Response.json({ error: "Tekst is te lang." }, { status: 400 });
  }

  const client = new ElevenLabsClient({ apiKey });
  const audio = await client.textToSpeech.convert(NOVA_VOICE_ID, {
    text,
    modelId: NOVA_TTS_MODEL,
    outputFormat: NOVA_TTS_FORMAT,
  });

  return new Response(audio, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "private, no-store",
    },
  });
}
