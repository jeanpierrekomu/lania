import type { AvatarLook } from '@/app/components/illustrations/PersonAvatar'

export type PersonId = 'valentina' | 'diego' | 'camila' | 'mateo' | 'ana' | 'luis' | 'sofia' | 'andres'

export interface Person {
  id: PersonId
  name: string
  city: string
  country: string
  look: AvatarLook
}

export const PEOPLE: Record<PersonId, Person> = {
  valentina: {
    id: 'valentina',
    name: 'Valentina',
    city: 'Bogotá',
    country: 'CO',
    look: { skin: 2, hair: 'wavy', hairColor: 'chestnut', shirt: 'mint', earring: true },
  },
  diego: { id: 'diego', name: 'Diego', city: 'Ciudad de México', country: 'MX', look: { skin: 4, hair: 'short', hairColor: 'black', shirt: 'lavender', glasses: true } },
  camila: { id: 'camila', name: 'Camila', city: 'Santiago', country: 'CL', look: { skin: 1, hair: 'ponytail', hairColor: 'honey', shirt: 'coral' } },
  mateo: { id: 'mateo', name: 'Mateo', city: 'Lima', country: 'PE', look: { skin: 5, hair: 'curly', hairColor: 'black', shirt: 'ink', beard: true } },
  ana: { id: 'ana', name: 'Ana', city: 'Montevideo', country: 'UY', look: { skin: 3, hair: 'bun', hairColor: 'brown', shirt: 'amber' } },
  luis: { id: 'luis', name: 'Luis', city: 'Quito', country: 'EC', look: { skin: 4, hair: 'buzz', hairColor: 'black', shirt: 'violet' } },
  sofia: { id: 'sofia', name: 'Sofía', city: 'Buenos Aires', country: 'AR', look: { skin: 1, hair: 'long', hairColor: 'brown', shirt: 'mint', glasses: true } },
  andres: { id: 'andres', name: 'Andrés', city: 'Medellín', country: 'CO', look: { skin: 3, hair: 'short', hairColor: 'brown', shirt: 'coral', beard: true } },
}
