export type SortFilterItem = {
  reverse: boolean
  slug: null | string
  title: string
}

export const defaultSort: SortFilterItem = {
  slug: null,
  reverse: false,
  title: 'По популярности',
}

export const sorting: SortFilterItem[] = [
  defaultSort,
  { slug: '-createdAt', reverse: true, title: 'Новинки' },
  { slug: 'priceInUSD', reverse: false, title: 'Сначала дешевле' },
  { slug: '-priceInUSD', reverse: true, title: 'Сначала дороже' },
]

export const priceRanges = [
  { label: 'До 3 000 ₽', min: 0, max: 3000 },
  { label: '3 000 — 5 000 ₽', min: 3000, max: 5000 },
  { label: '5 000 — 10 000 ₽', min: 5000, max: 10000 },
  { label: 'От 10 000 ₽', min: 10000, max: null },
]

export const occasions = [
  'День рождения',
  'Свадьба',
  'Юбилей',
  '8 Марта',
  'Без повода',
  'Признание',
  'Выписка',
  'Новоселье',
]

export const colors = [
  { label: 'Красные', value: 'red', hex: '#c0392b' },
  { label: 'Розовые', value: 'pink', hex: '#e8b4b8' },
  { label: 'Белые', value: 'white', hex: '#faf5f0' },
  { label: 'Жёлтые', value: 'yellow', hex: '#f1c40f' },
  { label: 'Сиреневые', value: 'purple', hex: '#9b59b6' },
  { label: 'Микс', value: 'mix', hex: 'linear-gradient(135deg, #e8b4b8, #b5c7a3, #f1c40f)' },
]

export const recipients = [
  'Девушке',
  'Маме',
  'Коллеге',
  'Учителю',
  'Мужчине',
  'Ребёнку',
]
