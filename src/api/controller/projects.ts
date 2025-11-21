import Elysia, { t } from 'elysia'
import { apiTokenAuth } from '../middleware/api-token-auth'
import {
  createProject,
  getProjectList,
  getProject,
  updateProject,
  deleteProject,
} from '@/app/admin/projects/actions'

export const projects = new Elysia({
  prefix: '/projects',
  detail: {
    tags: ['项目管理'],
    description: '向量索引项目管理接口',
  },
})
  .use(apiTokenAuth())
  .post(
    '/',
    async ({ body, ApiTokenAuth }) => {
      try {
        const result = await createProject({
          name: body.name,
          description: body.description,
          userId: ApiTokenAuth.apiToken.userId,
        })

        if (result.success) {
          return {
            code: 0,
            message: '项目创建成功',
            data: result.data,
          }
        } else {
          return {
            code: 1,
            message: result.error || '项目创建失败',
            data: null,
          }
        }
      } catch (error) {
        return {
          code: 1,
          message: error instanceof Error ? error.message : '项目创建失败',
          data: null,
        }
      }
    },
    {
      detail: {
        summary: '创建项目',
        description: '创建一个新的向量索引项目',
        security: [{ bearerAuth: [] }],
      },
      body: t.Object({
        name: t.String({ description: '项目名称' }),
        description: t.Optional(t.String({ description: '项目描述' })),
      }),
    }
  )
  .get(
    '/',
    async ({ ApiTokenAuth }) => {
      try {
        const result = await getProjectList(ApiTokenAuth.apiToken.userId)

        if (result.success) {
          return {
            code: 0,
            message: '获取项目列表成功',
            data: result.data,
          }
        } else {
          return {
            code: 1,
            message: result.error || '获取项目列表失败',
            data: null,
          }
        }
      } catch (error) {
        return {
          code: 1,
          message: error instanceof Error ? error.message : '获取项目列表失败',
          data: null,
        }
      }
    },
    {
      detail: {
        summary: '获取项目列表',
        description: '获取当前用户的所有项目',
        security: [{ bearerAuth: [] }],
      },
    }
  )
  .get(
    '/:projectId',
    async ({ params: { projectId }, ApiTokenAuth }) => {
      try {
        const result = await getProject(projectId, ApiTokenAuth.apiToken.userId)

        if (result.success) {
          return {
            code: 0,
            message: '获取项目详情成功',
            data: result.data,
          }
        } else {
          return {
            code: 1,
            message: result.error || '获取项目详情失败',
            data: null,
          }
        }
      } catch (error) {
        return {
          code: 1,
          message: error instanceof Error ? error.message : '获取项目详情失败',
          data: null,
        }
      }
    },
    {
      detail: {
        summary: '获取项目详情',
        description: '根据ID获取项目详情',
        security: [{ bearerAuth: [] }],
      },
      params: t.Object({
        projectId: t.String({ description: '项目ID' }),
      }),
    }
  )
  .put(
    '/:projectId',
    async ({ params: { projectId }, body, ApiTokenAuth }) => {
      try {
        const result = await updateProject(projectId, ApiTokenAuth.apiToken.userId, {
          name: body.name,
          description: body.description,
        })

        if (result.success) {
          return {
            code: 0,
            message: '项目更新成功',
            data: result.data,
          }
        } else {
          return {
            code: 1,
            message: result.error || '项目更新失败',
            data: null,
          }
        }
      } catch (error) {
        return {
          code: 1,
          message: error instanceof Error ? error.message : '项目更新失败',
          data: null,
        }
      }
    },
    {
      detail: {
        summary: '更新项目',
        description: '更新项目信息',
        security: [{ bearerAuth: [] }],
      },
      params: t.Object({
        projectId: t.String({ description: '项目ID' }),
      }),
      body: t.Object({
        name: t.Optional(t.String({ description: '项目名称' })),
        description: t.Optional(t.String({ description: '项目描述' })),
      }),
    }
  )
  .delete(
    '/:projectId',
    async ({ params: { projectId }, ApiTokenAuth }) => {
      try {
        const result = await deleteProject(projectId, ApiTokenAuth.apiToken.userId)

        if (result.success) {
          return {
            code: 0,
            message: result.message || '项目删除成功',
            data: null,
          }
        } else {
          return {
            code: 1,
            message: result.error || '项目删除失败',
            data: null,
          }
        }
      } catch (error) {
        return {
          code: 1,
          message: error instanceof Error ? error.message : '项目删除失败',
          data: null,
        }
      }
    },
    {
      detail: {
        summary: '删除项目',
        description: '删除项目及其所有索引和文件',
        security: [{ bearerAuth: [] }],
      },
      params: t.Object({
        projectId: t.String({ description: '项目ID' }),
      }),
    }
  )
