import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import enCommon from './locales/en/common.json'
import ptCommon from './locales/pt/common.json'

const savedLang = localStorage.getItem('lang') || 'en'

i18n
	.use(initReactI18next)
	.init({
		resources: {
			en: {
				common: enCommon,
			},
			pt: {
				common: ptCommon,
			},
		},
		lng: savedLang,
		fallbackLng: 'en',
		interpolation: {
			escapeValue: false,
		},
	})

export default i18n