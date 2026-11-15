// Minimal UCI client for the Stockfish.js Node build. Local tooling only (never imported by the app).
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import path from "node:path";
import { createInterface } from "node:readline";

export type InfoLine = { depth: number; cp?: number; mate?: number; pv: string[] };

export function parseInfoLine(line: string): InfoLine | null {
  if (!line.startsWith("info ")) return null;
  const t = line.trim().split(/\s+/);
  const depthIdx = t.indexOf("depth");
  const scoreIdx = t.indexOf("score");
  if (depthIdx < 0 || scoreIdx < 0) return null;
  const depth = Number(t[depthIdx + 1]);
  const kind = t[scoreIdx + 1];
  const value = Number(t[scoreIdx + 2]);
  if (!Number.isFinite(depth) || !Number.isFinite(value)) return null;
  const pvIdx = t.indexOf("pv");
  const pv = pvIdx >= 0 ? t.slice(pvIdx + 1) : [];
  if (kind === "cp") return { depth, cp: value, pv };
  if (kind === "mate") return { depth, mate: value, pv };
  return null;
}

export type SearchResult = { info: InfoLine | null; bestMove: string };

const ENGINE_PATH = path.resolve("node_modules/stockfish/bin/stockfish-19-lite-single.js");

export class UciEngine {
  private proc: ChildProcessWithoutNullStreams;
  private waiters: ((line: string) => boolean)[] = [];

  constructor() {
    this.proc = spawn("node", [ENGINE_PATH], { stdio: ["pipe", "pipe", "pipe"] });
    createInterface({ input: this.proc.stdout }).on("line", (line) => {
      if (this.waiters.length > 0 && this.waiters[0](line)) this.waiters.shift();
    });
  }

  private send(cmd: string): void {
    this.proc.stdin.write(cmd + "\n");
  }

  private waitFor(done: (line: string) => boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      this.proc.once("error", reject);
      this.waiters.push((line) => {
        if (!done(line)) return false;
        resolve();
        return true;
      });
    });
  }

  async init(): Promise<void> {
    const ready = this.waitFor((l) => l === "uciok");
    this.send("uci");
    await ready;
    await this.isReady();
  }

  private async isReady(): Promise<void> {
    const ready = this.waitFor((l) => l === "readyok");
    this.send("isready");
    await ready;
  }

  async newGame(): Promise<void> {
    this.send("ucinewgame");
    await this.isReady();
  }

  async search(fen: string, depth: number, moves: string[] = []): Promise<SearchResult> {
    let info: InfoLine | null = null;
    let bestMove = "";
    const finished = this.waitFor((line) => {
      const parsed = parseInfoLine(line);
      if (parsed) info = parsed;
      const m = /^bestmove (\S+)/.exec(line);
      if (m) bestMove = m[1];
      return m !== null;
    });
    this.send(`position fen ${fen}${moves.length > 0 ? ` moves ${moves.join(" ")}` : ""}`);
    this.send(`go depth ${depth}`);
    await finished;
    return { info, bestMove };
  }

  quit(): void {
    this.send("quit");
    this.proc.stdin.end();
  }
}
