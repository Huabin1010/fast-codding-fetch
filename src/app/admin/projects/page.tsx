'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, FolderOpen, Loader2 } from 'lucide-react'
import { getProjectList } from './actions'
import CreateProjectForm from './create-form'
import Link from 'next/link'
import { toast } from 'sonner'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)

  // TODO: 从认证系统获取 userId
  // 当前使用管理员用户 ID (匹配 NextAuth 中的默认管理员账号)
  // 默认管理员: admin / 123456qq
  // 如果遇到 "User not found" 错误，请运行: pnpm db:seed
  const userId = '1'

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    setLoading(true)
    const result = await getProjectList(userId)
    if (result.success) {
      setProjects(result.data || [])
    } else {
      toast.error(result.error || '加载项目失败')
    }
    setLoading(false)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">我的项目</h1>
          <p className="text-gray-600 mt-1">管理您的向量索引项目</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="h-4 w-4 mr-2" />
          创建项目
        </Button>
      </div>

      {showCreateForm && (
        <CreateProjectForm
          userId={userId}
          onSuccess={() => {
            setShowCreateForm(false)
            loadProjects()
          }}
        />
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-center">
              还没有项目
              <br />
              点击上方按钮创建您的第一个项目
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/admin/projects/${project.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5" />
                    {project.name}
                  </CardTitle>
                  {project.description && (
                    <CardDescription>{project.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{project._count.indexes} 个索引</span>
                    <span>{new Date(project.updatedAt).toLocaleDateString('zh-CN')}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
