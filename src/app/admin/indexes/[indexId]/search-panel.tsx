'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Loader2 } from 'lucide-react'
import { searchInIndex } from './search/actions'

interface SearchPanelProps {
  indexId: string
  userId: string
  showMessage: (type: 'success' | 'error', text: string) => void
}

export default function SearchPanel({ indexId, userId, showMessage }: SearchPanelProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) {
      showMessage('error', '请输入搜索内容')
      return
    }

    setLoading(true)
    setSearched(true)
    const result = await searchInIndex({
      indexId,
      query,
      topK: 5,
      minScore: 0.5,
      userId,
    })
    setLoading(false)

    if (result.success) {
      setResults(result.data?.results || [])
      if (result.data?.results.length === 0) {
        showMessage('error', '没有找到相关结果')
      }
    } else {
      showMessage('error', result.error || '搜索失败')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            向量搜索
          </CardTitle>
          <CardDescription>基于语义相似度搜索文档内容</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入搜索内容，例如：如何重置密码？"
              disabled={loading}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={loading || !query.trim()}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  搜索
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {searched && (
        <div className="space-y-4">
          {results.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">搜索结果</h3>
                <Badge variant="secondary">{results.length} 个结果</Badge>
              </div>
              {results.map((result, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">
                            相似度: {((result.score || 0) * 100).toFixed(1)}%
                          </Badge>
                          {result.chunk?.file && (
                            <Badge variant="secondary" className="text-xs">
                              {result.chunk.file.name}
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-sm leading-relaxed">
                          {result.chunk?.text || result.metadata?.text}
                        </CardDescription>
                      </div>
                      <div className="text-sm text-gray-500 ml-4">#{index + 1}</div>
                    </div>
                  </CardHeader>
                  {result.chunk && (
                    <CardContent className="pt-0">
                      <div className="text-xs text-gray-500">
                        文档块: {result.chunk.chunkIndex + 1}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </>
          ) : (
            !loading && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Search className="h-16 w-16 text-gray-300 mb-4" />
                  <p className="text-gray-500 text-center">
                    没有找到相关结果
                    <br />
                    尝试使用不同的关键词搜索
                  </p>
                </CardContent>
              </Card>
            )
          )}
        </div>
      )}
    </div>
  )
}
