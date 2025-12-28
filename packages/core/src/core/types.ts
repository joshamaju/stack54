import { ManifestChunk } from "vite";

export type Command = "build" | "serve";

export type EntryOption = { cwd: string; config_file?: string };

export type ManifestEntry = Pick<ManifestChunk, "file" | "src">;

export type Manifest = Record<string, ManifestEntry[]>;
