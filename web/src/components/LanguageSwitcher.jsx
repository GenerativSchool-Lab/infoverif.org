import { useTranslation } from 'react-i18next'

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng)
    localStorage.setItem('language', lng)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => changeLanguage('fr')}
        className={`px-3 py-1 text-sm rounded transition-colors ${
          i18n.language === 'fr'
            ? 'bg-white text-black font-medium'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        FR
      </button>
      <button
        onClick={() => changeLanguage('en')}
        className={`px-3 py-1 text-sm rounded transition-colors ${
          i18n.language === 'en'
            ? 'bg-white text-black font-medium'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        EN
      </button>
    </div>
  )
}

