import { createI18n } from "vue-i18n"
import lang from "./lang"

export type MessageSchema = typeof lang
export type Lang = keyof MessageSchema

const storageKey = "lang-storage-key"
const defaultLang: Lang = "zhCn"

export function getLang(): Lang {
  return (localStorage.getItem(storageKey) as Lang) ?? defaultLang
}

export function setLang(value: string) {
  return localStorage.setItem(storageKey, value)
}

export default createI18n({
  legacy: false,
  locale: getLang(),
  globalInjection: true,
  messages: lang,
  missingWarn: false
})
