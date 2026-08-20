import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
        return NextResponse.json({ error: 'No GEMINI_API_KEY found' });
    }

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await res.json();

        const modelNames = data?.models?.map((m: any) => m.name) || [];

        // Also test sending simple prompt to models found
        const testResults: any = {};
        for (const mObj of (data?.models || [])) {
            const mName = mObj.name.replace('models/', '');
            if (!mObj.supportedGenerationMethods?.includes('generateContent')) continue;

            try {
                const tRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/${mObj.name}:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: 'Respond OK' }] }]
                    })
                });
                testResults[mName] = { status: tRes.status, ok: tRes.ok };
            } catch (e: any) {
                testResults[mName] = { error: e.message };
            }
        }

        return NextResponse.json({
            apiKeyPrefix: apiKey.substring(0, 10) + '...',
            availableModelsCount: modelNames.length,
            modelNames,
            testResults
        });
    } catch (e: any) {
        return NextResponse.json({ error: String(e?.stack || e?.message || e) }, { status: 500 });
    }
}
