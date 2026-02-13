import Fastify from 'fastify';
import cors from '@fastify/cors';
import { sessionRoutes } from './routes/session.js';
import { analyticsRoutes } from './routes/analytics.js';
import { loadScenarios } from './engine/scenario-resolver.js';

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function main() {
    const app = Fastify({ logger: true });

    await app.register(cors, { origin: true });

    // Load scenario YAML content
    loadScenarios();

    // Health check
    app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

    // Routes
    await app.register(sessionRoutes, { prefix: '/api' });
    await app.register(analyticsRoutes, { prefix: '/api' });

    await app.listen({ port: PORT, host: HOST });
    console.log(`\n🎮 CareerSim API listening on http://localhost:${PORT}\n`);
}

main().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
