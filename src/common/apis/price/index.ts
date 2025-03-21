import type { IngredientPriceConfig, ProductPriceConfig } from "@/calculator"
import type Calculator from "@/calculator"
import type { StoragePriceItem } from "@/pinia/stores/price"
import type { RequestData } from "../leaderboard/type"
import locales from "@/locales"
import { usePriceStore } from "@/pinia/stores/price"
import { getItemDetailOf } from "../game"

const { t } = locales.global

/** 查 */
export async function getPriceDataApi(params: RequestData) {
  await new Promise(resolve => setTimeout(resolve, 0))
  let list: StoragePriceItem[] = Array.from(usePriceStore().map.values())
  params.name && (list = list.filter(item => t(getItemDetailOf(item.hrid).name).toLocaleLowerCase().includes(params.name!.toLowerCase())))
  return { list: list.slice((params.currentPage - 1) * params.size, params.currentPage * params.size), total: list.length }
}

/** 删 */
export function deletePriceApi(row: StoragePriceItem) {
  usePriceStore().deletePrice({ hrid: row.hrid })
}
/** 改 */
export function setPriceApi(row: Calculator, ingredientPriceConfigList: IngredientPriceConfig[], productPriceConfigList: ProductPriceConfig[]) {
  setPrice(row, ingredientPriceConfigList, "ingredient")
  setPrice(row, productPriceConfigList, "product")
  usePriceStore().commit()
}

function setPrice(row: Calculator, priceConfigList: IngredientPriceConfig[], type: "ingredient" | "product") {
  for (let i = 0; i < priceConfigList.length; i++) {
    const hrid = row[`${type}ListWithPrice`][i].hrid
    const hasPrice = hasManualPriceOf(hrid)
    const hasManualPrice = !!priceConfigList[i].manual
    if (hasManualPrice || hasPrice) {
      usePriceStore().setPrice({
        hrid,
        [type === "ingredient" ? "ask" : "bid"]: {
          manual: hasManualPrice,
          manualPrice: priceConfigList[i].price!
        }
      })
    }
  }
}

export function setSinglePriceApi(row: StoragePriceItem) {
  usePriceStore().setPrice(row)
  usePriceStore().commit()
}

// #region 性能优化
const price = structuredClone(toRaw(usePriceStore().$state))

watch(() => usePriceStore().map, () => {
  price.map = Object.freeze(structuredClone(toRaw(usePriceStore().map)))
  console.log("raw priceMap changed")
}, { deep: true })

watch(() => usePriceStore().activated, () => {
  price.activated = usePriceStore().activated
})

export function getManualPriceOf(hrid: string) {
  return price.map.get(hrid)
}
export function hasManualPriceOf(hrid: string) {
  return price.map.has(hrid)
}
export function getManualPriceActivated() {
  return price.activated
}
// #endregion
