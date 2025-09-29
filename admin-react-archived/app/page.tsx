'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/contexts/LanguageContext'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import MenuManager from '@/components/MenuManager'
import PageEditor from '@/components/PageEditor'
import SectionEditor from '@/components/SectionEditor'
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  Menu as MenuIcon,
  X,
  Home,
  PlusCircle,
  Edit,
  Trash2,
  Search,
  LogOut,
  Navigation,
  Layers
} from 'lucide-react'

export default function AdminDashboard() {
  const [isSidebarOpen, setSidebarOpen] = useState(true)
  const [activeSection, setActiveSection] = useState('dashboard')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const { t, isRTL } = useLanguage()

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('adminToken')
      if (!token) {
        router.push('/login')
      } else {
        setIsAuthenticated(true)
      }
    }
  }, [router])

  const menuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'pages', label: t('pageEditor'), icon: FileText },
    { id: 'sections', label: t('sectionEditor'), icon: Layers },
    { id: 'menu', label: t('menuManager'), icon: Navigation },
    { id: 'settings', label: t('settings'), icon: Settings },
  ]

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    router.push('/login')
  }

  if (!isAuthenticated) {
    return null
  }

  const pages = [
    { id: 1, title: 'Home', status: 'Published', lastModified: '2024-01-15' },
    { id: 2, title: 'Class Action', status: 'Published', lastModified: '2024-01-14' },
    { id: 3, title: 'Our Team', status: 'Published', lastModified: '2024-01-13' },
    { id: 4, title: 'Contact Us', status: 'Published', lastModified: '2024-01-12' },
  ]

  const stats = [
    { label: t('totalPages'), value: '24', change: `+2 ${t('thisWeek')}` },
    { label: t('totalVisitors'), value: '1,234', change: `+15% ${t('thisMonth')}` },
    { label: t('contactForms'), value: '45', change: `5 ${t('newToday')}` },
    { label: t('activeCases'), value: '12', change: `3 ${t('inProgress')}` },
  ]

  return (
    <div className={`flex h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-16'} bg-white ${isRTL ? 'border-l' : 'border-r'} transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b flex items-center justify-between">
          <h1 className={`font-bold text-xl ${!isSidebarOpen && 'hidden'}`}>{t('adminPanel')}</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <X className="h-4 w-4" /> : <MenuIcon className="h-4 w-4" />}
          </Button>
        </div>

        <nav className="flex-1 p-4">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-2 transition-colors ${
                  activeSection === item.id
                    ? 'bg-primary text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                <Icon className="h-5 w-5" />
                {isSidebarOpen && <span>{item.label}</span>}
              </button>
            )
          })}
        </nav>

        <div className="p-4 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-3" />
            {isSidebarOpen && <span>{t('logout')}</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-semibold">{
                menuItems.find(item => item.id === activeSection)?.label || activeSection
              }</h2>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <div className="relative">
                <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400`} />
                <Input
                  type="search"
                  placeholder={t('search')}
                  className={`${isRTL ? 'pr-10' : 'pl-10'} w-64`}
                />
              </div>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                {t('newPage')}
              </Button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6">
          {activeSection === 'dashboard' && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {stats.map((stat, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-2">
                      <CardDescription>{stat.label}</CardDescription>
                      <CardTitle className="text-3xl">{stat.value}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{stat.change}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Recent Pages Table */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('recentPages')}</CardTitle>
                  <CardDescription>{t('manageWebsiteContent')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className={`${isRTL ? 'text-right' : 'text-left'} p-2`}>{t('title')}</th>
                          <th className={`${isRTL ? 'text-right' : 'text-left'} p-2`}>{t('status')}</th>
                          <th className={`${isRTL ? 'text-right' : 'text-left'} p-2`}>{t('lastModified')}</th>
                          <th className={`${isRTL ? 'text-right' : 'text-left'} p-2`}>{t('actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pages.map((page) => (
                          <tr key={page.id} className="border-b">
                            <td className="p-2">{page.title}</td>
                            <td className="p-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {t('published')}
                              </span>
                            </td>
                            <td className="p-2 text-gray-500">{page.lastModified}</td>
                            <td className="p-2">
                              <div className="flex gap-2">
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {activeSection === 'pages' && <PageEditor />}

          {activeSection === 'sections' && <SectionEditor />}

          {activeSection === 'menu' && <MenuManager />}

          {activeSection === 'settings' && (
            <Card>
              <CardHeader>
                <CardTitle>{t('settings')}</CardTitle>
                <CardDescription>{t('configureSettings')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="site-name">{t('siteName')}</Label>
                  <Input id="site-name" defaultValue="Normand PLLC" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-email">{t('adminEmail')}</Label>
                  <Input id="admin-email" type="email" defaultValue="admin@normandpllc.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">{t('timezone')}</Label>
                  <Input id="timezone" defaultValue="America/New_York" />
                </div>
              </CardContent>
              <CardFooter>
                <Button>{t('saveSettings')}</Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}