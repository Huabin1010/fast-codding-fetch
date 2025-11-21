'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Upload, FileText } from 'lucide-react'
import { uploadFileToIndex } from './files/actions'

interface UploadFileFormProps {
  indexId: string
  userId: string
  onSuccess: () => void
  showMessage: (type: 'success' | 'error', text: string) => void
}

export default function UploadFileForm({
  indexId,
  userId,
  onSuccess,
  showMessage,
}: UploadFileFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedFile) {
      showMessage('error', '请选择文件')
      return
    }

    setLoading(true)
    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('indexId', indexId)

    const result = await uploadFileToIndex(formData, userId)
    setLoading(false)

    if (result.success) {
      showMessage('success', result.message || '文件上传成功')
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      onSuccess()
    } else {
      showMessage('error', result.error || '上传失败')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          上传文件
        </CardTitle>
        <CardDescription>上传 Word 文档（.docx）进行处理</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">选择文件</label>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              disabled={loading}
              className="cursor-pointer"
            />
            <p className="text-xs text-gray-500 mt-1">仅支持 .docx 格式的 Word 文档</p>
          </div>

          {selectedFile && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <FileText className="h-4 w-4 text-blue-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-gray-600">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
          )}

          <Button type="submit" disabled={loading || !selectedFile} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                处理中...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                上传并处理
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
