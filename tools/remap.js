// Time-remap src.mp4 so perceived camera motion is constant. Writes remapped.mp4.
const fs = require("fs");
const { execFileSync } = require("child_process");
const FF = "./ffm/node_modules/ffmpeg-static/ffmpeg.exe";
const per = JSON.parse(fs.readFileSync("motion.json", "utf8"));
const T_OUT = 18;                                  // target output length, seconds
const M = per.reduce((a, b) => a + b, 0) / T_OUT;  // target motion per output second
let f = per.map((m) => M / m);
// 3-tap smoothing so speed changes are gradual, then clamp
f = f.map((_, i) => {
  const w = [f[i - 1], f[i], f[i + 1]].filter((x) => x !== undefined);
  return w.reduce((a, b) => a + b, 0) / w.length;
});
f = f.map((x) => Math.min(2.8, Math.max(0.6, x)));
// Manual overrides (source second -> speed): the final push into the close-up is fast in the footage; hold it to the pace of the rest
const OVERRIDE = { 20: 0.95, 21: 0.7, 22: 0.5, 23: 0.5 };
Object.entries(OVERRIDE).forEach(([i, v]) => { f[+i] = v; });
const outLen = f.reduce((a, x) => a + 1 / x, 0);
console.log("factors:", f.map((x, i) => `${i}:${x.toFixed(2)}`).join(" "));
console.log("output length ~", outLen.toFixed(2), "s");

const parts = [];
const labels = [];
f.forEach((x, i) => {
  const resample = x < 1
    ? "minterpolate=fps=24:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1"
    : "fps=24";
  parts.push(`[0:v]trim=start=${i}:end=${i + 1},setpts=(PTS-STARTPTS)/${x.toFixed(4)},${resample}[s${i}]`);
  labels.push(`[s${i}]`);
});
const graph = parts.join(";") + ";" + labels.join("") + `concat=n=${f.length}:v=1:a=0,setpts=N/24/TB[v]`;
fs.writeFileSync("remap-filter.txt", graph);
execFileSync(FF, [
  "-hide_banner", "-loglevel", "error", "-y", "-i", "src.mp4",
  "-filter_complex_script", "remap-filter.txt", "-map", "[v]",
  "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-movflags", "+faststart", "-pix_fmt", "yuv420p",
  "remapped.mp4"
], { stdio: "inherit" });
fs.writeFileSync("remap-factors.json", JSON.stringify({ M, f, outLen }));
console.log("done");
