'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  Plus,
  Trash2,
  Save,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Globe,
  Link,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Info
} from 'lucide-react'

interface MenuItem {
  id: string
  title: string
  url: string
  target?: '_blank' | '_self'
  children?: MenuItem[]
}

interface MenuConfig {
  [lang: string]: {
    menuItems: MenuItem[]
  }
}

export default function MenuManager() {
  const { t, isRTL } = useLanguage()
  const [menuConfig, setMenuConfig] = useState<MenuConfig>({
    en: { menuItems: [] },
    he: { menuItems: [] }
  })
  const [selectedLang, setSelectedLang] = useState('en')
  const [isSaving, setIsSaving] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [syncStatus, setSyncStatus] = useState<{
    isInSync: boolean
    issueCount: number
    lastChecked: string | null
    isLoading: boolean
    issues?: Array<{
      type: string
      id: string
      description: string
      severity: 'error' | 'warning'
    }>
  }>({
    isInSync: true,
    issueCount: 0,
    lastChecked: null,
    isLoading: false
  })

  useEffect(() => {
    loadMenuConfig()
  }, [])

  const loadMenuConfig = async () => {
    try {
      // Only run on client side
      if (typeof window === 'undefined') return

      const response = await fetch('/api/menu')
      if (response.ok) {
        const data = await response.json()

        // Update sync status from the response
        if (data.syncStatus) {
          setSyncStatus(prev => ({
            ...prev,
            isInSync: data.syncStatus.isInSync,
            issueCount: data.syncStatus.issueCount,
            lastChecked: data.syncStatus.lastChecked,
            isLoading: false
          }))
        }

        // Transform the data to match our component structure
        if (data && data.mainMenu) {
          // Convert from flat menu structure to language-specific structure
          const menuItems = data.mainMenu.map((item: any) => ({
            id: item.id,
            title: item.title,
            url: item.url,
            children: item.children || []
          }))

          setMenuConfig({
            en: { menuItems },
            he: { menuItems } // For now, using same menu for both languages
          })
        } else {
          // Fallback to default structure if API returns invalid data
          setMenuConfig({
            en: { menuItems: [] },
            he: { menuItems: [] }
          })
        }
      } else {
        // API call failed, use default empty structure
        setMenuConfig({
          en: { menuItems: [] },
          he: { menuItems: [] }
        })
      }
    } catch (error) {
      console.error('Failed to load menu:', error)
      // Fallback to default structure on error
      setMenuConfig({
        en: { menuItems: [] },
        he: { menuItems: [] }
      })
    }
  }

  const saveMenuConfig = async () => {
    setIsSaving(true)
    try {
      // Only run on client side
      if (typeof window === 'undefined') return

      // Convert our component structure back to the API format
      const menuData = {
        mainMenu: menuConfig[selectedLang].menuItems,
        lastUpdated: new Date().toISOString()
      }

      const response = await fetch('/api/menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(menuData)
      })

      if (response.ok) {
        const result = await response.json()
        alert(result.message || 'Menu saved and HTML files updated successfully!')
        // Reload to ensure we have the latest data
        await loadMenuConfig()
        // Check sync status after saving
        await checkSyncStatus()
      } else {
        const error = await response.json()
        alert(`Failed to save menu: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save menu. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const addMenuItem = (parentId?: string) => {
    const newItem: MenuItem = {
      id: `item-${Date.now()}`,
      title: 'New Item',
      url: '#'
    }

    setMenuConfig(prev => {
      const newConfig = { ...prev }
      const lang = selectedLang

      if (parentId) {
        const parent = findMenuItem(newConfig[lang].menuItems, parentId)
        if (parent) {
          if (!parent.children) parent.children = []
          parent.children.push(newItem)
        }
      } else {
        newConfig[lang].menuItems.push(newItem)
      }

      return newConfig
    })
  }

  const findMenuItem = (items: MenuItem[], id: string): MenuItem | null => {
    for (const item of items) {
      if (item.id === id) return item
      if (item.children) {
        const found = findMenuItem(item.children, id)
        if (found) return found
      }
    }
    return null
  }

  const updateMenuItem = (id: string, field: keyof MenuItem, value: string) => {
    setMenuConfig(prev => {
      const newConfig = { ...prev }
      const item = findMenuItem(newConfig[selectedLang].menuItems, id)
      if (item) {
        (item as any)[field] = value
      }
      return newConfig
    })
  }

  const deleteMenuItem = (id: string) => {
    setMenuConfig(prev => {
      const newConfig = { ...prev }
      const lang = selectedLang

      const removeItem = (items: MenuItem[]): MenuItem[] => {
        return items.filter(item => {
          if (item.id === id) return false
          if (item.children) {
            item.children = removeItem(item.children)
          }
          return true
        })
      }

      newConfig[lang].menuItems = removeItem(newConfig[lang].menuItems)
      return newConfig
    })
  }

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const checkSyncStatus = async () => {
    setSyncStatus(prev => ({ ...prev, isLoading: true }))
    try {
      const response = await fetch('/api/menu?action=validate')
      if (response.ok) {
        const data = await response.json()
        setSyncStatus({
          isInSync: data.sync?.isInSync || false,
          issueCount: data.sync?.totalIssues || 0,
          lastChecked: data.lastChecked,
          isLoading: false,
          issues: data.sync?.issues || []
        })
      }
    } catch (error) {
      console.error('Failed to check sync status:', error)
      setSyncStatus(prev => ({ ...prev, isLoading: false }))
    }
  }

  const performAutoSync = async () => {
    setSyncStatus(prev => ({ ...prev, isLoading: true }))
    try {
      const response = await fetch('/api/menu?action=sync')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          alert(data.message || 'Auto-sync completed successfully!')
          // Reload menu to get updated data
          await loadMenuConfig()
          // Re-check sync status
          await checkSyncStatus()
        } else {
          alert(`Auto-sync failed: ${data.error}`)
        }
      }
    } catch (error) {
      console.error('Auto-sync failed:', error)
      alert('Auto-sync failed. Please try again.')
    } finally {
      setSyncStatus(prev => ({ ...prev, isLoading: false }))
    }
  }

  const renderMenuItem = (item: MenuItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.has(item.id)

    return (
      <div key={item.id} className="mb-2">
        <div
          className={`flex items-center gap-2 p-3 bg-white border rounded-lg ${
            depth > 0 ? 'ml-8' : ''
          }`}
        >
          <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />

          {hasChildren && (
            <button
              onClick={() => toggleExpanded(item.id)}
              className="p-1"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}

          <Input
            value={item.title}
            onChange={(e) => updateMenuItem(item.id, 'title', e.target.value)}
            className="flex-1"
            placeholder={t('menuTitle')}
          />

          <Input
            value={item.url}
            onChange={(e) => updateMenuItem(item.id, 'url', e.target.value)}
            className="flex-1"
            placeholder={t('url')}
          />

          <select
            value={item.target || '_self'}
            onChange={(e) => updateMenuItem(item.id, 'target', e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="_self">{t('sameTab')}</option>
            <option value="_blank">{t('newTab')}</option>
          </select>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => addMenuItem(item.id)}
          >
            <Plus className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => deleteMenuItem(item.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-2">
            {item.children!.map(child => renderMenuItem(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader>
        <CardTitle>{t('menuManager')}</CardTitle>
        <CardDescription>{t('configureMenus')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Language Selector */}
          <div className="flex items-center gap-4 mb-4">
            <Label>{t('language')}:</Label>
            <div className="flex gap-2">
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

          {/* Sync Status */}
          <div className="mb-4 p-4 border rounded-lg bg-gray-50" data-testid="sync-status">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {syncStatus.isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-500" data-testid="sync-indicator" />
                ) : syncStatus.isInSync ? (
                  <CheckCircle className="h-4 w-4 text-green-500" data-testid="sync-indicator" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-500" data-testid="sync-indicator" />
                )}
                <span className="font-medium">
                  {syncStatus.isLoading ? 'Checking sync status...' :
                   syncStatus.isInSync ? 'Menu in sync' :
                   `${syncStatus.issueCount} sync issue(s) detected`}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={checkSyncStatus}
                  disabled={syncStatus.isLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${syncStatus.isLoading ? 'animate-spin' : ''}`} />
                  Check Sync
                </Button>
                {!syncStatus.isInSync && !syncStatus.isLoading && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={performAutoSync}
                    disabled={syncStatus.isLoading}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Auto-Sync
                  </Button>
                )}
              </div>
            </div>

            {syncStatus.lastChecked && (
              <div className="text-sm text-gray-500 mb-2">
                Last checked: {new Date(syncStatus.lastChecked).toLocaleString()}
              </div>
            )}

            {!syncStatus.isInSync && syncStatus.issues && syncStatus.issues.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-1 text-sm font-medium text-amber-700">
                  <Info className="h-4 w-4" />
                  Sync Issues:
                </div>
                <div className="space-y-1 text-sm">
                  {syncStatus.issues.slice(0, 5).map((issue, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded border-l-4 ${
                        issue.severity === 'error'
                          ? 'bg-red-50 border-l-red-400 text-red-700'
                          : 'bg-amber-50 border-l-amber-400 text-amber-700'
                      }`}
                    >
                      <div className="font-medium">{issue.type.replace(/_/g, ' ').toUpperCase()}</div>
                      <div>{issue.description}</div>
                    </div>
                  ))}
                  {syncStatus.issues.length > 5 && (
                    <div className="text-gray-500 text-xs">
                      ...and {syncStatus.issues.length - 5} more issues
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div className="space-y-2">
            {(menuConfig[selectedLang]?.menuItems || []).map(item => renderMenuItem(item))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button onClick={() => addMenuItem()}>
              <Plus className="h-4 w-4 mr-2" />
              {t('addMenuItem')}
            </Button>
            <Button
              onClick={saveMenuConfig}
              disabled={isSaving}
              variant="default"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? t('saving') : t('saveMenu')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}