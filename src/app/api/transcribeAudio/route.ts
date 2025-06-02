import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // For now, return a placeholder message since we're using browser-based transcription
    // The actual transcription will happen in the browser using Web Speech API
    return NextResponse.json({ 
      text: "Browser-based transcription will be implemented in the frontend",
      error: "Please implement browser-based transcription"
    }, { status: 400 });

  } catch (error) {
    console.error('Error processing audio:', error);
    return NextResponse.json({ error: 'Failed to process audio' }, { status: 500 });
  }
} 