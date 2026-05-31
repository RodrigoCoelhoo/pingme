import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import enCommon from './locales/en/common.json'
import ptCommon from './locales/pt/common.json'
import enLanding from './locales/en/landing.json'
import ptLanding from './locales/pt/landing.json'
import enAuth from './locales/en/auth.json'
import ptAuth from './locales/pt/auth.json'
import enChat from './locales/en/chat.json'
import ptChat from './locales/pt/chat.json'
import enSidebar from './locales/en/sidebar.json'
import ptSidebar from './locales/pt/sidebar.json'
import enToast from './locales/en/toast.json'
import ptToast from './locales/pt/toast.json'
import enSystem from './locales/en/system.json'
import ptSystem from './locales/pt/system.json'

const savedLang = localStorage.getItem('lang') || 'en'

i18n
	.use(initReactI18next)
	.init({
		resources: {
			en: {
				common: enCommon,
				landing: enLanding,
				auth: enAuth,
				chat: enChat,
				sidebar: enSidebar,
				toast: enToast,
				system: enSystem
			},
			pt: {
				common: ptCommon,
				landing: ptLanding,
				auth: ptAuth,
				chat: ptChat,
				sidebar: ptSidebar,
				toast: ptToast,
				system: ptSystem
			},
		},
		lng: savedLang,
		fallbackLng: 'en',
		interpolation: {
			escapeValue: false,
		},
	})

export default i18n