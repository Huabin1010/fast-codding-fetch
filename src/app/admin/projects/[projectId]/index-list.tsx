'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Database, Trash2, Loader2, FileText } from 'lucide-react'
import { getIndexList, deleteIndex } from './indexes/actions'
import CreateIndexForm from './indexes/create-form'
import Link from 'next/link'

interface IndexListProps {
  projectId: string
  userId: string
  showMessage: (type: 'success' | 'error', text: string) => void
}

export default function IndexList({ projectId, userId, showMessage }: IndexListProps) {
  const [indexes, setIndexes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    loadIndexes()
  }, [])

  const loadIndexes = async () => {
    setLoading(true)
    const result = await getIndexList(projectId, userId)
    if (result.success) {
      setIndexes(result.data || [])
    } else {
      showMessage('error', result.error || '加载索引失败')
    }
    setLoading(false)
  }

  const handleDelete = async (indexId: string, indexName: string) => {
    if (!confirm(`确定要删除索引 "${indexName}" 吗？这将删除所有相关文件和数据。`)) return

    const result = await deleteIndex(indexId, userId)
    if (result.success) {
      showMessage('success', '索引删除成功')
      loadIndexes()
    } else {
      showMessage('error', result.error || '删除失败')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">索引列表</h2>
          <p className="text-sm text-gray-600 mt-1">管理项目中的向量索引</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="h-4 w-4 mr-2" />
          创建索引
        </Button>
      </div>

      {showCreateForm && (
        <CreateIndexForm
          projectId={projectId}
          userId={userId}
          onSuccess={() => {
            setShowCreateForm(false)
            loadIndexes()
          }}
          showMessage={showMessage}
        />
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : indexes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Database className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-center">
              还没有索引
              <br />
              点击上方按钮创建您的第一个索引
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {indexes.map((index) => (
            <Card key={index.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    <span className="truncate">{index.name}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(index.id, index.name)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardTitle>
                <CardDescription>维度: {index.dimension}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {index._count.files} 个文件
                    </span>
                    <span className="text-xs">
                      {new Date(index.createdAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                  <Link href={`/admin/indexes/${index.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      查看详情
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
