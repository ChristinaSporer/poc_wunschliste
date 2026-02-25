import { execSync, spawn, type ChildProcess } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const INTEGRATION_PORT = 4010;
const BASE_URL = `http://127.0.0.1:${INTEGRATION_PORT}`;

async function waitForServer(processRef: ChildProcess) {
  for (let attempt = 0; attempt < 90; attempt++) {
    if (processRef.exitCode !== null) {
      throw new Error(`Next.js dev server stopped early with code ${processRef.exitCode}.`);
    }

    try {
      const response = await fetch(`${BASE_URL}/api/people`);
      if (response.status < 500) {
        return;
      }
    } catch {
      // server is not ready yet
    }

    await delay(1000);
  }

  throw new Error("Timed out while waiting for integration test server.");
}

export default async function globalSetup() {
  const testDatabaseUrl = process.env.DATABASE_URL_TEST;

  if (!testDatabaseUrl) {
    process.env.SKIP_INTEGRATION_TESTS = "1";
    process.env.INTEGRATION_BASE_URL = BASE_URL;
    console.warn("Skipping integration tests: DATABASE_URL_TEST is not set.");
    return;
  }

  process.env.SKIP_INTEGRATION_TESTS = "0";
  process.env.INTEGRATION_BASE_URL = BASE_URL;
  process.env.DATABASE_URL = testDatabaseUrl;

  execSync("npx prisma migrate reset --force --skip-seed --skip-generate", {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: testDatabaseUrl,
    },
  });

  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  const serverProcess = spawn(npmCommand, ["run", "dev", "--", "-p", String(INTEGRATION_PORT)], {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: testDatabaseUrl,
      PORT: String(INTEGRATION_PORT),
      NEXT_TELEMETRY_DISABLED: "1",
    },
  });

  await waitForServer(serverProcess);

  return async () => {
    if (serverProcess.exitCode === null && !serverProcess.killed) {
      serverProcess.kill("SIGTERM");
      await delay(1000);
      if (serverProcess.exitCode === null) {
        serverProcess.kill("SIGKILL");
      }
    }
  };
}
