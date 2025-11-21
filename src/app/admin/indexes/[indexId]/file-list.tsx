'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronDown, ChevronRight, FileText, Trash2, Loader2, Upload } from 'lucide-react'
import { getFileList, deleteFile, getFileChunks } from './files/actions'
import UploadDialog from './upload-dialog'
import { toast } from 'sonner'

interface FileListProps {
  indexId: string
  userId: string
  showMessage: (type: 'success' | 'error', text: string) => void
}

export default function FileList({ indexId, userId, showMessage }: FileListProps) {
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [expandedFile, setExpandedFile] = useState<string | null>(null)
  const [chunks, setChunks] = useState<Record<string, any[]>>({})

  useEffect(() => {
    loadFiles()
  }, [])

  const loadFiles = async () => {
    setLoading(true)
    const result = await getFileList(indexId, userId)
    if (result.success) {
      setFiles(result.data || [])
    } else {
      toast.error(result.error || '加载文件失败')
    }
    setLoading(false)
  }

  const loadChunks = async (fileId: string) => {
    if (chunks[fileId]) {
      // 已经加载过，直接展开/收起
      setExpandedFile(expandedFile === fileId ? null : fileId)
      return
    }

    const result = await getFileChunks(fileId, userId)
    if (result.success && result.data) {
      setChunks(prev => ({ ...prev, [fileId]: result.data }))
      setExpandedFile(fileId)
    } else {
      toast.error(result.error || '加载文档块失败')
    }
  }

  const handleDelete = async (fileId: string, fileName: string) => {
    if (!confirm(`确定要删除文件 "${fileName}" 吗？这将删除所有相关的文档块。`)) return

    const result = await deleteFile(fileId, userId)
    if (result.success) {
      toast.success('文件删除成功')
      loadFiles()
      // 清除缓存的 chunks
      setChunks(prev => {
        const newChunks = { ...prev }
        delete newChunks[fileId]
        return newChunks
      })
      if (expandedFile === fileId) {
        setExpandedFile(null)
      }
    } else {
      toast.error(result.error || '删除失败')
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
        <Button onClick={() => setShowUploadDialog(true)}>
          <Upload className="h-4 w-4 mr-2" />
          上传文件/文本
        </Button>
      </div>

      <UploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        indexId={indexId}
        userId={userId}
        onSuccess={loadFiles}
      />

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
            <Card key={file.id} className="overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => loadChunks(file.id)}
                      className="p-1 h-auto"
                    >
                      {expandedFile === file.id ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                    <FileText className="h-5 w-5 mt-0.5 text-blue-500" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{file.name}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        {formatFileSize(file.size)} · {file._count.chunks} 个文档块 ·{' '}
                        {new Date(file.createdAt).toLocaleString('zh-CN')}
                      </div>
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

                {/* Chunks 列表 */}
                {expandedFile === file.id && chunks[file.id] && (
                  <div className="mt-4 space-y-2 pl-12">
                    {(() => {
                      const allChunks = chunks[file.id]
                      const totalChunks = allChunks.length

                      // 如果总数小于等于4个，全部显示
                      if (totalChunks <= 4) {
                        return allChunks.map((chunk: any, idx: number) => (
                          <Card key={`${file.id}-${chunk.id}-${idx}`} className="bg-gray-50">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="text-sm font-medium">
                                  Chunk {chunk.chunkIndex + 1} / {totalChunks}
                                </div>
                                <div className="text-xs text-gray-500">
                                  ID: {chunk.vectorId}
                                </div>
                              </div>
                              <div
                                id={`chunk-text-${file.id}-${idx}`}
                                className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-3"
                              >
                                {chunk.text}
                              </div>
                              <Button
                                variant="link"
                                size="sm"
                                className="mt-2 p-0 h-auto text-blue-600"
                                onClick={() => {
                                  const element = document.getElementById(
                                    `chunk-text-${file.id}-${idx}`
                                  )
                                  if (element) {
                                    element.classList.toggle('line-clamp-3')
                                  }
                                }}
                              >
                                展开/收起
                              </Button>
                            </CardContent>
                          </Card>
                        ))
                      }

                      // 显示前2个和后2个
                      const firstTwo = allChunks.slice(0, 2)
                      const lastTwo = allChunks.slice(-2)
                      const hiddenCount = totalChunks - 4

                      return (
                        <>
                          {firstTwo.map((chunk: any, idx: number) => (
                            <Card key={`${file.id}-${chunk.id}-${idx}`} className="bg-gray-50">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="text-sm font-medium">
                                    Chunk {chunk.chunkIndex + 1} / {totalChunks}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    ID: {chunk.vectorId}
                                  </div>
                                </div>
                                <div
                                  id={`chunk-text-${file.id}-${idx}`}
                                  className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-3"
                                >
                                  {chunk.text}
                                </div>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="mt-2 p-0 h-auto text-blue-600"
                                  onClick={() => {
                                    const element = document.getElementById(
                                      `chunk-text-${file.id}-${idx}`
                                    )
                                    if (element) {
                                      element.classList.toggle('line-clamp-3')
                                    }
                                  }}
                                >
                                  展开/收起
                                </Button>
                              </CardContent>
                            </Card>
                          ))}

                          {/* 省略号提示 */}
                          <div className="flex items-center justify-center py-4 text-gray-500">
                            <div className="text-sm">··· {hiddenCount} 个文档块已隐藏 ···</div>
                          </div>

                          {/* 显示后2个 */}
                          {lastTwo.map((chunk: any, idx: number) => {
                            const actualIdx = totalChunks - 2 + idx
                            return (
                              <Card
                                key={`${file.id}-${chunk.id}-${actualIdx}`}
                                className="bg-gray-50"
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="text-sm font-medium">
                                      Chunk {chunk.chunkIndex + 1} / {totalChunks}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      ID: {chunk.vectorId}
                                    </div>
                                  </div>
                                  <div
                                    id={`chunk-text-${file.id}-${actualIdx}`}
                                    className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-3"
                                  >
                                    {chunk.text}
                                  </div>
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="mt-2 p-0 h-auto text-blue-600"
                                    onClick={() => {
                                      const element = document.getElementById(
                                        `chunk-text-${file.id}-${actualIdx}`
                                      )
                                      if (element) {
                                        element.classList.toggle('line-clamp-3')
                                      }
                                    }}
                                  >
                                    展开/收起
                                  </Button>
                                </CardContent>
                              </Card>
                            )
                          })}
                        </>
                      )
                    })()}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
