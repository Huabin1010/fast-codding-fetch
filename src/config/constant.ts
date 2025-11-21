/**
 * 应用常量配置
 */

/** 应用名称 */
export const APP_NAME = 'Vector Index System'

/** 应用标题 */
export const APP_TITLE = '向量索引管理系统'

/** 应用版本 */
export const APP_VERSION = '1.0.0'

/** 应用描述 */
export const APP_DESCRIPTION = '基于 Next.js + Prisma + LibSQL 的多用户向量索引管理系统'

/** API 基础路径 */
export const API_BASE_PATH = '/api'

/** 默认向量维度 */
export const DEFAULT_EMBEDDING_DIMENSION = 1536

/** 默认搜索结果数量 */
export const DEFAULT_SEARCH_TOP_K = 5

/** 默认最小相似度分数 */
export const DEFAULT_MIN_SCORE = 0.0

/** 文档分块配置 */
export const CHUNK_CONFIG = {
  /** 分块策略 */
  strategy: 'recursive' as const,
  /** 最大块大小 */
  maxSize: 512,
  /** 块重叠大小 */
  overlap: 50,
  /** 分隔符 */
  separators: ['\n\n', '\n', '. ', ' '],
}

/** 批处理配置 */
export const BATCH_CONFIG = {
  /** 嵌入生成批处理大小 */
  embeddingBatchSize: 100,
}

/** 分页配置 */
export const PAGINATION_CONFIG = {
  /** 默认每页数量 */
  defaultLimit: 20,
  /** 最大每页数量 */
  maxLimit: 100,
}
