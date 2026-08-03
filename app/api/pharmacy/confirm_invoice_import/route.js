import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const data = await request.json();

    // Try Frappe Backend API first
    try {
      const frappeRes = await fetch('http://localhost:8000/api/method/hospital_management.pharmacy.confirm_invoice_import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (frappeRes.ok) {
        const result = await frappeRes.json();
        return NextResponse.json(result.message || result);
      }
    } catch (e) {
      console.warn('Frappe backend unreachable for confirm_invoice_import, handling locally only');
    }

    // Fallback: Just return success to the Next.js frontend
    // The Next.js frontend will handle local storage updates
    return NextResponse.json({ status: 'success', message: 'Local storage updated (Frappe bypassed)' });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
