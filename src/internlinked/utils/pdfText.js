import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href;

// Extracts plain text from a resume PDF, client-side, for free — no network call to any AI
// service. Shared by ProfileView (resume upload -> profiles.resume_text) and llmScore (backfill
// path for resumes uploaded before resume_text existed).
export async function extractPdfText(resumeUrl) {
    try {
        const res = await fetch(resumeUrl);
        if (!res.ok) return null;
        const arrayBuffer = await res.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const pages = await Promise.all(
            Array.from({ length: pdf.numPages }, (_, i) =>
                pdf.getPage(i + 1).then(p => p.getTextContent()).then(tc =>
                    tc.items.map(item => item.str).join(' ')
                )
            )
        );
        const text = pages.join('\n').trim();
        return text.length > 100 ? text.slice(0, 4000) : null;
    } catch (e) {
        console.warn('[PDF] text extraction failed:', e.message);
        return null;
    }
}

export async function sha256Hex(text) {
    const bytes = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}
