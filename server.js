import Fastify from 'fastify';

const app = Fastify({
  logger: true
});

app.get('/', async () => {
  return {
    status: 'ok',
    service: 'IDRural API',
    env: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  };
});

const port = process.env.PORT || 3000;

app.listen({ port, host: '0.0.0.0' })
  .then(() => {
    console.log(`🚀 IDRural API rodando na porta ${port}`);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
