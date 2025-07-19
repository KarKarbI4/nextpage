import { readdir, readFile, stat, writeFile, mkdir } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { cwd } from "node:process";

export async function readOptions() {
  const dotDir = await findDotDir();
  let template = "";
  let isDir = false;

  for (const file of await readdir(dotDir)) {
    if (basename(file).startsWith("template")) {
      template = file;
      isDir = (await stat(resolve(dotDir, file))).isDirectory();
      break;
    }
  }

  let config = {};

  try {
    const configStr = await readFile(resolve(dotDir, "config.json"), {
      encoding: "utf-8",
    }).catch(() => null);

    if (typeof configStr === "string") {
      config = JSON.parse(configStr);
    }
  } catch {
    throw new Error("File .nextpage/config.json is malformed");
  }

  return {
    dotDir,
    template,
    isDir,
    config,
  };
}

export async function writeOptions(options) {
  await writeFile(
    resolve(options.dotDir, "./config.json"),
    JSON.stringify(options.config, undefined, 2),
    { encoding: "utf-8" }
  );
}

const initConfig = {
  open: "open ./hello.txt",
  prepare: "",
};

async function initDotDir() {
  console.log("Initializing .nextpage");
  const currentDir = cwd();
  try {
    const dotDir = resolve(currentDir, ".nextpage");
    await mkdir(dotDir);
    await writeFile(
      resolve(dotDir, "config.json"),
      JSON.stringify(initConfig, undefined, 2),
      { encoding: "utf-8" }
    );
    await mkdir(resolve(dotDir, "template"));
    await writeFile(resolve(dotDir, "template/hello.txt"), "Hello, world!", {
      encoding: "utf-8",
    });
    return dotDir;
  } catch {
    throw new Error("Failed to initialize .nextpage");
  }
}

async function findDotDir() {
  let currentDir = cwd();

  while (currentDir !== "/") {
    const dotDir = resolve(currentDir, ".nextpage");
    if ((await stat(dotDir).catch(() => null))?.isDirectory()) {
      return dotDir;
    }

    currentDir = dirname(currentDir);
  }

  return await initDotDir();
}
