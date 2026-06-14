import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const destination = searchParams.get('destination')?.toLowerCase() || '';

  let rate = 15000; // Default flat rate
  let courier = 'JNE Reguler';
  let etd = '2-3 hari';

  // Logika tiruan kalkulasi tarif per pulau/wilayah
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

  // Meniru payload dari RajaOngkir / logistik asli
  return NextResponse.json({
    success: true,
    results: [
      {
        courier: 'JNE',
        service: 'REG',
        description: 'Layanan Reguler',
        cost: rate,
        etd: etd
      },
      {
        courier: 'J&T',
        service: 'EZ',
        description: 'Reguler Service',
        cost: rate - 1000,
        etd: etd
      }
    ]
  });
}
