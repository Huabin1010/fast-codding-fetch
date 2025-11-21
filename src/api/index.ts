import { APP_NAME, APP_TITLE, APP_VERSION } from '@/config/constant';
import swagger from '@elysiajs/swagger';
import { Elysia, ValidationError } from 'elysia';
// 向量索引管理相关
import { projects } from './controller/projects';
import { indexes } from './controller/indexes';
import { files } from './controller/files';
import { search } from './controller/search';

const app = new Elysia({ prefix: '/api' });

app.onError({ as: 'global' }, ({ code, error, set }) => {
  console.error('API Error:', { code, error: error.toString() });

  if (code === 'VALIDATION' && error instanceof ValidationError) {
    set.status = 400;
    return { error: error.all?.map((z) => z.summary).join(','), code: 400 };
  }

  // 处理认证错误
  if (code === 401) {
    set.status = 401;
    return {
      error: typeof error === 'object' && error !== null && 'message' in error
        ? error.message
        : '认证失败',
      code: 401
    };
  }

  // 处理其他错误
  const statusCode = typeof code === 'number' ? code : 500;
  set.status = statusCode;
  return {
    error: error.toString(),
    code: statusCode
  };
});

// 向量索引管理相关
app.use(projects);
app.use(indexes);
app.use(files);
app.use(search);

app.use(
  swagger({
    documentation: {
      info: {
        description: APP_TITLE + ' - 支持API Token认证的RESTful API',
        title: APP_NAME + ' API',
        version: APP_VERSION,
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'API_TOKEN',
            description: '使用API Token进行认证，格式: Bearer <your_api_token>',
          },
        },
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
    },
    scalarCDN: 'https://cdn.kedao.ggss.club/standalone.min.js',
    path: '/ui',
    // specPath: 'api/ui/json',
  })
);

export type TElysiaApp = typeof app;
export type App = typeof app;

export { app };


