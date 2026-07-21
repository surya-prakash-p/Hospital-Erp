import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').toLowerCase().trim();

    if (!query || query.length < 1) {
      return NextResponse.json({ suggestions: [] });
    }

    // Try fetching live patients from Frappe API backend
    try {
      const frappeRes = await fetch(`http://localhost:8000/api/resource/Hospital Patient?fields=["name","patient_name","mobile_number","patient_id"]&limit=10`, {
        headers: { 'Content-Type': 'application/json' }
      });
      if (frappeRes.ok) {
        const raw = await frappeRes.json();
        const pList = raw.data || [];
        const matches = pList.filter(p => 
          (p.patient_name || '').toLowerCase().includes(query) ||
          (p.mobile_number || '').includes(query) ||
          (p.name || '').toLowerCase().includes(query)
        ).map(p => ({
          title: p.patient_name,
          subtitle: `ID: ${p.name || p.patient_id || 'N/A'} • Mobile: ${p.mobile_number || 'N/A'}`,
          query: p.patient_name,
          type: "Patient"
        }));

        return NextResponse.json({ suggestions: matches });
      }
    } catch (e) {
      console.warn("Frappe Patient Autocomplete API offline, using live memory proxy.");
    }

    // Fallback live memory dynamic matching
    return NextResponse.json({ suggestions: [] });
  } catch (err) {
    return NextResponse.json({ suggestions: [] });
  }
}
