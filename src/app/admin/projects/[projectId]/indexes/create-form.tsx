'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Plus } from 'lucide-react'
import { createIndex } from './actions'

interface CreateIndexFormProps {
  projectId: string
  userId: string
  onSuccess: () => void
  showMessage: (type: 'success' | 'error', text: string) => void
}

const EMBEDDING_DIMENSION = Number(process.env.NEXT_PUBLIC_EMBEDDING_DIMENSION) || 1536

export default function CreateIndexForm({
  projectId,
  userId,
  onSuccess,
  showMessage,
}: CreateIndexFormProps) {
  const [name, setName] = useState('')
  const [dimension] = useState(EMBEDDING_DIMENSION)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      showMessage('error', '索引名称不能为空')
      return
    }

    // 验证索引名称格式（只允许字母、数字、下划线）
    if (!/^[a-zA-Z0-9_]+$/.test(name)) {
      showMessage('error', '索引名称只能包含字母、数字和下划线')
      return
    }

    setLoading(true)
    const result = await createIndex({ projectId, name, dimension, userId })
    setLoading(false)

    if (result.success) {
      showMessage('success', '索引创建成功')
      setName('')
      onSuccess()
    } else {
      showMessage('error', result.error || '创建失败')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          创建新索引
        </CardTitle>
        <CardDescription>在项目中创建一个新的向量索引</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">索引名称</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：faq_index_2024"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">只能使用字母、数字和下划线</p>
          </div>
          <div>
            <label className="text-sm font-medium">向量维度</label>
            <Input value={dimension} readOnly className="bg-gray-50 cursor-not-allowed" />
            <p className="text-xs text-gray-500 mt-1">
              默认维度为 {dimension}（OpenAI embedding 标准）
            </p>
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
                创建索引
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
