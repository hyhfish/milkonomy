<script lang="ts" setup>
import { priceStepOf } from "@/common/apis/game"

const props = withDefaults(defineProps<{
  modelValue?: number
  min?: number
  max?: number
  placeholder?: string
  fallbackBase: number
  disabled?: boolean
  width?: string
}>(), {
  modelValue: undefined,
  min: 0,
  max: 5000000000,
  placeholder: "",
  disabled: false,
  width: "120px"
})

const emit = defineEmits<{
  "update:modelValue": [value: number | undefined]
}>()

function clamp(value: number) {
  return Math.min(props.max, Math.max(props.min, value))
}

function stepByTier(high: boolean) {
  if (props.disabled) return
  const base = typeof props.modelValue === "number" && Number.isFinite(props.modelValue)
    ? props.modelValue
    : props.fallbackBase
  const next = priceStepOf(base, high)
  emit("update:modelValue", clamp(next > 0 ? next : props.min))
}

function onChange(value: number | undefined, oldValue: number | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    emit("update:modelValue", value)
    return
  }

  if (value < props.min) {
    emit("update:modelValue", props.min)
    return
  }

  const isOldNumber = typeof oldValue === "number" && Number.isFinite(oldValue)
  const delta = isOldNumber ? value - oldValue : Number.NaN

  if (isOldNumber && Math.abs(Math.abs(delta) - 1) < 1e-9) {
    stepByTier(delta > 0)
    return
  }

  emit("update:modelValue", clamp(value))
}
</script>

<template>
  <div class="tiered-price-input" :style="{ width }">
    <el-input-number
      class="tiered-price-input__input"
      :model-value="modelValue"
      :min="min"
      :max="max"
      :disabled="disabled"
      :placeholder="placeholder"
      :step="1"
      :controls="true"
      controls-position="right"
      @change="onChange"
    />
  </div>
</template>

<style scoped>
.tiered-price-input {
  display: block;
}

.tiered-price-input__input {
  width: 100%;
}
</style>
