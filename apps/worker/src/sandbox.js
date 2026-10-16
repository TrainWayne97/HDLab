// Runs the hdl-sim-verilator container for one job and reads its results.
// The container executes code written by users (Verilog via Verilator, Cocotb testbenches
// in Python, $system, ...), so it is treated as hostile:
// - it only sees its own job directory, not /simtmp with the jobs of other users
// - no network, no capabilities, no new privileges, runs as nobody
// - memory, CPU, process count and file size are limited, and it is killed after a timeout
// - everything it leaves behind is read without following symlinks, so a planted
//   `sim.log -> /proc/self/environ` can't make the worker leak its own files or secrets
import { promises as fs, constants as fsConstants } from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { randomBytes } from 'crypto';

const IMAGE = process.env.SIM_IMAGE || 'hdl-sim-verilator';
const BASE_TMP = '/simtmp';

const LIMITS = {
  memory: process.env.SIM_MEMORY_LIMIT || '4g',
  cpus: process.env.SIM_CPU_LIMIT || '2',
  pids: process.env.SIM_PIDS_LIMIT || '512',
  // Largest single file the container may write (RLIMIT_FSIZE, bytes)
  fileSize: Number(process.env.SIM_MAX_FILE_BYTES) || 256 * 1024 * 1024,
};

// Container output that is forwarded to the worker's own log, per job
const MAX_FORWARDED_OUTPUT = 64 * 1024;

/** Creates a fresh job directory under /simtmp that the (unprivileged) container can write to. */
export async function createJobDir(prefix) {
  await fs.mkdir(BASE_TMP, { recursive: true });
  const dir = await fs.mkdtemp(path.join(BASE_TMP, prefix));
  await fs.chmod(dir, 0o777);
  return dir;
}

export function removeJobDir(dir) {
  return fs.rm(dir, { recursive: true, force: true }).catch(() => {});
}

function dockerCli(args) {
  return new Promise(resolve => {
    const proc = spawn('docker', args, { stdio: 'ignore' });
    proc.on('error', () => resolve());
    proc.on('close', () => resolve());
  });
}

/**
 * Runs the sim container in `jobDir` (created with createJobDir).
 * @param {string} jobDir
 * @param {Record<string, string>} env - environment for entrypoint.sh
 * @param {number} timeoutMs - the container is killed after this time
 * @returns {Promise<{code: number|null, timedOut: boolean}>}
 */
export async function runSandbox(jobDir, env, timeoutMs) {
  // The worker sees the job at /simtmp/<name>, the Docker daemon needs the path on the host
  const hostDir = path.join(process.env.SIMTMP_HOST_PATH || BASE_TMP, path.basename(jobDir));
  const name = `hdlsim-${randomBytes(8).toString('hex')}`;
  const args = [
    'run', '--rm', '--name', name,
    '--network', 'none',
    '--cap-drop', 'ALL',
    '--security-opt', 'no-new-privileges',
    '--user', '65534:65534',
    '--pids-limit', String(LIMITS.pids),
    '--memory', LIMITS.memory,
    '--memory-swap', LIMITS.memory,
    '--cpus', String(LIMITS.cpus),
    '--ulimit', `fsize=${LIMITS.fileSize}`,
    '-v', `${hostDir}:${jobDir}`,
    '-w', jobDir,
    '-e', 'HOME=/tmp',
  ];
  for (const [key, value] of Object.entries(env)) args.push('-e', `${key}=${value}`);
  args.push(IMAGE);

  let timedOut = false;
  const code = await new Promise(resolve => {
    const docker = spawn('docker', args);
    let forwarded = 0;
    const forward = stream => chunk => {
      if (forwarded >= MAX_FORWARDED_OUTPUT) return;
      forwarded += chunk.length;
      stream.write(chunk);
      if (forwarded >= MAX_FORWARDED_OUTPUT) stream.write(`\n[sandbox] output of ${name} truncated\n`);
    };
    docker.stdout.on('data', forward(process.stdout));
    docker.stderr.on('data', forward(process.stderr));
    // Killing the docker CLI would leave the container running: kill the container itself
    const timer = setTimeout(() => {
      timedOut = true;
      dockerCli(['kill', name]);
    }, timeoutMs);
    docker.on('error', err => {
      clearTimeout(timer);
      console.error('[sandbox] Could not start docker:', err);
      resolve(null);
    });
    docker.on('close', exitCode => {
      clearTimeout(timer);
      resolve(exitCode);
    });
  });
  // Normally gone already (--rm); makes sure nothing in the container still writes to the
  // job directory while the results are read
  if (timedOut || code === null) await dockerCli(['rm', '-f', name]);
  return { code, timedOut };
}

/**
 * Reads a file the container left in its job directory. Refuses symlinks (anywhere in the
 * path) and anything that isn't a regular file.
 * @param {string} jobDir
 * @param {string} relPath - e.g. 'sim.log' or 'obj_dir/waveform.vcd'
 * @param {{maxBytes: number, truncate?: boolean, encoding?: string}} opts - larger files are
 *   cut to maxBytes (truncate) or rejected with an error (code 'ETOOBIG')
 * @returns {Promise<string|Buffer>} rejects with code 'ENOENT' if the file doesn't exist
 */
export async function readJobFile(jobDir, relPath, { maxBytes, truncate = false, encoding } = {}) {
  const target = path.resolve(jobDir, relPath);
  if (!target.startsWith(path.resolve(jobDir) + path.sep)) throw new Error(`Invalid path: ${relPath}`);
  const real = await fs.realpath(target);
  if (real !== target) throw Object.assign(new Error(`${relPath} is a symlink`), { code: 'ESYMLINK' });

  const handle = await fs.open(target, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW);
  try {
    const stat = await handle.stat();
    if (!stat.isFile()) throw Object.assign(new Error(`${relPath} is not a regular file`), { code: 'ENOTFILE' });
    if (stat.size > maxBytes && !truncate) {
      throw Object.assign(new Error(`${relPath} is too large (${stat.size} bytes)`), { code: 'ETOOBIG' });
    }
    const length = Math.min(stat.size, maxBytes);
    const buffer = Buffer.alloc(length);
    let offset = 0;
    while (offset < length) {
      const { bytesRead } = await handle.read(buffer, offset, length - offset, offset);
      if (bytesRead === 0) break;
      offset += bytesRead;
    }
    const data = buffer.subarray(0, offset);
    if (!encoding) return data;
    const text = data.toString(encoding);
    return stat.size > maxBytes ? `${text}\n\n[... Ausgabe gekürzt: ${stat.size} Bytes, gezeigt werden die ersten ${maxBytes}]` : text;
  } finally {
    await handle.close();
  }
}

/** Like readJobFile, but returns `fallback` if the file is missing or unusable (logged). */
export async function readJobFileOr(jobDir, relPath, opts, fallback) {
  try {
    return await readJobFile(jobDir, relPath, opts);
  } catch (err) {
    if (err?.code !== 'ENOENT') console.warn(`[sandbox] Not reading ${relPath}:`, err?.message || err);
    return fallback;
  }
}

/** Plain Verilog identifier (no escaped identifiers): what the worker accepts as top module. */
export const isVerilogIdentifier = name => typeof name === 'string' && /^[A-Za-z_][A-Za-z0-9_$]{0,127}$/.test(name);
