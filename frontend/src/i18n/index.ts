import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import enCommon from './locales/en/common.json'
import ptCommon from './locales/pt/common.json'
import enLanding from './locales/en/landing.json'
import ptLanding from './locales/pt/landing.json'
import enAuth from './locales/en/auth.json'
import ptAuth from './locales/pt/auth.json'

const savedLang = localStorage.getItem('lang') || 'en'

i18n
	.use(initReactI18next)
	.init({
		resources: {
			en: {
				common: enCommon,
				landing: enLanding,
				auth: enAuth
			},
			pt: {
				common: ptCommon,
				landing: ptLanding,
				auth: ptAuth
			},
		},
		lng: savedLang,
		fallbackLng: 'en',
		interpolation: {
			escapeValue: false,
		},
	})

export default i18n