'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  FolderOpen,
  Database,
  FileText,
  TrendingUp,
  Plus,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { getProjectList } from './projects/actions'
import Link from 'next/link'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalIndexes: 0,
    totalFiles: 0,
    recentProjects: [] as any[],
  })
  const [loading, setLoading] = useState(true)

  const userId = 'demo-user-id'

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    const result = await getProjectList(userId)

    if (result.success) {
      const projects = result.data || []
      const totalProjects = projects.length
      const totalIndexes = projects.reduce((sum, p) => sum + (p._count?.indexes || 0), 0)

      setStats({
        totalProjects,
        totalIndexes,
        totalFiles: 0, // 需要额外查询
        recentProjects: projects.slice(0, 5),
      })
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold">仪表板</h1>
        <p className="text-gray-600 mt-1">欢迎回来，查看您的项目概况</p>
      </div>

      {/* 统计卡片 */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">总项目数</CardTitle>
                <FolderOpen className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalProjects}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.totalProjects > 0 ? '管理中的项目' : '还没有项目'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">总索引数</CardTitle>
                <Database className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalIndexes}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.totalIndexes > 0 ? '活跃的向量索引' : '还没有索引'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">平均索引数</CardTitle>
                <TrendingUp className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {stats.totalProjects > 0
                    ? (stats.totalIndexes / stats.totalProjects).toFixed(1)
                    : '0'}
                </div>
                <p className="text-xs text-gray-500 mt-1">每个项目的平均索引数</p>
              </CardContent>
            </Card>
          </div>

          {/* 快速操作 */}
          <Card>
            <CardHeader>
              <CardTitle>快速开始</CardTitle>
              <CardDescription>快速创建和管理您的向量索引项目</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Link href="/admin/projects">
                  <Button variant="outline" className="w-full justify-start h-auto py-4">
                    <div className="flex items-start gap-3">
                      <Plus className="h-5 w-5 mt-0.5" />
                      <div className="text-left">
                        <div className="font-semibold">创建新项目</div>
                        <div className="text-sm text-gray-500 font-normal">
                          开始一个新的向量索引项目
                        </div>
                      </div>
                    </div>
                  </Button>
                </Link>

                <Link href="/admin/projects">
                  <Button variant="outline" className="w-full justify-start h-auto py-4">
                    <div className="flex items-start gap-3">
                      <FolderOpen className="h-5 w-5 mt-0.5" />
                      <div className="text-left">
                        <div className="font-semibold">浏览项目</div>
                        <div className="text-sm text-gray-500 font-normal">
                          查看和管理现有项目
                        </div>
                      </div>
                    </div>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* 最近的项目 */}
          {stats.recentProjects.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>最近的项目</CardTitle>
                    <CardDescription>您最近更新的项目</CardDescription>
                  </div>
                  <Link href="/admin/projects">
                    <Button variant="ghost" size="sm">
                      查看全部
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.recentProjects.map((project) => (
                    <Link key={project.id} href={`/admin/projects/${project.id}`}>
                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FolderOpen className="h-5 w-5 text-blue-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{project.name}</div>
                            {project.description && (
                              <div className="text-sm text-gray-500 truncate">
                                {project.description}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                          <div className="text-sm text-gray-500">
                            <span className="font-medium">{project._count?.indexes || 0}</span> 个索引
                          </div>
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 空状态 */}
          {stats.totalProjects === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FolderOpen className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold mb-2">开始您的第一个项目</h3>
                <p className="text-gray-500 text-center mb-6 max-w-md">
                  创建一个项目来组织您的向量索引，上传文档并进行语义搜索
                </p>
                <Link href="/admin/projects">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    创建项目
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* 使用提示 */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">💡 使用提示</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="font-semibold mt-0.5">1.</span>
                  <span>
                    <strong>创建项目：</strong>
                    首先创建一个项目来组织您的向量索引
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold mt-0.5">2.</span>
                  <span>
                    <strong>创建索引：</strong>
                    在项目中创建索引，指定向量维度
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold mt-0.5">3.</span>
                  <span>
                    <strong>上传文档：</strong>
                    上传 Word 文档或直接输入文本内容
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold mt-0.5">4.</span>
                  <span>
                    <strong>语义搜索：</strong>
                    使用自然语言搜索相关文档内容
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
