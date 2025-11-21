'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Plus } from 'lucide-react'
import { createProject } from './actions'
import { toast } from 'sonner'

interface CreateProjectFormProps {
  userId: string
  onSuccess: () => void
}

export default function CreateProjectForm({
  userId,
  onSuccess,
}: CreateProjectFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('项目名称不能为空')
      return
    }

    setLoading(true)
    const result = await createProject({ name, description, userId })
    setLoading(false)

    if (result.success) {
      toast.success('项目创建成功')
      setName('')
      setDescription('')
      onSuccess()
    } else {
      toast.error(result.error || '创建失败')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          创建新项目
        </CardTitle>
        <CardDescription>创建一个新的向量索引项目</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">项目名称</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：客户服务知识库"
              disabled={loading}
            />
          </div>
          <div>
            <label className="text-sm font-medium">项目描述（可选）</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简要描述项目用途"
              disabled={loading}
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                创建中...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                创建项目
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
