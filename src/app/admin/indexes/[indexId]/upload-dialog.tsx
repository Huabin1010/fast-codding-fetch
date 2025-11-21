'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Upload, FileText } from 'lucide-react'
import { uploadFileToIndex, uploadTextDocument } from './files/actions'
import { toast } from 'sonner'

interface UploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  indexId: string
  userId: string
  onSuccess: () => void
}

export default function UploadDialog({
  open,
  onOpenChange,
  indexId,
  userId,
  onSuccess,
}: UploadDialogProps) {
  const [fileLoading, setFileLoading] = useState(false)
  const [textLoading, setTextLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [textName, setTextName] = useState('')
  const [textContent, setTextContent] = useState('')

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      toast.error('请选择文件')
      return
    }

    setFileLoading(true)
    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('indexId', indexId)

    const result = await uploadFileToIndex(formData, userId)
    setFileLoading(false)

    if (result.success) {
      toast.success('文件上传成功')
      setSelectedFile(null)
      onSuccess()
      onOpenChange(false)
    } else {
      toast.error(result.error || '上传失败')
    }
  }

  const handleTextUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!textName.trim() || !textContent.trim()) {
      toast.error('请填写文件名和内容')
      return
    }

    setTextLoading(true)
    const result = await uploadTextDocument({
      indexId,
      content: textContent,
      title: textName,
      userId,
    })
    setTextLoading(false)

    if (result.success) {
      toast.success('文本上传成功')
      setTextName('')
      setTextContent('')
      onSuccess()
      onOpenChange(false)
    } else {
      toast.error(result.error || '上传失败')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>上传文件或文本</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="file" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file">
              <Upload className="h-4 w-4 mr-2" />
              上传文件
            </TabsTrigger>
            <TabsTrigger value="text">
              <FileText className="h-4 w-4 mr-2" />
              上传文本
            </TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="space-y-4 mt-4">
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="text-sm font-medium">选择文件</label>
                <Input
                  type="file"
                  accept=".txt,.md,.doc,.docx"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  disabled={fileLoading}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  支持格式: .txt, .md, .doc, .docx
                </p>
              </div>
              <Button type="submit" disabled={fileLoading || !selectedFile} className="w-full">
                {fileLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    上传中...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    上传文件
                  </>
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="text" className="space-y-4 mt-4">
            <form onSubmit={handleTextUpload} className="space-y-4">
              <div>
                <label className="text-sm font-medium">文件名</label>
                <Input
                  value={textName}
                  onChange={(e) => setTextName(e.target.value)}
                  placeholder="例如：产品说明.txt"
                  disabled={textLoading}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">文本内容</label>
                <Textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="输入或粘贴文本内容..."
                  rows={10}
                  disabled={textLoading}
                  className="mt-1"
                />
              </div>
              <Button
                type="submit"
                disabled={textLoading || !textName.trim() || !textContent.trim()}
                className="w-full"
              >
                {textLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    上传中...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    上传文本
                  </>
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
