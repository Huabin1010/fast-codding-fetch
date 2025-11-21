'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Loader2, RotateCcw } from 'lucide-react'
import { searchInIndex } from './search/actions'
import { toast } from 'sonner'

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
  const [topK, setTopK] = useState('5')
  const [minScore, setMinScore] = useState('0.5')

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error('请输入搜索内容')
      return
    }

    setLoading(true)
    setSearched(true)
    const result = await searchInIndex({
      indexId,
      query,
      topK: parseInt(topK),
      minScore: parseFloat(minScore),
      userId,
    })
    setLoading(false)

    if (result.success) {
      setResults(result.data?.results || [])
      if (result.data?.results.length === 0) {
        toast.info('没有找到相关结果，尝试调整搜索参数')
      } else {
        toast.success(`找到 ${result.data?.results.length} 个相关结果`)
      }
    } else {
      toast.error(result.error || '搜索失败')
    }
  }

  const handleReset = () => {
    setQuery('')
    setResults([])
    setSearched(false)
    setTopK('5')
    setMinScore('0.5')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Search Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              语义搜索
            </CardTitle>
            <CardDescription>基于语义相似度搜索文档内容</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">搜索内容</label>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入搜索内容，例如：如何重置密码？"
                disabled={loading}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                将转换为向量进行语义相似度搜索
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">返回结果数</label>
                <Select value={topK} onValueChange={setTopK}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 个结果</SelectItem>
                    <SelectItem value="5">5 个结果</SelectItem>
                    <SelectItem value="10">10 个结果</SelectItem>
                    <SelectItem value="20">20 个结果</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">最低相似度</label>
                <Select value={minScore} onValueChange={setMinScore}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.0">0.0 (全部)</SelectItem>
                    <SelectItem value="0.3">0.3 (低)</SelectItem>
                    <SelectItem value="0.5">0.5 (中)</SelectItem>
                    <SelectItem value="0.7">0.7 (高)</SelectItem>
                    <SelectItem value="0.9">0.9 (极高)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  搜索中...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  搜索相似文档
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Search Tips */}
        <Card>
          <CardHeader>
            <CardTitle>搜索提示</CardTitle>
            <CardDescription>如何获得更好的搜索结果</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <div>
                <div className="font-medium mb-1">💡 使用自然语言</div>
                <p className="text-gray-600">输入完整的问题或描述，而不是单个关键词</p>
              </div>
              <div>
                <div className="font-medium mb-1">🎯 调整相似度阈值</div>
                <p className="text-gray-600">提高阈值获得更精确的结果，降低阈值获得更多结果</p>
              </div>
              <div>
                <div className="font-medium mb-1">📊 增加返回数量</div>
                <p className="text-gray-600">如果结果太少，可以增加返回结果数量</p>
              </div>
            </div>

            {(searched || query) && (
              <Button
                onClick={handleReset}
                variant="outline"
                className="w-full"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                重置搜索
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

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
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="outline">
                          相似度: {((result.score || 0) * 100).toFixed(1)}%
                        </Badge>
                        {result.metadata?.source && (
                          <Badge variant="secondary" className="text-xs">
                            {result.metadata.source}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">#{index + 1}</div>
                    </div>

                    <div className="mb-3">
                      <p className="text-sm leading-relaxed text-gray-700">
                        {result.metadata?.text || '无文本内容'}
                      </p>
                    </div>

                    {result.metadata?.chunkIndex !== undefined && (
                      <div className="text-xs text-gray-500">
                        文档块: {result.metadata.chunkIndex + 1}
                        {result.metadata.totalChunks && ` / ${result.metadata.totalChunks}`}
                      </div>
                    )}
                  </CardContent>
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
