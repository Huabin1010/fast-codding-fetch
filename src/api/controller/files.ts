import Elysia, { t } from 'elysia'
import { apiTokenAuth } from '../middleware/api-token-auth'
import {
  uploadFileToIndex,
  uploadTextDocument,
  getFileList,
  getFile,
  deleteFile,
} from '@/app/admin/indexes/[indexId]/files/actions'

export const files = new Elysia({
  prefix: '/files',
  detail: {
    tags: ['文件管理'],
    description: '文件和文档管理接口',
  },
})
  .use(apiTokenAuth())
  .post(
    '/indexes/:indexId/files',
    async ({ params: { indexId }, body, ApiTokenAuth }) => {
      try {
        const formData = new FormData()
        formData.append('file', body.file)
        formData.append('indexId', indexId)

        const result = await uploadFileToIndex(formData, ApiTokenAuth.apiToken.userId)

        if (result.success) {
          return {
            code: 0,
            message: result.message || '文件上传成功',
            data: result.data,
          }
        } else {
          return {
            code: 1,
            message: result.error || '文件上传失败',
            data: null,
          }
        }
      } catch (error) {
        return {
          code: 1,
          message: error instanceof Error ? error.message : '文件上传失败',
          data: null,
        }
      }
    },
    {
      detail: {
        summary: '上传文件',
        description: '上传Word文档到索引',
        security: [{ bearerAuth: [] }],
      },
      params: t.Object({
        indexId: t.String({ description: '索引ID' }),
      }),
      body: t.Object({
        file: t.File({ description: 'Word文档文件' }),
      }),
    }
  )
  .post(
    '/indexes/:indexId/documents',
    async ({ params: { indexId }, body, ApiTokenAuth }) => {
      try {
        const result = await uploadTextDocument({
          indexId,
          content: body.content,
          title: body.title,
          metadata: body.metadata,
          userId: ApiTokenAuth.apiToken.userId,
        })

        if (result.success) {
          return {
            code: 0,
            message: result.message || '文本上传成功',
            data: result.data,
          }
        } else {
          return {
            code: 1,
            message: result.error || '文本上传失败',
            data: null,
          }
        }
      } catch (error) {
        return {
          code: 1,
          message: error instanceof Error ? error.message : '文本上传失败',
          data: null,
        }
      }
    },
    {
      detail: {
        summary: '上传文本内容',
        description: '直接上传文本内容到索引',
        security: [{ bearerAuth: [] }],
      },
      params: t.Object({
        indexId: t.String({ description: '索引ID' }),
      }),
      body: t.Object({
        content: t.String({ description: '文本内容' }),
        title: t.Optional(t.String({ description: '文档标题' })),
        metadata: t.Optional(
          t.Object({}, { description: '额外的元数据', additionalProperties: true })
        ),
      }),
    }
  )
  .get(
    '/indexes/:indexId/files',
    async ({ params: { indexId }, ApiTokenAuth }) => {
      try {
        const result = await getFileList(indexId, ApiTokenAuth.apiToken.userId)

        if (result.success) {
          return {
            code: 0,
            message: '获取文件列表成功',
            data: result.data,
          }
        } else {
          return {
            code: 1,
            message: result.error || '获取文件列表失败',
            data: null,
          }
        }
      } catch (error) {
        return {
          code: 1,
          message: error instanceof Error ? error.message : '获取文件列表失败',
          data: null,
        }
      }
    },
    {
      detail: {
        summary: '获取文件列表',
        description: '获取索引中的所有文件',
        security: [{ bearerAuth: [] }],
      },
      params: t.Object({
        indexId: t.String({ description: '索引ID' }),
      }),
    }
  )
  .get(
    '/:fileId',
    async ({ params: { fileId }, ApiTokenAuth }) => {
      try {
        const result = await getFile(fileId, ApiTokenAuth.apiToken.userId)

        if (result.success) {
          return {
            code: 0,
            message: '获取文件详情成功',
            data: result.data,
          }
        } else {
          return {
            code: 1,
            message: result.error || '获取文件详情失败',
            data: null,
          }
        }
      } catch (error) {
        return {
          code: 1,
          message: error instanceof Error ? error.message : '获取文件详情失败',
          data: null,
        }
      }
    },
    {
      detail: {
        summary: '获取文件详情',
        description: '根据ID获取文件详情',
        security: [{ bearerAuth: [] }],
      },
      params: t.Object({
        fileId: t.String({ description: '文件ID' }),
      }),
    }
  )
  .delete(
    '/:fileId',
    async ({ params: { fileId }, ApiTokenAuth }) => {
      try {
        const result = await deleteFile(fileId, ApiTokenAuth.apiToken.userId)

        if (result.success) {
          return {
            code: 0,
            message: result.message || '文件删除成功',
            data: null,
          }
        } else {
          return {
            code: 1,
            message: result.error || '文件删除失败',
            data: null,
          }
        }
      } catch (error) {
        return {
          code: 1,
          message: error instanceof Error ? error.message : '文件删除失败',
          data: null,
        }
      }
    },
    {
      detail: {
        summary: '删除文件',
        description: '删除文件及其所有文档块',
        security: [{ bearerAuth: [] }],
      },
      params: t.Object({
        fileId: t.String({ description: '文件ID' }),
      }),
    }
  )
