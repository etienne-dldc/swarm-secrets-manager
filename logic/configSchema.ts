import * as v from "@valibot/valibot";

const secretTypeSchema = v.picklist(["string", "json"]);

const stringSecretSchema = v.object({
  name: v.string(),
  type: v.literal("string"),
  description: v.string(),
  options: v.optional(
    v.partial(
      v.object({
        allowGenerate: v.boolean(),
        generateHexBytes: v.number(),
      }),
    ),
  ),
});

const jsonSecretSchema = v.object({
  name: v.string(),
  type: v.literal("json"),
  description: v.string(),
  options: v.optional(
    v.partial(
      v.object({
        defaultTemplate: v.string(),
      }),
    ),
  ),
});

const secretSchema = v.variant("type", [stringSecretSchema, jsonSecretSchema]);

export const configSchema = v.object({
  secrets: v.array(secretSchema),
});

export type TConfig = v.InferOutput<typeof configSchema>;
export type TSecretConfig = v.InferOutput<typeof secretSchema>;
export type TSecretType = v.InferOutput<typeof secretTypeSchema>;
