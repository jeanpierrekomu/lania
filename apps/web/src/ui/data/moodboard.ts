export interface MoodPhoto {
  src: string
  alt: string
  caption: string
  credit: string
}

const u = (id: string, ixid: string, w = 900) =>
  `https://images.unsplash.com/${id}?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=${ixid}&ixlib=rb-4.1.0&q=80&w=${w}`

export const MOOD_PHOTOS: Record<'cafe' | 'home' | 'city' | 'focus' | 'travel' | 'group', MoodPhoto> = {
  cafe: {
    src: u('photo-1760623681430-9224e69d9683', 'M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxmcmllbmRzJTIwdGFsa2luZyUyMGNhZmUlMjBjb252ZXJzYXRpb24lMjBsYXVnaGluZ3xlbnwxfHx8fDE3OTM2NTI0ODN8MA', 1100),
    alt: 'Dos jóvenes conversan y ríen en la mesa de un café con murales coloridos',
    caption: 'Conversación real, sin miedo',
    credit: 'Julio Lopez',
  },
  home: {
    src: u('photo-1790597038266-0873d6d9f6c2', 'M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHx5b3VuZyUyMGxhdGluYSUyMHdvbWFuJTIwc3R1ZHlpbmclMjBoZWFkcGhvbmVzJTIwbGFwdG9wfGVufDF8fHx8MTc5MzY1MjQ4Mnww'),
    alt: 'Una joven con audífonos estudia en su laptop desde el sofá',
    caption: 'A tu ritmo, desde casa',
    credit: 'Vitaly Gariev',
  },
  city: {
    src: u('photo-1697572057542-c7043e7923b7', 'M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZXhpY28lMjBjaXR5JTIwc3RyZWV0JTIwZHVzayUyMHB1cnBsZSUyMHNreXxlbnwxfHx8fDE3OTM2NTI0ODR8MA'),
    alt: 'Calle peatonal de Ciudad de México al atardecer con mucha gente',
    caption: 'Latinoamérica al atardecer',
    credit: 'Jezael Melgoza',
  },
  focus: {
    src: u('photo-1789930445611-3b13fd7d6de4', 'M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxub3RlYm9vayUyMGhhbmR3cml0aW5nJTIwY29mZmVlJTIwZGVzayUyMHdhcm0lMjBsaWdodHxlbnwxfHx8fDE3OTM2NTI0ODN8MA', 700),
    alt: 'Persona leyendo un libro bajo la luz cálida de una lámpara de escritorio',
    caption: 'Concentración y calma',
    credit: 'Oleg Zarevennyi',
  },
  travel: {
    src: u('photo-1792093296762-d8b095bbd561', 'M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHx5b3VuZyUyMG1hbiUyMGJhY2twYWNrJTIwYWlycG9ydCUyMHRyYXZlbCUyMHdpbmRvd3xlbnwxfHx8fDE3OTM2NTI0ODR8MA', 700),
    alt: 'Viajero en una sala de aeropuerto con un avión detrás del ventanal',
    caption: 'Situaciones por desbloquear',
    credit: 'Erik',
  },
  group: {
    src: u('photo-1790749870680-9f1918813d91', 'M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxmcmllbmRzJTIwdGFsa2luZyUyMGNhZmUlMjBjb252ZXJzYXRpb24lMjBsYXVnaGluZ3xlbnwxfHx8fDE3OTM2NTI0ODN8MA', 800),
    alt: 'Cuatro amigos conversan con café alrededor de una mesa de madera',
    caption: 'Comunidad pequeña y cercana',
    credit: 'Vitaly Gariev',
  },
}
