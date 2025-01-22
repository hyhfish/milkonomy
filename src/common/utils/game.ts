export function getKeyOf(hrid?: string) {
  return hrid?.split("/").pop()
}
export function getIconOf(hrid?: string) {
  const key = getKeyOf(hrid)
  return `${import.meta.env.BASE_URL}sprites/milky.svg#${key}`
}
