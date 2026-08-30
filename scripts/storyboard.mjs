// Extracts a storyboard (sequence of still frames + an HTML contact sheet)
// from a downloaded video, for planning a remake shot-by-shot.
//
// Requires ffmpeg/ffprobe on PATH.
//
//   node scripts/storyboard.mjs <video-file> [options]
//
// Options:
//   --out <dir>          output directory (default: storyboard-<video-basename>)
//   --mode <scene|interval>  scene = one frame per detected shot change (default);
//                             interval = one frame every --interval seconds
//   --threshold <0-1>    scene-change sensitivity in scene mode (default 0.35;
//                        lower = more frames, catches subtler cuts)
//   --interval <seconds> spacing in interval mode (default 5)
//   --max-frames <n>     cap on total frames (default 60; extras are thinned
//                        evenly rather than dropped from one end)
//   --width <px>         thumbnail width, height auto (default 480)
//
// Output:
//   <out>/frame-0001.jpg, frame-0002.jpg, ...
//   <out>/manifest.json  — [{ index, seconds, timecode, file }]
//   <out>/storyboard.html — contact sheet you can open in a browser

import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';

function parseArgs(argv) {
  const args = { mode: 'scene', threshold: 0.35, interval: 5, maxFrames: 60, width: 480 };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') args.out = argv[++i];
    else if (a === '--mode') args.mode = argv[++i];
    else if (a === '--threshold') args.threshold = Number(argv[++i]);
    else if (a === '--interval') args.interval = Number(argv[++i]);
    else if (a === '--max-frames') args.maxFrames = Number(argv[++i]);
    else if (a === '--width') args.width = Number(argv[++i]);
    else if (a === '--help' || a === '-h') args.help = true;
    else positional.push(a);
  }
  args.video = positional[0];
  return args;
}

function usageAndExit(code) {
  console.log(
    [
      'Usage: node scripts/storyboard.mjs <video-file> [options]',
      '',
      'Options:',
      '  --out <dir>              output directory',
      '  --mode <scene|interval>  default: scene',
      '  --threshold <0-1>        scene-change sensitivity (default 0.35)',
      '  --interval <seconds>     spacing for interval mode (default 5)',
      '  --max-frames <n>         cap on total frames (default 60)',
      '  --width <px>             thumbnail width (default 480)',
    ].join('\n')
  );
  process.exit(code);
}

function requireTool(cmd) {
  const check = spawnSync(cmd, ['-version']);
  if (check.error || check.status !== 0) {
    console.error(`error: "${cmd}" not found on PATH — install ffmpeg first.`);
    process.exit(1);
  }
}

function run(cmd, cmdArgs) {
  const result = spawnSync(cmd, cmdArgs, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 64 });
  if (result.error) throw result.error;
  return result;
}

function getDuration(video) {
  const result = run('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    video,
  ]);
  const seconds = Number(result.stdout.trim());
  if (!Number.isFinite(seconds) || seconds <= 0) {
    throw new Error(`could not read duration from "${video}"`);
  }
  return seconds;
}

// Scene mode: ask ffmpeg to select frames where the scene-change score
// exceeds `threshold`, and read back their timestamps from showinfo logs.
function detectSceneTimestamps(video, threshold) {
  const result = run('ffmpeg', [
    '-i', video,
    '-vf', `select='gt(scene,${threshold})',showinfo`,
    '-vsync', 'vfr',
    '-f', 'null',
    '-',
  ]);
  const timestamps = [];
  const re = /pts_time:([\d.]+)/g;
  let match;
  while ((match = re.exec(result.stderr)) !== null) {
    timestamps.push(Number(match[1]));
  }
  if (timestamps.length === 0 || timestamps[0] > 0.05) timestamps.unshift(0);
  return timestamps;
}

function intervalTimestamps(duration, interval) {
  const timestamps = [];
  for (let t = 0; t < duration; t += interval) timestamps.push(t);
  return timestamps;
}

// Evenly thin a sorted list down to at most `max` entries, always keeping
// the first and last.
function thin(list, max) {
  if (list.length <= max) return list;
  const out = [];
  const step = (list.length - 1) / (max - 1);
  for (let i = 0; i < max; i++) out.push(list[Math.round(i * step)]);
  return [...new Set(out)];
}

function timecode(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = (seconds % 60).toFixed(2).padStart(5, '0');
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${s}`;
}

function extractFrame(video, seconds, outFile, width) {
  const result = run('ffmpeg', [
    '-y',
    '-ss', String(seconds),
    '-i', video,
    '-frames:v', '1',
    '-q:v', '3',
    '-vf', `scale=${width}:-1`,
    outFile,
  ]);
  if (result.status !== 0 || !existsSync(outFile)) {
    throw new Error(`failed to extract frame at ${seconds}s: ${result.stderr.slice(-500)}`);
  }
}

function writeStoryboardHtml(outDir, videoName, frames) {
  const cards = frames
    .map(
      (f) => `      <figure>
        <img src="${f.file}" alt="frame ${f.index} at ${f.timecode}" loading="lazy">
        <figcaption>#${f.index} — ${f.timecode}</figcaption>
      </figure>`
    )
    .join('\n');
  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Storyboard — ${videoName}</title>
<style>
  body { font-family: system-ui, sans-serif; background: #111; color: #eee; margin: 0; padding: 24px; }
  h1 { font-size: 18px; font-weight: 600; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; margin-top: 16px; }
  figure { margin: 0; background: #1c1c1c; border-radius: 8px; overflow: hidden; }
  figure img { display: block; width: 100%; height: auto; }
  figcaption { padding: 6px 10px; font-size: 12px; color: #aaa; font-variant-numeric: tabular-nums; }
</style>
</head>
<body>
<h1>Storyboard — ${videoName} (${frames.length} frames)</h1>
<div class="grid">
${cards}
</div>
</body>
</html>
`;
  writeFileSync(join(outDir, 'storyboard.html'), html);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.video) usageAndExit(args.help ? 0 : 1);

  const video = resolve(args.video);
  if (!existsSync(video)) {
    console.error(`error: video file not found: ${video}`);
    process.exit(1);
  }

  requireTool('ffmpeg');
  requireTool('ffprobe');

  const videoName = basename(video);
  const outDir = resolve(args.out || `storyboard-${basename(video, extname(video))}`);
  mkdirSync(outDir, { recursive: true });

  const duration = getDuration(video);
  console.log(`${videoName}: ${timecode(duration)} long`);

  let timestamps;
  if (args.mode === 'interval') {
    timestamps = intervalTimestamps(duration, args.interval);
    console.log(`interval mode: one frame every ${args.interval}s`);
  } else {
    timestamps = detectSceneTimestamps(video, args.threshold);
    console.log(`scene mode: ${timestamps.length} shot change(s) detected (threshold ${args.threshold})`);
    if (timestamps.length < 3) {
      console.log('too few scene changes for a useful storyboard — falling back to interval mode');
      timestamps = intervalTimestamps(duration, args.interval);
    }
  }

  timestamps = thin(timestamps.sort((a, b) => a - b), args.maxFrames);

  const frames = timestamps.map((seconds, i) => {
    const index = i + 1;
    const file = `frame-${String(index).padStart(4, '0')}.jpg`;
    extractFrame(video, seconds, join(outDir, file), args.width);
    return { index, seconds, timecode: timecode(seconds), file };
  });

  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(frames, null, 2));
  writeStoryboardHtml(outDir, videoName, frames);

  console.log(`wrote ${frames.length} frames to ${outDir}`);
  console.log(`open ${join(outDir, 'storyboard.html')} to review`);
}

main();
