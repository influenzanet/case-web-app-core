import peerDepsExternal from "rollup-plugin-peer-deps-external";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "rollup-plugin-typescript2";
import postcss from "rollup-plugin-postcss";
import copy from "rollup-plugin-copy";
import json from "@rollup/plugin-json";

import packageJson from "./package.json" assert { type: "json" };

const config = {
  input: "src/index.ts",
  output: [
    {
      file: packageJson.main,
      format: "cjs",
      sourcemap: true,
      sourcemapExcludeSources: true,
    },
    {
      file: packageJson.module,
      format: "esm",
      sourcemap: true,
      sourcemapExcludeSources: true,
    },
  ],
  plugins: [
    peerDepsExternal(),
    resolve({ browser: true }),
    commonjs(),
    json(),
    typescript({
      tsconfig: "tsconfig.json",
      useTsconfigDeclarationDir: true,
    }),
    postcss({ modules: true }),
    copy({
      targets: [{ src: "src/scss/*", dest: "build/scss" }],
    }),
  ],
};

export default config;
