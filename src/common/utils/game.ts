export function getKeyOf(hrid?: string) {
  return hrid?.split("/").pop()
}
export function getTypeOf(hrid?: string) {
  return hrid?.split("/")[1]
}
export function getIconOf(hrid?: string) {
  const type = getTypeOf(hrid)
  const key = getKeyOf(hrid)
  return `${import.meta.env.BASE_URL}sprites/${type}.svg#${key}`
}
