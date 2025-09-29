'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  Save,
  Globe,
  Eye,
  EyeOff,
  Edit3
} from 'lucide-react'

interface SectionContent {
  [key: string]: string
}

interface Section {
  id: string
  name: string
  type: string
  visible: boolean
  content: SectionContent
}

export default function SectionEditor() {
  const { t, isRTL } = useLanguage()
  const [selectedPage, setSelectedPage] = useState('')
  const [selectedLang, setSelectedLang] = useState('en')
  const [sections, setSections] = useState<Section[]>([])
  const [pages, setPages] = useState<string[]>([])
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadPages()
  }, [])

  useEffect(() => {
    if (selectedPage) {
      loadSections()
    }
  }, [selectedPage, selectedLang])

  const loadPages = async () => {
    try {
      if (typeof window === 'undefined') return

      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/pages', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        const pageNames = Object.keys(data.pages || {})
        setPages(pageNames)
        if (pageNames.length > 0) {
          setSelectedPage(pageNames[0])
        }
      }
    } catch (error) {
      console.error('Failed to load pages:', error)
      setPages([])
    }
  }

  const loadSections = async () => {
    try {
      if (typeof window === 'undefined') return
      if (!selectedPage) return

      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/sections/${selectedLang}/${selectedPage}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setSections(data.sections || [])
      }
    } catch (error) {
      console.error('Failed to load sections:', error)
      setSections([])
    }
  }

  const updateSection = async (sectionId: string, content: SectionContent, visible?: boolean) => {
    setIsSaving(true)
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/section/${selectedLang}/${selectedPage}/${sectionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content, visible })
      })
      if (response.ok) {
        alert(t('pageSavedSuccess'))
        loadSections() // Reload to get updated data
      } else {
        const errorData = await response.json()
        alert(errorData.error || t('failedToSavePage'))
      }
    } catch (error) {
      alert(t('failedToSavePage'))
    } finally {
      setIsSaving(false)
    }
  }

  const toggleSectionVisibility = (sectionId: string, visible: boolean) => {
    setSections(prev => prev.map(section =>
      section.id === sectionId
        ? { ...section, visible }
        : section
    ))

    const section = sections.find(s => s.id === sectionId)
    if (section) {
      updateSection(sectionId, section.content, visible)
    }
  }

  const updateSectionContent = (sectionId: string, field: string, value: string) => {
    setSections(prev => prev.map(section =>
      section.id === sectionId
        ? { ...section, content: { ...section.content, [field]: value } }
        : section
    ))
  }

  const saveSectionContent = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId)
    if (section) {
      updateSection(sectionId, section.content, section.visible)
      setEditingSection(null)
    }
  }

  const renderSectionEditor = (section: Section) => {
    const isEditing = editingSection === section.id

    return (
      <Card key={section.id} className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{section.name}</CardTitle>
              <CardDescription>{t('sectionType')}: {section.type}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleSectionVisibility(section.id, !section.visible)}
              >
                {section.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingSection(isEditing ? null : section.id)}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        {isEditing && (
          <CardContent>
            <div className="space-y-4">
              {Object.keys(section.content).map(field => (
                <div key={field} className="space-y-2">
                  <Label>{field.charAt(0).toUpperCase() + field.slice(1)}</Label>
                  {section.content[field].length > 100 ? (
                    <textarea
                      value={section.content[field]}
                      onChange={(e) => updateSectionContent(section.id, field, e.target.value)}
                      className="w-full h-32 px-3 py-2 border rounded-md"
                    />
                  ) : (
                    <Input
                      value={section.content[field]}
                      onChange={(e) => updateSectionContent(section.id, field, e.target.value)}
                    />
                  )}
                </div>
              ))}
              <div className="flex gap-2">
                <Button
                  onClick={() => saveSectionContent(section.id)}
                  disabled={isSaving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? t('saving') : t('saveChanges')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingSection(null)}
                >
                  {t('cancel')}
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    )
  }

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-4 gap-4 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Page Selector */}
      <Card>
        <CardHeader>
          <CardTitle>{t('selectPage')}</CardTitle>
          <CardDescription>Section-based editing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>{t('language')}</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  variant={selectedLang === 'en' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedLang('en')}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  {t('english')}
                </Button>
                <Button
                  variant={selectedLang === 'he' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedLang('he')}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  {t('hebrew')}
                </Button>
              </div>
            </div>

            <div>
              <Label>{t('page')}</Label>
              <select
                value={selectedPage}
                onChange={(e) => setSelectedPage(e.target.value)}
                className="w-full mt-2 px-3 py-2 border rounded-md"
              >
                {pages.map(page => (
                  <option key={page} value={page}>
                    {page.split('-').map(word =>
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sections Editor */}
      <div className="lg:col-span-3">
        <div className="space-y-4">
          {sections.length > 0 ? (
            sections.map(section => renderSectionEditor(section))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">{t('noSectionsFound')}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}