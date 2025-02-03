import type { IngredientPriceConfig, ProductPriceConfig } from "@/calculator"
import type Calculator from "@/calculator"
import type { StoragePriceItem } from "@/pinia/stores/price"
import type { RequestData } from "../leaderboard/type"
import { usePriceStore } from "@/pinia/stores/price"
import { getItemDetailOf } from "../game"
/** 查 */
export async function getPriceDataApi(params: RequestData) {
  await new Promise(resolve => setTimeout(resolve, 0))
  let list: StoragePriceItem[] = usePriceStore().list
  params.name && (list = list.filter(item => getItemDetailOf(item.hrid).name.toLocaleLowerCase().includes(params.name!.toLowerCase())))
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
    const hasPrice = usePriceStore().hasPrice(hrid)
    const hasManual = !!priceConfigList[i].manual
    if (hasManual || hasPrice) {
      usePriceStore().setPrice({
        hrid,
        [type === "ingredient" ? "ask" : "bid"]: {
          manual: hasManual,
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
