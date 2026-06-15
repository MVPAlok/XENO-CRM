import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';
import { startSimulatorDaemon, stopSimulatorDaemon } from './services/simulatorService.js';

const server = app.listen(env.port, () => {
  console.log(`Xeno backend listening on http://localhost:${env.port}`);
  if (env.simulatorEnabled) startSimulatorDaemon();
});

const shutdown = async (signal) => {
  console.log(`${signal} received. Shutting down Xeno backend.`);
  stopSimulatorDaemon();
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
