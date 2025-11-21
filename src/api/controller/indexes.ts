import Elysia, { t } from 'elysia'
import { apiTokenAuth } from '../middleware/api-token-auth'
import {
  createIndex,
  getIndexList,
  getIndex,
  deleteIndex,
} from '@/app/admin/projects/[projectId]/indexes/actions'

export const indexes = new Elysia({
  prefix: '/indexes',
  detail: {
    tags: ['索引管理'],
    description: '向量索引管理接口',
  },
})
  .use(apiTokenAuth())
  .post(
    '/projects/:projectId/indexes',
    async ({ params: { projectId }, body, ApiTokenAuth }) => {
      try {
        const result = await createIndex({
          projectId,
          name: body.name,
          dimension: body.dimension,
          userId: ApiTokenAuth.apiToken.creatorId,
        })

        if (result.success) {
          return {
            code: 0,
            message: '索引创建成功',
            data: result.data,
          }
        } else {
          return {
            code: 1,
            message: result.error || '索引创建失败',
            data: null,
          }
        }
      } catch (error) {
        return {
          code: 1,
          message: error instanceof Error ? error.message : '索引创建失败',
          data: null,
        }
      }
    },
    {
      detail: {
        summary: '创建索引',
        description: '在项目中创建一个新的向量索引',
        security: [{ bearerAuth: [] }],
      },
      params: t.Object({
        projectId: t.String({ description: '项目ID' }),
      }),
      body: t.Object({
        name: t.String({ description: '索引名称' }),
        dimension: t.Optional(t.Number({ description: '向量维度', default: 1536 })),
      }),
    }
  )
  .get(
    '/projects/:projectId/indexes',
    async ({ params: { projectId }, ApiTokenAuth }) => {
      try {
        const result = await getIndexList(projectId, ApiTokenAuth.apiToken.creatorId)

        if (result.success) {
          return {
            code: 0,
            message: '获取索引列表成功',
            data: result.data,
          }
        } else {
          return {
            code: 1,
            message: result.error || '获取索引列表失败',
            data: null,
          }
        }
      } catch (error) {
        return {
          code: 1,
          message: error instanceof Error ? error.message : '获取索引列表失败',
          data: null,
        }
      }
    },
    {
      detail: {
        summary: '获取索引列表',
        description: '获取项目的所有索引',
        security: [{ bearerAuth: [] }],
      },
      params: t.Object({
        projectId: t.String({ description: '项目ID' }),
      }),
    }
  )
  .get(
    '/:indexId',
    async ({ params: { indexId }, ApiTokenAuth }) => {
      try {
        const result = await getIndex(indexId, ApiTokenAuth.apiToken.creatorId)

        if (result.success) {
          return {
            code: 0,
            message: '获取索引详情成功',
            data: result.data,
          }
        } else {
          return {
            code: 1,
            message: result.error || '获取索引详情失败',
            data: null,
          }
        }
      } catch (error) {
        return {
          code: 1,
          message: error instanceof Error ? error.message : '获取索引详情失败',
          data: null,
        }
      }
    },
    {
      detail: {
        summary: '获取索引详情',
        description: '根据ID获取索引详情',
        security: [{ bearerAuth: [] }],
      },
      params: t.Object({
        indexId: t.String({ description: '索引ID' }),
      }),
    }
  )
  .delete(
    '/:indexId',
    async ({ params: { indexId }, ApiTokenAuth }) => {
      try {
        const result = await deleteIndex(indexId, ApiTokenAuth.apiToken.creatorId)

        if (result.success) {
          return {
            code: 0,
            message: result.message || '索引删除成功',
            data: null,
          }
        } else {
          return {
            code: 1,
            message: result.error || '索引删除失败',
            data: null,
          }
        }
      } catch (error) {
        return {
          code: 1,
          message: error instanceof Error ? error.message : '索引删除失败',
          data: null,
        }
      }
    },
    {
      detail: {
        summary: '删除索引',
        description: '删除索引及其所有文件',
        security: [{ bearerAuth: [] }],
      },
      params: t.Object({
        indexId: t.String({ description: '索引ID' }),
      }),
    }
  )
