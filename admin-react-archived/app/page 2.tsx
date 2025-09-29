'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import MenuManager from '@/components/MenuManager'
import PageEditor from '@/components/PageEditor'
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
  Navigation
} from 'lucide-react'

export default function AdminDashboard() {
  const [isSidebarOpen, setSidebarOpen] = useState(true)
  const [activeSection, setActiveSection] = useState('dashboard')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      router.push('/admin/login')
    } else {
      setIsAuthenticated(true)
    }
  }, [router])

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pages', label: 'Page Editor', icon: FileText },
    { id: 'menu', label: 'Menu Manager', icon: Navigation },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    router.push('/admin/login')
  }

  if (!isAuthenticated) {
    return null
  }

  const pages = [
    { id: 1, title: 'Home', status: 'Published', lastModified: '2024-09-28' },
    { id: 2, title: 'Class Action Lawsuits', status: 'Published', lastModified: '2024-09-27' },
    { id: 3, title: 'Our Team', status: 'Published', lastModified: '2024-09-26' },
    { id: 4, title: 'Case Studies & Results', status: 'Published', lastModified: '2024-09-25' },
    { id: 5, title: 'Consumer Protection', status: 'Published', lastModified: '2024-09-24' },
    { id: 6, title: 'Securities Litigation', status: 'Published', lastModified: '2024-09-23' },
    { id: 7, title: 'Contact Us', status: 'Published', lastModified: '2024-09-22' },
    { id: 8, title: 'Privacy Policy', status: 'Published', lastModified: '2024-09-20' },
  ]

  const [stats, setStats] = useState([
    { label: 'Total Pages', value: '24', change: '+2 this week' },
    { label: 'Total Visitors', value: '1,234', change: '+15% this month' },
    { label: 'Contact Forms', value: '45', change: '5 new today' },
    { label: 'Active Cases', value: '12', change: '3 in progress' },
  ])

  const [isLoadingStats, setIsLoadingStats] = useState(false)

  // Fetch real analytics data
  useEffect(() => {
    if (isAuthenticated && activeSection === 'dashboard') {
      fetchAnalyticsData()
    }
  }, [isAuthenticated, activeSection])

  const fetchAnalyticsData = async () => {
    setIsLoadingStats(true)
    try {
      const response = await fetch('/api/analytics')
      if (response.ok) {
        const data = await response.json()
        setStats([
          {
            label: 'Total Pages',
            value: data.totalPages?.toString() || '24',
            change: '+2 this week'
          },
          {
            label: 'Total Visitors',
            value: data.totalVisitors?.toLocaleString() || '1,234',
            change: '+15% this month'
          },
          {
            label: 'Contact Forms',
            value: data.contactForms?.toString() || '45',
            change: '5 new today'
          },
          {
            label: 'Active Cases',
            value: data.activeCases?.toString() || '12',
            change: '3 in progress'
          },
        ])
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
      // Keep default mock data if API fails
    } finally {
      setIsLoadingStats(false)
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-16'} bg-white border-r transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b flex items-center justify-between">
          <h1 className={`font-bold text-xl ${!isSidebarOpen && 'hidden'}`}>Admin Panel</h1>
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
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-semibold capitalize">{activeSection}</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search..."
                  className="pl-10 w-64"
                />
              </div>
              {activeSection === 'dashboard' && (
                <Button
                  variant="outline"
                  onClick={fetchAnalyticsData}
                  disabled={isLoadingStats}
                >
                  {isLoadingStats ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                      Refreshing...
                    </>
                  ) : (
                    'Refresh Data'
                  )}
                </Button>
              )}
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                New Page
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
                  <Card key={index} className={isLoadingStats ? 'opacity-50' : ''}>
                    <CardHeader className="pb-2">
                      <CardDescription>{stat.label}</CardDescription>
                      <CardTitle className="text-3xl">
                        {isLoadingStats ? (
                          <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                        ) : (
                          stat.value
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {isLoadingStats ? (
                          <div className="animate-pulse bg-gray-200 h-4 w-24 rounded"></div>
                        ) : (
                          stat.change
                        )}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Recent Pages Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Pages</CardTitle>
                  <CardDescription>Manage your website content</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Title</th>
                          <th className="text-left p-2">Status</th>
                          <th className="text-left p-2">Last Modified</th>
                          <th className="text-left p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pages.map((page) => (
                          <tr key={page.id} className="border-b">
                            <td className="p-2">{page.title}</td>
                            <td className="p-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {page.status}
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

          {activeSection === 'menu' && <MenuManager />}

          {activeSection === 'settings' && (
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>Configure admin panel settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="site-name">Site Name</Label>
                  <Input id="site-name" defaultValue="Normand PLLC" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Admin Email</Label>
                  <Input id="admin-email" type="email" defaultValue="admin@normandpllc.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input id="timezone" defaultValue="America/New_York" />
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save Settings</Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}