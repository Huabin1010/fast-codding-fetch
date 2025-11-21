'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, FileText } from 'lucide-react'
import { uploadTextDocument } from './files/actions'

interface UploadTextFormProps {
  indexId: string
  userId: string
  onSuccess: () => void
  showMessage: (type: 'success' | 'error', text: string) => void
}

export default function UploadTextForm({
  indexId,
  userId,
  onSuccess,
  showMessage,
}: UploadTextFormProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      showMessage('error', '内容不能为空')
      return
    }

    setLoading(true)
    const result = await uploadTextDocument({
      indexId,
      content,
      title: title || undefined,
      userId,
    })
    setLoading(false)

    if (result.success) {
      showMessage('success', result.message || '文本上传成功')
      setTitle('')
      setContent('')
      onSuccess()
    } else {
      showMessage('error', result.error || '上传失败')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          上传文本内容
        </CardTitle>
        <CardDescription>直接输入或粘贴文本内容进行处理</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">标题（可选）</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：产品使用指南"
              disabled={loading}
            />
          </div>
          <div>
            <label className="text-sm font-medium">文本内容</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="在此输入或粘贴文本内容..."
              disabled={loading}
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              文本将被自动分块并生成向量嵌入
            </p>
          </div>

          <Button type="submit" disabled={loading || !content.trim()} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                处理中...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                上传并处理
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
