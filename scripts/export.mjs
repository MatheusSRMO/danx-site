// Gera uma versão 100% estática em out/ (pré-visualização sem servidor).
// A rota /api/cotacao não existe em export estático: ela é afastada durante o build
// e o formulário cai no envio pelo WhatsApp.
import { renameSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";

const api = "app/api";
const parked = ".api-parked";
if (existsSync(api)) renameSync(api, parked);
try {
  execSync("next build", { stdio: "inherit", env: { ...process.env, STATIC_EXPORT: "1" } });
} finally {
  if (existsSync(parked)) renameSync(parked, api);
}
