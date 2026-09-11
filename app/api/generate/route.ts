import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { filtros } = await req.json();

    const message = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1000,
      messages: [{ role: "user", content: buildPrompt(filtros) }],
    });

    return NextResponse.json({ result: message.content });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al generar la actividad' }, { status: 500 });
  }
}

function buildPrompt(filtros: any) {
  return `Sugerí 3 actividades sin pantalla para un niño/a con estas características: ${JSON.stringify(filtros)}`;
}