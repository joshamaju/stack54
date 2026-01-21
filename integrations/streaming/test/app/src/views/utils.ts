export const delay = (ms: number, fail = false) => {
  return new Promise((rs, rj) => setTimeout(fail ? rj : rs, ms, "Success"));
};
