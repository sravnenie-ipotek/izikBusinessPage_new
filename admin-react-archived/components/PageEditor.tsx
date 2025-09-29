'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  Save,
  FileText,
  Globe,
  Code,
  Eye,
  Upload,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  XCircle,
  TrendingUp,
  BarChart3
} from 'lucide-react'

interface PageData {
  title: string
  content: string
  metaDescription?: string
  metaKeywords?: string
}

interface TranslationStatus {
  hasHebrew: boolean
  status: 'COMPLETE' | 'MISSING'
  priority: 'CRITICAL' | 'NORMAL'
  hebrewPath: string
}

interface TranslationReport {
  totalEnglishPages: number
  totalHebrewPages: number
  translatedPages: number
  completionPercentage: number
  status: Record<string, TranslationStatus>
  summary: {
    status: string
    message: string
    missingCount: number
    recommendation: string
  }
  gaps: Array<{
    directory: string
    englishPath: string
    missingHebrewPath: string
    isCritical: boolean
    urgency: 'HIGH' | 'MEDIUM'
  }>
}

export default function PageEditor() {
  const { t, isRTL, language, setLanguage } = useLanguage()
  const [selectedPage, setSelectedPage] = useState('')
  const [pageData, setPageData] = useState<PageData>({
    title: '',
    content: '',
    metaDescription: '',
    metaKeywords: ''
  })
  const [pages, setPages] = useState<Array<{ id: string; path: string; title: string }>>([])
  const [isSaving, setIsSaving] = useState(false)
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit')
  const [translationReport, setTranslationReport] = useState<TranslationReport | null>(null)
  const [isLoadingStatus, setIsLoadingStatus] = useState(false)
  const [showTranslationPanel, setShowTranslationPanel] = useState(false)

  useEffect(() => {
    loadPages()
    loadTranslationStatus()
  }, [])

  useEffect(() => {
    if (selectedPage) {
      loadPageContent()
    }
  }, [selectedPage, language])

  const loadTranslationStatus = useCallback(async () => {
    setIsLoadingStatus(true)
    try {
      const response = await fetch('/api/translation-status')
      if (response.ok) {
        const data = await response.json()
        setTranslationReport(data)
      }
    } catch (error) {
      console.error('Failed to load translation status:', error)
    } finally {
      setIsLoadingStatus(false)
    }
  }, [])

  const getPageTranslationStatus = (pageId: string): TranslationStatus | null => {
    if (!translationReport) return null

    // Find status by matching page directory
    const statusEntries = Object.entries(translationReport.status)
    const matchingEntry = statusEntries.find(([directory]) => {
      return pageId.includes(directory) || directory === 'root' && pageId === 'index'
    })

    return matchingEntry ? matchingEntry[1] : null
  }

  const loadPages = useCallback(async () => {
    try {
      // Only run on client side
      if (typeof window === 'undefined') return

      const response = await fetch(`/api/pages?action=list&lang=${language}`)
      if (response.ok) {
        const data = await response.json()
        const pagesList = data.pages || []
        setPages(pagesList)
        if (pagesList.length > 0) {
          setSelectedPage(pagesList[0].id)
        }
      } else {
        // Fallback to empty array
        setPages([])
      }
    } catch (error) {
      console.error('Failed to load pages:', error)
      setPages([])
    }
  }, [language])

  const loadPageContent = async () => {
    try {
      // Only run on client side
      if (typeof window === 'undefined') return
      if (!selectedPage) return

      const response = await fetch(`/api/pages?page=${selectedPage}&lang=${language}`)
      if (response.ok) {
        const data = await response.json()
        const content = data.content || {}
        setPageData({
          title: content.title || '',
          content: content.mainContent || '',
          metaDescription: content.metaDescription || '',
          metaKeywords: ''
        })
      }
    } catch (error) {
      console.error('Failed to load page content:', error)
      setPageData({
        title: '',
        content: '',
        metaDescription: '',
        metaKeywords: ''
      })
    }
  }

  const savePageContent = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/pages', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          page: selectedPage,
          updates: {
            title: pageData.title,
            heading: pageData.title, // Use title as h1
            metaDescription: pageData.metaDescription,
            mainContent: pageData.content
          }
        })
      })
      if (response.ok) {
        alert('Page saved and HTML updated successfully!')
        // Reload page content to ensure we have the latest
        await loadPageContent()
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to save page')
      }
    } catch (error) {
      alert('Failed to save page. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('image', file)
    formData.append('page', selectedPage)
    formData.append('lang', language)

    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        const imageUrl = data.imageUrl
        // Insert image at cursor position
        const textarea = document.querySelector('textarea') as HTMLTextAreaElement
        if (textarea) {
          const start = textarea.selectionStart
          const end = textarea.selectionEnd
          const text = textarea.value
          const imageTag = `<img src="${imageUrl}" alt="" class="content-image" />`
          const newText = text.substring(0, start) + imageTag + text.substring(end)
          setPageData(prev => ({ ...prev, content: newText }))
        }
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to upload image')
      }
    } catch (error) {
      alert('Failed to upload image')
    }
  }

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-4 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Page Selector */}
      <Card>
        <CardHeader>
          <CardTitle>{t('selectPage')}</CardTitle>
          <CardDescription>{t('choosePage')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>{t('language')}</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  variant={language === 'en' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLanguage('en')}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  {t('english')}
                </Button>
                <Button
                  variant={language === 'he' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLanguage('he')}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  {t('hebrew')}
                </Button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label>{t('page')}</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTranslationPanel(!showTranslationPanel)}
                  className="text-xs"
                >
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Status
                </Button>
              </div>
              <select
                value={selectedPage}
                onChange={(e) => setSelectedPage(e.target.value)}
                className="w-full mt-2 px-3 py-2 border rounded-md"
              >
                {pages.map(page => {
                  const status = getPageTranslationStatus(page.id)
                  const statusIcon = status?.hasHebrew ? '✅' :
                                   status?.priority === 'CRITICAL' ? '🚨' : '⚠️'
                  return (
                    <option key={page.id} value={page.id}>
                      {statusIcon} {page.title}
                    </option>
                  )
                })}
              </select>

              {/* Translation Status for Selected Page */}
              {selectedPage && (() => {
                const status = getPageTranslationStatus(selectedPage)
                if (!status) return null

                return (
                  <div className={`mt-2 p-2 rounded text-sm ${
                    status.hasHebrew
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : status.priority === 'CRITICAL'
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      {status.hasHebrew ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : status.priority === 'CRITICAL' ? (
                        <XCircle className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      <span className="font-medium">
                        {status.hasHebrew
                          ? 'Hebrew Available'
                          : status.priority === 'CRITICAL'
                          ? 'Critical: Hebrew Missing'
                          : 'Hebrew Translation Needed'
                        }
                      </span>
                    </div>
                    {!status.hasHebrew && (
                      <div className="mt-1 text-xs opacity-75">
                        Create: {status.hebrewPath}
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Page Editor */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('editPage')}</CardTitle>
              <CardDescription>{t('modifyContent')}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'edit' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('edit')}
              >
                <Code className="h-4 w-4 mr-2" />
                {t('edit')}
              </Button>
              <Button
                variant={viewMode === 'preview' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('preview')}
              >
                <Eye className="h-4 w-4 mr-2" />
                {t('preview')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'edit' ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">{t('pageTitle')}</Label>
                <Input
                  id="title"
                  value={pageData.title}
                  onChange={(e) => setPageData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={t('enterPageTitle')}
                />
              </div>

              <div>
                <Label htmlFor="metaDescription">{t('metaDescription')}</Label>
                <Input
                  id="metaDescription"
                  value={pageData.metaDescription}
                  onChange={(e) => setPageData(prev => ({ ...prev, metaDescription: e.target.value }))}
                  placeholder={t('seoMetaDescription')}
                />
              </div>

              <div>
                <Label htmlFor="metaKeywords">{t('metaKeywords')}</Label>
                <Input
                  id="metaKeywords"
                  value={pageData.metaKeywords}
                  onChange={(e) => setPageData(prev => ({ ...prev, metaKeywords: e.target.value }))}
                  placeholder={t('seoKeywords')}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="content">{t('pageContent')}</Label>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button variant="outline" size="sm" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        {t('uploadImage')}
                      </span>
                    </Button>
                  </label>
                </div>
                <textarea
                  id="content"
                  value={pageData.content}
                  onChange={(e) => setPageData(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full h-96 px-3 py-2 border rounded-md font-mono text-sm"
                  placeholder={t('enterHtmlContent')}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={savePageContent}
                  disabled={isSaving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? t('saving') : t('saveChanges')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="prose max-w-none">
              <h1>{pageData.title}</h1>
              <div dangerouslySetInnerHTML={{ __html: pageData.content }} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Translation Status Panel */}
      {showTranslationPanel && translationReport && (
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Translation Status Dashboard
                </CardTitle>
                <CardDescription>
                  Real-time Hebrew translation coverage analysis
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => loadTranslationStatus()}
                disabled={isLoadingStatus}
              >
                {isLoadingStatus ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Overall Stats */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">
                  {translationReport.completionPercentage}%
                </div>
                <div className="text-sm text-blue-600">Translation Complete</div>
                <div className="text-xs text-blue-500 mt-1">
                  {translationReport.translatedPages} of {translationReport.totalEnglishPages} pages
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-700">
                  {translationReport.totalHebrewPages}
                </div>
                <div className="text-sm text-green-600">Hebrew Pages</div>
                <div className="text-xs text-green-500 mt-1">
                  Available translations
                </div>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-700">
                  {translationReport.summary.missingCount}
                </div>
                <div className="text-sm text-red-600">Missing Translations</div>
                <div className="text-xs text-red-500 mt-1">
                  Need Hebrew versions
                </div>
              </div>
            </div>

            {/* Status Summary */}
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{translationReport.summary.status}</span>
                <span className="text-sm text-gray-600">{translationReport.summary.message}</span>
              </div>
              <div className="text-sm text-gray-700">
                {translationReport.summary.recommendation}
              </div>
            </div>

            {/* Critical Gaps */}
            {translationReport.gaps.filter(gap => gap.isCritical).length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-red-700 mb-2 flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Critical Missing Translations
                </h4>
                <div className="space-y-2">
                  {translationReport.gaps
                    .filter(gap => gap.isCritical)
                    .map(gap => (
                      <div key={gap.directory} className="bg-red-50 p-2 rounded border border-red-200">
                        <div className="font-medium text-red-700">{gap.directory || 'Homepage'}</div>
                        <div className="text-sm text-red-600">Missing: {gap.missingHebrewPath}</div>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}

            {/* Regular Gaps */}
            {translationReport.gaps.filter(gap => !gap.isCritical).length > 0 && (
              <div>
                <h4 className="font-medium text-yellow-700 mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Additional Translation Opportunities
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {translationReport.gaps
                    .filter(gap => !gap.isCritical)
                    .slice(0, 6) // Show first 6
                    .map(gap => (
                      <div key={gap.directory} className="bg-yellow-50 p-2 rounded border border-yellow-200">
                        <div className="font-medium text-yellow-700 text-sm">{gap.directory || 'Root'}</div>
                        <div className="text-xs text-yellow-600">Missing Hebrew version</div>
                      </div>
                    ))
                  }
                  {translationReport.gaps.filter(gap => !gap.isCritical).length > 6 && (
                    <div className="bg-gray-50 p-2 rounded border border-gray-200 flex items-center justify-center">
                      <span className="text-sm text-gray-500">
                        +{translationReport.gaps.filter(gap => !gap.isCritical).length - 6} more...
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}