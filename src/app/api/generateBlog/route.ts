import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { transcript } = await request.json();
    console.log('Received transcript:', transcript);
    
    if (!transcript || transcript.trim() === '') {
      return NextResponse.json({ error: 'No transcript provided' }, { status: 400 });
    }

    const prompt = `You are a professional content writer and blogger. Transform this voice journal entry into a beautifully formatted, engaging blog post.

Voice Journal Text: "${transcript}"

Create a well-structured blog post with proper markdown formatting:

REQUIREMENTS:
- Start with an engaging **H1 title** using # 
- Use **H2 sections** (##) to organize content logically
- Use **bold text** (**text**) for key points and emphasis
- Use *italic text* (*text*) for personal thoughts and reflections
- Add **H3 subsections** (###) when needed for detailed points
- Create **bullet points** when listing ideas or achievements
- Write in a **conversational, engaging tone**
- Make it **inspirational and relatable**
- Ensure **smooth flow** between paragraphs
- Add **compelling subheadings** that draw readers in

FORMAT EXAMPLE:
# [Engaging Title]

## [Section 1]
Opening paragraph with **key points** and *personal insights*.

## [Section 2] 
### [Subsection if needed]
- Bullet point 1
- Bullet point 2

**Bold statement or key takeaway**

*Reflective italic text about lessons learned*

TONE: Personal, inspiring, and professional. Make it feel like a story worth reading.`;

    const azureUrl = `${process.env.AZURE_OPENAI_BASE_URL}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}/chat/completions?api-version=${process.env.AZURE_OPENAI_API_VERSION}`;
    
    console.log('Calling Azure OpenAI with URL:', azureUrl);

    const response = await fetch(azureUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.AZURE_OPENAI_API_KEY || '',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        max_completion_tokens: 8000,
      }),
    });

    console.log('Azure OpenAI response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure OpenAI error:', errorText);
      return NextResponse.json({ error: `Azure OpenAI error: ${response.status}` }, { status: 500 });
    }

    const data = await response.json();
    console.log('Azure OpenAI response:', data);
    
    const blogPost = data.choices?.[0]?.message?.content;
    
    if (!blogPost) {
      console.error('No content in Azure OpenAI response:', data);
      return NextResponse.json({ error: 'No blog content generated' }, { status: 500 });
    }

    return NextResponse.json({ blogPost });
  } catch (error) {
    console.error('Error generating blog post:', error);
    return NextResponse.json({ 
      error: `Failed to generate blog post: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
} 