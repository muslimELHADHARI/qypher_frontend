import fs from "fs";
import path from "path";

const CONFIG_PATH = path.join(process.cwd(), "data", "autoblock_config.json");

interface AutoBlockConfig {
  enabled: boolean;
  minSeverity: "HIGH" | "CRITICAL";
}

const DEFAULT_CONFIG: AutoBlockConfig = {
  enabled: false,
  minSeverity: "HIGH"
};

export function getAutoBlockConfig(): AutoBlockConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("[Config] Failed to load config:", err);
  }
  return DEFAULT_CONFIG;
}

export function setAutoBlockConfig(config: Partial<AutoBlockConfig>) {
  try {
    const current = getAutoBlockConfig();
    const updated = { ...current, ...config };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(updated, null, 2));
    return updated;
  } catch (err) {
    console.error("[Config] Failed to save config:", err);
    throw err;
  }
}
