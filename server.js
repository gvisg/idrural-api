import Fastify from 'fastify';
import { createClient } from '@supabase/supabase-js';
import cors from '@fastify/cors';

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });

// 🔐 Supabase (SERVICE ROLE — backend only)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 🩺 Health check
app.get('/', async () => {
  return {
    status: 'ok',
    service: 'IDRural API',
    env: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  };
});

// 👤 AUTH — quem sou eu?
app.get('/auth/me', async (request, reply) => {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return reply.code(401).send({ error: 'Missing Authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');

    // 1️⃣ Validar token no Supabase Auth
    const { data: userData, error: userError } =
      await supabase.auth.getUser(token);

    if (userError || !userData?.user) {
      return reply.code(401).send({ error: 'Invalid or expired token' });
    }

    const user = userData.user;

    // 2️⃣ Buscar vínculo institucional
    const { data: perfilData, error: perfilError } = await supabase
      .from('usuarios')
      .select(`
        id,
        municipios (
          id,
          nome,
          uf,
          codigo_ibge
        ),
        perfis (
          nome,
          descricao
        )
      `)
      .eq('id', user.id)
      .single();

    if (perfilError) {
      return reply.code(403).send({
        error: 'User not linked to municipality',
        details: perfilError.message
      });
    }

    // 3️⃣ Resposta institucional
    return {
      id: user.id,
      email: user.email,
      municipio: perfilData.municipios.nome,
      uf: perfilData.municipios.uf,
      codigo_ibge: perfilData.municipios.codigo_ibge,
      perfil: perfilData.perfis.nome
    };

  } catch (err) {
    request.log.error(err);
    return reply.code(500).send({ error: 'Internal server error' });
  }
});

// 🚀 Start server
const port = process.env.PORT || 3000;

app.listen({ port, host: '0.0.0.0' })
  .then(() => {
    console.log(`🚀 IDRural API rodando na porta ${port}`);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
