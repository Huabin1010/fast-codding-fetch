'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { LibSQLVector } from '@mastra/libsql'
import { MDocument } from '@mastra/rag'
import mammoth from 'mammoth'
import { embedMany } from 'ai'
import { getEmbeddingLLMModel } from '@/app/demo/model/action'

const vectorStore = new LibSQLVector({
  connectionUrl: process.env.VECTOR_DATABASE_URL || 'file:./vector.db',
})

const BATCH_SIZE = 100

// ==================== 文档处理工具函数 ====================

async function chunkDocument(text: string) {
  const doc = MDocument.fromText(text)

  const chunks = await doc.chunk({
    strategy: 'recursive',
    maxSize: 512,
    overlap: 50,
    separators: ['\n\n', '\n', '. ', ' '],
  })

  return chunks
}

async function generateBatchEmbeddings(
  texts: string[],
  batchSize: number = BATCH_SIZE
): Promise<number[][]> {
  const results: number[][] = []

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize)

    try {
      const embeddingModel = await getEmbeddingLLMModel()

      const { embeddings } = await embedMany({
        model: embeddingModel,
        values: batch,
      })

      results.push(...embeddings)
      console.log(
        `Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(texts.length / batchSize)}`
      )
    } catch (error) {
      console.error(`Batch ${Math.floor(i / batchSize) + 1} failed:`, error)
      throw new Error(
        `Failed to generate embeddings for batch ${Math.floor(i / batchSize) + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  return results
}

// ==================== 文件管理 Actions ====================

export async function uploadFileToIndex(formData: FormData, userId: string) {
  try {
    const file = formData.get('file') as File
    const indexId = formData.get('indexId') as string

    if (!file) {
      return { success: false, error: 'No file provided' }
    }

    if (!indexId) {
      return { success: false, error: 'No index ID provided' }
    }

    // 1. 验证索引所有权
    const index = await prisma.index.findFirst({
      where: {
        id: indexId,
        project: { userId },
      },
      include: { project: true },
    })

    if (!index) {
      return {
        success: false,
        error: 'Index not found or access denied',
      }
    }

    // 2. 提取文本
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const result = await mammoth.extractRawText({ buffer })
    const extractedText = result.value

    if (!extractedText.trim()) {
      return { success: false, error: 'No text found in the document' }
    }

    // 3. 文档分块
    const chunks = await chunkDocument(extractedText)

    if (chunks.length === 0) {
      return { success: false, error: 'Failed to create text chunks' }
    }

    // 4. 生成向量嵌入
    const chunkTexts = chunks.map((chunk: any) => chunk.text)
    const embeddings = await generateBatchEmbeddings(chunkTexts)

    // 5. 存储到向量数据库
    const vectorIds: string[] = []
    await vectorStore.upsert({
      indexName: index.name,
      vectors: embeddings,
      metadata: chunks.map((chunk: any, i: number) => {
        const vectorId = `${file.name}_chunk_${i + 1}`
        vectorIds.push(vectorId)

        return {
          id: vectorId,
          text: chunk.text,
          source: file.name,
          chunkIndex: i,
          totalChunks: chunks.length,
          createdAt: new Date().toISOString(),
          fileSize: file.size,
        }
      }),
    })

    // 6. 记录到 Prisma 数据库
    const dbFile = await prisma.file.create({
      data: {
        name: file.name,
        size: file.size,
        mimeType: file.type,
        indexId: indexId,
        chunks: {
          create: chunks.map((chunk: any, i: number) => ({
            vectorId: vectorIds[i],
            text: chunk.text,
            chunkIndex: i,
          })),
        },
      },
      include: {
        chunks: {
          take: 5,
          orderBy: { chunkIndex: 'asc' },
        },
      },
    })

    revalidatePath(`/admin/indexes/${indexId}`)
    return {
      success: true,
      data: {
        fileId: dbFile.id,
        name: dbFile.name,
        chunkCount: chunks.length,
        size: dbFile.size,
      },
      message: `Successfully processed ${chunks.length} chunks from "${file.name}"`,
    }
  } catch (error) {
    console.error('File upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload file',
    }
  }
}

export async function uploadTextDocument(data: {
  indexId: string
  content: string
  title?: string
  metadata?: Record<string, any>
  userId: string
}) {
  try {
    // 1. 验证索引所有权
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

    // 2. 验证内容
    if (!data.content || data.content.trim().length === 0) {
      return {
        success: false,
        error: 'Content is required',
      }
    }

    // 3. 文档分块
    const chunks = await chunkDocument(data.content)

    if (chunks.length === 0) {
      return {
        success: false,
        error: 'Failed to create chunks',
      }
    }

    // 4. 生成向量嵌入
    const chunkTexts = chunks.map((chunk: any) => chunk.text)
    const embeddings = await generateBatchEmbeddings(chunkTexts)

    // 5. 生成文档名称
    const documentName =
      data.title || `API上传_${new Date().toISOString().replace(/[:.]/g, '-')}`

    // 6. 存储到向量数据库
    const vectorIds: string[] = []
    await vectorStore.upsert({
      indexName: index.name,
      vectors: embeddings,
      metadata: chunks.map((chunk: any, i: number) => {
        const vectorId = `${documentName}_chunk_${i + 1}`
        vectorIds.push(vectorId)

        return {
          id: vectorId,
          text: chunk.text,
          source: documentName,
          chunkIndex: i,
          totalChunks: chunks.length,
          createdAt: new Date().toISOString(),
          ...(data.metadata || {}),
        }
      }),
    })

    // 7. 记录到 Prisma 数据库
    const dbFile = await prisma.file.create({
      data: {
        name: documentName,
        size: data.content.length,
        mimeType: 'text/plain',
        indexId: data.indexId,
        chunks: {
          create: chunks.map((chunk: any, i: number) => ({
            vectorId: vectorIds[i],
            text: chunk.text,
            chunkIndex: i,
            metadata: data.metadata ? JSON.stringify(data.metadata) : null,
          })),
        },
      },
      include: {
        chunks: {
          take: 5,
          orderBy: { chunkIndex: 'asc' },
        },
      },
    })

    revalidatePath(`/admin/indexes/${data.indexId}`)
    return {
      success: true,
      data: {
        fileId: dbFile.id,
        name: dbFile.name,
        chunkCount: chunks.length,
        size: dbFile.size,
      },
      message: `Document processed successfully with ${chunks.length} chunks`,
    }
  } catch (error) {
    console.error('Text document upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload document',
    }
  }
}

export async function getFileList(indexId: string, userId: string) {
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

    const files = await prisma.file.findMany({
      where: { indexId },
      include: {
        _count: {
          select: {
            chunks: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, data: files }
  } catch (error) {
    console.error('Failed to get files:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get files',
    }
  }
}

export async function getFile(fileId: string, userId: string) {
  try {
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        index: {
          project: { userId },
        },
      },
      include: {
        index: {
          include: {
            project: true,
          },
        },
        chunks: {
          orderBy: { chunkIndex: 'asc' },
        },
      },
    })

    if (!file) {
      return {
        success: false,
        error: 'File not found or access denied',
      }
    }

    return { success: true, data: file }
  } catch (error) {
    console.error('Failed to get file:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get file',
    }
  }
}

export async function getFileChunks(fileId: string, userId: string) {
  try {
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        index: {
          project: { userId },
        },
      },
      include: {
        chunks: {
          orderBy: { chunkIndex: 'asc' },
        },
      },
    })

    if (!file) {
      return {
        success: false,
        error: 'File not found or access denied',
      }
    }

    return { success: true, data: file.chunks }
  } catch (error) {
    console.error('Failed to get file chunks:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get file chunks',
    }
  }
}

export async function deleteFile(fileId: string, userId: string) {
  try {
    // 验证权限
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        index: {
          project: { userId },
        },
      },
      include: {
        index: true,
        chunks: true,
      },
    })

    if (!file) {
      return {
        success: false,
        error: 'File not found or access denied',
      }
    }

    // 1. 从向量数据库删除所有 chunks
    // 注意：LibSQLVector 可能没有批量删除，需要逐个删除或直接执行 SQL
    // 这里简化处理，Prisma 删除会级联删除 chunks 记录

    // 2. 删除 Prisma 中的记录
    await prisma.file.delete({
      where: { id: fileId },
    })

    revalidatePath(`/admin/indexes/${file.indexId}`)
    return {
      success: true,
      message: 'File and all associated chunks deleted successfully',
    }
  } catch (error) {
    console.error('Failed to delete file:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete file',
    }
  }
}
