'use client'

import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={language === 'en' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setLanguage('en')}
      >
        <Globe className="h-4 w-4 mr-2" />
        EN
      </Button>
      <Button
        variant={language === 'he' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setLanguage('he')}
      >
        <Globe className="h-4 w-4 mr-2" />
        עב
      </Button>
    </div>
  )
}