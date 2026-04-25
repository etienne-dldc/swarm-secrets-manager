import type { UserConfig } from "@hey-api/openapi-ts";

export default ({
  input: "./docker/docker.v1.54.yaml",
  output: {
    path: "docker/client",
    module: {
      extension: "ts",
    },
  },
}) satisfies UserConfig;
