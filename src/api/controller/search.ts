import Elysia, { t } from 'elysia'
import { apiTokenAuth } from '../middleware/api-token-auth'
import {
  searchInIndex,
  searchInProject,
} from '@/app/admin/indexes/[indexId]/search/actions'

export const search = new Elysia({
  prefix: '/search',
  detail: {
    tags: ['向量搜索'],
    description: '向量语义搜索接口',
  },
})
  .use(apiTokenAuth())
  .post(
    '/indexes/:indexId',
    async ({ params: { indexId }, body, ApiTokenAuth }) => {
      try {
        const result = await searchInIndex({
          indexId,
          query: body.query,
          topK: body.topK,
          minScore: body.minScore,
          userId: ApiTokenAuth.apiToken.userId,
        })

        if (result.success) {
          return {
            code: 0,
            message: '搜索成功',
            data: result.data,
          }
        } else {
          return {
            code: 1,
            message: result.error || '搜索失败',
            data: null,
          }
        }
      } catch (error) {
        return {
          code: 1,
          message: error instanceof Error ? error.message : '搜索失败',
          data: null,
        }
      }
    },
    {
      detail: {
        summary: '索引内搜索',
        description: '在指定索引中进行向量语义搜索',
        security: [{ bearerAuth: [] }],
      },
      params: t.Object({
        indexId: t.String({ description: '索引ID' }),
      }),
      body: t.Object({
        query: t.String({ description: '搜索查询文本' }),
        topK: t.Optional(t.Number({ description: '返回结果数量', default: 5, minimum: 1, maximum: 20 })),
        minScore: t.Optional(t.Number({ description: '最小相似度分数', default: 0.0, minimum: 0, maximum: 1 })),
      }),
    }
  )
  .post(
    '/projects/:projectId',
    async ({ params: { projectId }, body, ApiTokenAuth }) => {
      try {
        const result = await searchInProject({
          projectId,
          query: body.query,
          topK: body.topK,
          minScore: body.minScore,
          indexIds: body.indexIds,
          userId: ApiTokenAuth.apiToken.userId,
        })

        if (result.success) {
          return {
            code: 0,
            message: '搜索成功',
            data: result.data,
          }
        } else {
          return {
            code: 1,
            message: result.error || '搜索失败',
            data: null,
          }
        }
      } catch (error) {
        return {
          code: 1,
          message: error instanceof Error ? error.message : '搜索失败',
          data: null,
        }
      }
    },
    {
      detail: {
        summary: '项目内搜索',
        description: '在项目的所有索引中进行向量语义搜索',
        security: [{ bearerAuth: [] }],
      },
      params: t.Object({
        projectId: t.String({ description: '项目ID' }),
      }),
      body: t.Object({
        query: t.String({ description: '搜索查询文本' }),
        topK: t.Optional(t.Number({ description: '返回结果数量', default: 10, minimum: 1, maximum: 50 })),
        minScore: t.Optional(t.Number({ description: '最小相似度分数', default: 0.0, minimum: 0, maximum: 1 })),
        indexIds: t.Optional(t.Array(t.String(), { description: '指定搜索的索引ID列表' })),
      }),
    }
  )
