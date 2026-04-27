import type { UserConfig } from "@hey-api/openapi-ts";

export default ({
  input: "./docker/docker.v1.54.yaml",
  output: {
    path: "docker/generated",
    module: {
      extension: "ts",
    },
  },
  plugins: ["@hey-api/typescript"],
}) satisfies UserConfig;
