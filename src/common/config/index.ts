import type { PlayerEquipmentItem } from "@/pinia/stores/player"

export const DEFAULT_SEPCIAL_EQUIPMENT_LIST: PlayerEquipmentItem[] = [
  { type: "off_hand", hrid: "/items/eye_watch", enhanceLevel: 10 },
  { type: "head", hrid: "/items/red_culinary_hat", enhanceLevel: 10 },
  { type: "hands", hrid: "/items/enchanted_gloves", enhanceLevel: 10 },
  { type: "neck", hrid: "", enhanceLevel: undefined },
  { type: "earrings", hrid: "", enhanceLevel: undefined },
  { type: "ring", hrid: "", enhanceLevel: undefined }
]
