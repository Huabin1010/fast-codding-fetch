'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, FolderOpen, CheckCircle, XCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getProject } from '../actions'
import IndexList from './index-list'
import ProjectSettings from './project-settings'
import Link from 'next/link'

export default function ProjectDetailPage({ params }: { params: { projectId: string } }) {
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const userId = 'demo-user-id'

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  useEffect(() => {
    loadProject()
  }, [])

  const loadProject = async () => {
    setLoading(true)
    const result = await getProject(params.projectId, userId)
    if (result.success) {
      setProject(result.data)
    } else {
      showMessage('error', result.error || '加载项目失败')
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="container mx-auto p-6">
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">项目不存在或无权访问</AlertDescription>
        </Alert>
        <Link href="/admin/projects">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回项目列表
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/projects">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <FolderOpen className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            {project.description && <p className="text-gray-600 mt-1">{project.description}</p>}
          </div>
        </div>
      </div>

      {message && (
        <Alert
          className={
            message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
          }
        >
          {message.type === 'error' ? (
            <XCircle className="h-4 w-4 text-red-600" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-600" />
          )}
          <AlertDescription
            className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}
          >
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="indexes" className="space-y-6">
        <TabsList>
          <TabsTrigger value="indexes">索引管理</TabsTrigger>
          <TabsTrigger value="settings">项目设置</TabsTrigger>
        </TabsList>

        <TabsContent value="indexes">
          <IndexList
            projectId={params.projectId}
            userId={userId}
            showMessage={showMessage}
          />
        </TabsContent>

        <TabsContent value="settings">
          <ProjectSettings
            project={project}
            userId={userId}
            onUpdate={loadProject}
            showMessage={showMessage}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
