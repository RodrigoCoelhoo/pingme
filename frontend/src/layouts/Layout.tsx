import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ThemeProvider } from 'next-themes'
import Header from '../components/Header'
import { useState, useEffect } from 'react'
import Footer from '../components/Footer.tsx'

const Layout = () => {
	const { i18n } = useTranslation()

	const [lang, setLang] = useState<'en' | 'pt'>(() => {
		return (localStorage.getItem('lang') as 'en' | 'pt') || 'en'
	})

	useEffect(() => {
		i18n.changeLanguage(lang)
		localStorage.setItem('lang', lang)
	}, [lang, i18n])

	const toggleLang = () => {
		setLang(prev => (prev === 'en' ? 'pt' : 'en'))
	}

	return (
		<ThemeProvider attribute="data-theme" defaultTheme="dark">
			<Header lang={lang} toggleLang={toggleLang} />
            
			<Outlet />
            
			<Footer />
		</ThemeProvider>
	)
}

export default Layout