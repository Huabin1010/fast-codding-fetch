'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// ==================== 项目管理 Actions ====================

export async function createProject(data: {
  name: string
  description?: string
  userId: string
}) {
  try {
    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        userId: data.userId,
      },
    })

    revalidatePath('/admin/projects')
    return { success: true, data: project }
  } catch (error) {
    console.error('Failed to create project:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create project',
    }
  }
}

export async function getProjectList(userId: string) {
  try {
    const projects = await prisma.project.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            indexes: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return { success: true, data: projects }
  } catch (error) {
    console.error('Failed to get projects:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get projects',
    }
  }
}

export async function getProject(projectId: string, userId: string) {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
      include: {
        indexes: {
          include: {
            _count: {
              select: {
                files: true,
              },
            },
          },
        },
      },
    })

    if (!project) {
      return {
        success: false,
        error: 'Project not found or access denied',
      }
    }

    return { success: true, data: project }
  } catch (error) {
    console.error('Failed to get project:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get project',
    }
  }
}

export async function updateProject(
  projectId: string,
  userId: string,
  data: {
    name?: string
    description?: string
  }
) {
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

    const updated = await prisma.project.update({
      where: { id: projectId },
      data,
    })

    revalidatePath('/admin/projects')
    return { success: true, data: updated }
  } catch (error) {
    console.error('Failed to update project:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update project',
    }
  }
}

export async function deleteProject(projectId: string, userId: string) {
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

    await prisma.project.delete({
      where: { id: projectId },
    })

    revalidatePath('/admin/projects')
    return { success: true, message: 'Project deleted successfully' }
  } catch (error) {
    console.error('Failed to delete project:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete project',
    }
  }
}
