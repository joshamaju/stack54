
export type Entry = Record<string, string>;

export type Assets = Record<string, string | Entry>;


export type Config = {
  outFile?: string;
  namespace?: string;
  staticDir?: string;
  exclude?: string[];
};