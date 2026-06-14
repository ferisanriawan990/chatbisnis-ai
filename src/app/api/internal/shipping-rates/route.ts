import { NextResponse } from 'next/server';

let cachedCities: any[] = [];

async function getCities(apiKey: string) {
  if (cachedCities.length > 0) return cachedCities;
  
  try {
    const res = await fetch('https://api.rajaongkir.com/starter/city', {
      method: 'GET',
      headers: { key: apiKey }
    });
    const data = await res.json();
    if (data.rajaongkir?.results) {
      cachedCities = data.rajaongkir.results;
      return cachedCities;
    }
  } catch (err) {
    console.error('Failed to fetch RajaOngkir cities', err);
  }
  return [];
}

function findCityId(cities: any[], query: string): string | null {
  if (!query) return null;
  const normalizedQuery = query.toLowerCase().trim();
  
  // Cari kecocokan exact terlebih dahulu
  const exactMatch = cities.find(c => c.city_name.toLowerCase() === normalizedQuery || `${c.type} ${c.city_name}`.toLowerCase() === normalizedQuery);
  if (exactMatch) return exactMatch.city_id;

  // Cari kecocokan partial
  const partialMatch = cities.find(c => c.city_name.toLowerCase().includes(normalizedQuery));
  if (partialMatch) return partialMatch.city_id;

  return null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const destination = searchParams.get('destination')?.toLowerCase() || '';
  
  const RAJAONGKIR_KEY = process.env.RAJAONGKIR_API_KEY;
  const ORIGIN_ID = process.env.RAJAONGKIR_ORIGIN_ID || '152'; // Default: 152 (Jakarta Pusat)

  // 1. Jika API Key ada, gunakan RajaOngkir Asli
  if (RAJAONGKIR_KEY) {
    const cities = await getCities(RAJAONGKIR_KEY);
    const destinationId = findCityId(cities, destination);

    if (destinationId) {
      try {
        const costRes = await fetch('https://api.rajaongkir.com/starter/cost', {
          method: 'POST',
          headers: {
            'content-type': 'application/x-www-form-urlencoded',
            key: RAJAONGKIR_KEY
          },
          body: new URLSearchParams({
            origin: ORIGIN_ID,
            destination: destinationId,
            weight: '1000', // Default 1kg
            courier: 'jne'  // Default courier JNE untuk Starter
          }).toString()
        });

        const costData = await costRes.json();
        
        if (costData.rajaongkir?.results?.[0]?.costs) {
          const results = costData.rajaongkir.results[0].costs.map((c: any) => ({
            courier: costData.rajaongkir.results[0].code.toUpperCase(),
            service: c.service,
            description: c.description,
            cost: c.cost[0].value,
            etd: `${c.cost[0].etd} hari`
          }));

          return NextResponse.json({ success: true, results });
        }
      } catch (err) {
        console.error('RajaOngkir Cost API Error:', err);
        // Fallback jika API error
      }
    }
  }

  // 2. Fallback: Logika Tiruan (Mock)
  let rate = 15000; // Default flat rate
  let courier = 'JNE Reguler';
  let etd = '2-3 hari';

  if (destination.includes('jakarta') || destination.includes('depok') || destination.includes('tangerang') || destination.includes('bekasi')) {
    rate = 10000;
    etd = '1-2 hari';
  } else if (destination.includes('jawa') || destination.includes('banten')) {
    rate = 15000;
    etd = '2-3 hari';
  } else if (destination.includes('sumatera')) {
    rate = 30000;
    etd = '3-5 hari';
  } else if (destination.includes('kalimantan') || destination.includes('sulawesi')) {
    rate = 45000;
    etd = '4-7 hari';
  } else if (destination.includes('papua') || destination.includes('maluku') || destination.includes('nusa tenggara')) {
    rate = 60000;
    etd = '5-10 hari';
  }

  return NextResponse.json({
    success: true,
    results: [
      {
        courier: 'MOCK-JNE',
        service: 'REG',
        description: 'Layanan Tiruan',
        cost: rate,
        etd: etd
      }
    ]
  });
}
