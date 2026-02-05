const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export async function processWithAI(data: any) {
    const res = await fetch(`${AI_SERVICE_URL}/api/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        throw new Error(`AI Service Error: ${res.statusText}`);
    }

    return res.json();
}
