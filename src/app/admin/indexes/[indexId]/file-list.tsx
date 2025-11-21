'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, FileText, Trash2, Loader2, Upload } from 'lucide-react'
import { getFileList, deleteFile } from './files/actions'
import UploadFileForm from './upload-file-form'
import UploadTextForm from './upload-text-form'

interface FileListProps {
  indexId: string
  userId: string
  showMessage: (type: 'success' | 'error', text: string) => void
}

export default function FileList({ indexId, userId, showMessage }: FileListProps) {
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadFile, setShowUploadFile] = useState(false)
  const [showUploadText, setShowUploadText] = useState(false)

  useEffect(() => {
    loadFiles()
  }, [])

  const loadFiles = async () => {
    setLoading(true)
    const result = await getFileList(indexId, userId)
    if (result.success) {
      setFiles(result.data || [])
    } else {
      showMessage('error', result.error || '加载文件失败')
    }
    setLoading(false)
  }

  const handleDelete = async (fileId: string, fileName: string) => {
    if (!confirm(`确定要删除文件 "${fileName}" 吗？这将删除所有相关的文档块。`)) return

    const result = await deleteFile(fileId, userId)
    if (result.success) {
      showMessage('success', '文件删除成功')
      loadFiles()
    } else {
      showMessage('error', result.error || '删除失败')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">文件列表</h2>
          <p className="text-sm text-gray-600 mt-1">管理索引中的文件和文档</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowUploadText(!showUploadText)}>
            <Plus className="h-4 w-4 mr-2" />
            上传文本
          </Button>
          <Button onClick={() => setShowUploadFile(!showUploadFile)}>
            <Upload className="h-4 w-4 mr-2" />
            上传文件
          </Button>
        </div>
      </div>

      {showUploadFile && (
        <UploadFileForm
          indexId={indexId}
          userId={userId}
          onSuccess={() => {
            setShowUploadFile(false)
            loadFiles()
          }}
          showMessage={showMessage}
        />
      )}

      {showUploadText && (
        <UploadTextForm
          indexId={indexId}
          userId={userId}
          onSuccess={() => {
            setShowUploadText(false)
            loadFiles()
          }}
          showMessage={showMessage}
        />
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : files.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-center">
              还没有文件
              <br />
              点击上方按钮上传您的第一个文件
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {files.map((file) => (
            <Card key={file.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <FileText className="h-5 w-5 mt-0.5 text-blue-500" />
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{file.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {formatFileSize(file.size)} · {file._count.chunks} 个文档块 ·{' '}
                        {new Date(file.createdAt).toLocaleString('zh-CN')}
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(file.id, file.name)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
