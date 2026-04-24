import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import enCommon from './locales/en/common.json'
import ptCommon from './locales/pt/common.json'
import enLanding from './locales/en/landing.json'
import ptLanding from './locales/pt/landing.json'

const savedLang = localStorage.getItem('lang') || 'en'

i18n
	.use(initReactI18next)
	.init({
		resources: {
			en: {
				common: enCommon,
				landing: enLanding
			},
			pt: {
				common: ptCommon,
				landing: ptLanding
			},
		},
		lng: savedLang,
		fallbackLng: 'en',
		interpolation: {
			escapeValue: false,
		},
	})

export default i18n