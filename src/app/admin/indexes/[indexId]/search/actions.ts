'use server'

import { prisma } from '@/lib/prisma'
import { LibSQLVector } from '@mastra/libsql'
import { embedMany } from 'ai'
import { getEmbeddingLLMModel } from '@/app/demo/model/action'

const vectorStore = new LibSQLVector({
  connectionUrl: process.env.VECTOR_DATABASE_URL || 'file:./vector.db',
})

// ==================== 搜索 Actions ====================

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const embeddingModel = await getEmbeddingLLMModel()

    const { embeddings } = await embedMany({
      model: embeddingModel,
      values: [text],
    })

    return embeddings[0]
  } catch (error) {
    console.error('Failed to generate embedding:', error)
    throw error
  }
}

export async function searchInIndex(data: {
  indexId: string
  query: string
  topK?: number
  minScore?: number
  userId: string
}) {
  try {
    // 1. 验证权限
    const index = await prisma.index.findFirst({
      where: {
        id: data.indexId,
        project: { userId: data.userId },
      },
    })

    if (!index) {
      return {
        success: false,
        error: 'Index not found or access denied',
      }
    }

    // 2. 生成查询向量
    const queryVector = await generateEmbedding(data.query)

    // 3. 向量搜索
    const results = await vectorStore.query({
      indexName: index.name,
      queryVector,
      topK: data.topK || 5,
    })

    // 4. 应用最小分数过滤
    const minScore = data.minScore || 0.0
    const filteredResults = results.filter(
      (result) => !result.score || result.score >= minScore
    )

    // 5. 关联 Prisma 数据
    const enrichedResults = await Promise.all(
      filteredResults.map(async (result) => {
        const chunk = await prisma.chunk.findFirst({
          where: { vectorId: result.id },
          include: {
            file: {
              include: {
                index: {
                  include: {
                    project: true,
                  },
                },
              },
            },
          },
        })

        return {
          score: result.score,
          chunk: chunk
            ? {
                id: chunk.id,
                text: chunk.text,
                chunkIndex: chunk.chunkIndex,
                file: {
                  id: chunk.file.id,
                  name: chunk.file.name,
                },
              }
            : null,
          metadata: result.metadata,
        }
      })
    )

    return {
      success: true,
      data: {
        results: enrichedResults.filter((r) => r.chunk !== null),
        query: data.query,
        totalResults: enrichedResults.length,
      },
    }
  } catch (error) {
    console.error('Search error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search',
    }
  }
}

export async function searchInProject(data: {
  projectId: string
  query: string
  topK?: number
  minScore?: number
  indexIds?: string[]
  userId: string
}) {
  try {
    // 1. 验证项目所有权
    const project = await prisma.project.findFirst({
      where: {
        id: data.projectId,
        userId: data.userId,
      },
      include: {
        indexes: true,
      },
    })

    if (!project) {
      return {
        success: false,
        error: 'Project not found or access denied',
      }
    }

    // 2. 确定要搜索的索引
    const indexesToSearch = data.indexIds
      ? project.indexes.filter((idx) => data.indexIds!.includes(idx.id))
      : project.indexes

    if (indexesToSearch.length === 0) {
      return {
        success: true,
        data: {
          results: [],
          query: data.query,
          totalResults: 0,
          searchedIndexes: 0,
        },
      }
    }

    // 3. 生成查询向量
    const queryVector = await generateEmbedding(data.query)

    // 4. 在所有索引中搜索
    const allResults = await Promise.all(
      indexesToSearch.map(async (index) => {
        try {
          const results = await vectorStore.query({
            indexName: index.name,
            queryVector,
            topK: data.topK || 10,
          })

          return results.map((r) => ({ ...r, indexId: index.id, indexName: index.name }))
        } catch (error) {
          console.error(`Search in index ${index.name} failed:`, error)
          return []
        }
      })
    )

    // 5. 合并并排序结果
    const mergedResults = allResults.flat().sort((a, b) => (b.score || 0) - (a.score || 0))

    // 6. 应用最小分数过滤和 topK 限制
    const minScore = data.minScore || 0.0
    const topK = data.topK || 10
    const filteredResults = mergedResults
      .filter((result) => !result.score || result.score >= minScore)
      .slice(0, topK)

    // 7. 关联 Prisma 数据
    const enrichedResults = await Promise.all(
      filteredResults.map(async (result) => {
        const chunk = await prisma.chunk.findFirst({
          where: { vectorId: result.id },
          include: {
            file: true,
          },
        })

        return {
          score: result.score,
          chunk: chunk
            ? {
                id: chunk.id,
                text: chunk.text,
                chunkIndex: chunk.chunkIndex,
                file: {
                  id: chunk.file.id,
                  name: chunk.file.name,
                },
              }
            : null,
          index: {
            id: result.indexId,
            name: result.indexName,
          },
          metadata: result.metadata,
        }
      })
    )

    return {
      success: true,
      data: {
        results: enrichedResults.filter((r) => r.chunk !== null),
        query: data.query,
        totalResults: enrichedResults.length,
        searchedIndexes: indexesToSearch.length,
      },
    }
  } catch (error) {
    console.error('Project search error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search in project',
    }
  }
}
