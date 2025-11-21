'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Save, Trash2 } from 'lucide-react'
import { updateProject, deleteProject } from '../actions'
import { useRouter } from 'next/navigation'

interface ProjectSettingsProps {
  project: any
  userId: string
  onUpdate: () => void
  showMessage: (type: 'success' | 'error', text: string) => void
}

export default function ProjectSettings({
  project,
  userId,
  onUpdate,
  showMessage,
}: ProjectSettingsProps) {
  const router = useRouter()
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description || '')
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      showMessage('error', '项目名称不能为空')
      return
    }

    setLoading(true)
    const result = await updateProject(project.id, userId, { name, description })
    setLoading(false)

    if (result.success) {
      showMessage('success', '项目更新成功')
      onUpdate()
    } else {
      showMessage('error', result.error || '更新失败')
    }
  }

  const handleDelete = async () => {
    if (
      !confirm(
        `确定要删除项目 "${project.name}" 吗？\n\n这将删除所有索引、文件和相关数据，此操作不可恢复！`
      )
    ) {
      return
    }

    setDeleting(true)
    const result = await deleteProject(project.id, userId)
    setDeleting(false)

    if (result.success) {
      showMessage('success', '项目删除成功')
      router.push('/admin/projects')
    } else {
      showMessage('error', result.error || '删除失败')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>项目信息</CardTitle>
          <CardDescription>修改项目的基本信息</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="text-sm font-medium">项目名称</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="项目名称"
                disabled={loading}
              />
            </div>
            <div>
              <label className="text-sm font-medium">项目描述</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="项目描述"
                disabled={loading}
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  保存更改
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">危险操作</CardTitle>
          <CardDescription>删除项目将无法恢复</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              删除此项目将永久删除：
            </p>
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
              <li>所有索引和向量数据</li>
              <li>所有上传的文件</li>
              <li>所有文档块和元数据</li>
            </ul>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="w-full"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  删除中...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  删除项目
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
