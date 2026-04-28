import * as v from "@valibot/valibot";
import { configSchema, type TConfig } from "./configSchema.ts";

export const DEFAULT_CONFIG_JSON_PATH = "/app/config.json";
export const CONFIG_JSON_PATH = Deno.env.get("CONFIG_JSON_PATH") ??
  DEFAULT_CONFIG_JSON_PATH;

export async function loadConfigFromPath(
  path: string,
): Promise<TConfig | null> {
  try {
    const raw = await Deno.readTextFile(path);
    const parsedJson: unknown = JSON.parse(raw);
    const validated = v.safeParse(configSchema, parsedJson);

    if (!validated.success) {
      console.error(
        `Invalid config file at ${path}: ${JSON.stringify(validated.issues)}`,
      );
      return null;
    }

    return validated.output;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      console.error(`Config file not found at ${path}`);
      return null;
    }

    const message = error instanceof Error ? error.message : String(error);
    console.error(`Unable to load config file at ${path}: ${message}`);
    return null;
  }
}
