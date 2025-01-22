export function getKeyOf(hrid?: string) {
  return hrid?.split("/").pop()
}
export function getIconOf(hrid?: string) {
  return `src/common/assets/icons/preserve-color/milky.svg#${getKeyOf(hrid)}`
}
