'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { LibSQLVector } from '@mastra/libsql'

const vectorStore = new LibSQLVector({
  connectionUrl: process.env.VECTOR_DATABASE_URL || 'file:./vector.db',
})

const EMBEDDING_DIMENSION = Number(process.env.EMBEDDING_DIMENSION) || 1536

// ==================== 索引管理 Actions ====================

export async function createIndex(data: {
  projectId: string
  name: string
  dimension?: number
  userId: string
}) {
  try {
    // 1. 验证项目所有权
    const project = await prisma.project.findFirst({
      where: {
        id: data.projectId,
        userId: data.userId,
      },
    })

    if (!project) {
      return {
        success: false,
        error: 'Project not found or access denied',
      }
    }

    // 2. 在向量数据库中创建索引
    const dimension = data.dimension || EMBEDDING_DIMENSION
    await vectorStore.createIndex({
      indexName: data.name,
      dimension,
    })

    // 3. 在 Prisma 中记录索引
    const index = await prisma.index.create({
      data: {
        name: data.name,
        dimension,
        projectId: data.projectId,
      },
    })

    revalidatePath(`/admin/projects/${data.projectId}`)
    return { success: true, data: index }
  } catch (error) {
    console.error('Failed to create index:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create index',
    }
  }
}

export async function getIndexList(projectId: string, userId: string) {
  try {
    // 验证权限
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    })

    if (!project) {
      return {
        success: false,
        error: 'Project not found or access denied',
      }
    }

    const indexes = await prisma.index.findMany({
      where: { projectId },
      include: {
        _count: {
          select: {
            files: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, data: indexes }
  } catch (error) {
    console.error('Failed to get indexes:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get indexes',
    }
  }
}

export async function getIndex(indexId: string, userId: string) {
  try {
    const index = await prisma.index.findFirst({
      where: {
        id: indexId,
        project: { userId },
      },
      include: {
        project: true,
        files: {
          include: {
            _count: {
              select: {
                chunks: true,
              },
            },
          },
        },
      },
    })

    if (!index) {
      return {
        success: false,
        error: 'Index not found or access denied',
      }
    }

    return { success: true, data: index }
  } catch (error) {
    console.error('Failed to get index:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get index',
    }
  }
}

export async function deleteIndex(indexId: string, userId: string) {
  try {
    // 验证权限
    const index = await prisma.index.findFirst({
      where: {
        id: indexId,
        project: { userId },
      },
    })

    if (!index) {
      return {
        success: false,
        error: 'Index not found or access denied',
      }
    }

    // 1. 删除向量数据库中的索引
    await vectorStore.deleteIndex({ indexName: index.name })

    // 2. 删除 Prisma 中的记录（会级联删除 files 和 chunks）
    await prisma.index.delete({
      where: { id: indexId },
    })

    revalidatePath(`/admin/projects/${index.projectId}`)
    return { success: true, message: 'Index deleted successfully' }
  } catch (error) {
    console.error('Failed to delete index:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete index',
    }
  }
}
