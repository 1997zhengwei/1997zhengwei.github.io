// 穷举每关所有坐法，统计星级分布（关卡设计用）
import { LEVELS } from '../src/data.mjs';
import { simulate, allAssignments } from '../src/rules.mjs';

const only = process.argv[2] ? Number(process.argv[2]) : null;
for (const level of LEVELS) {
  if (only && level.id !== only) continue;
  const t0 = Date.now();
  const dist = [0, 0, 0, 0];
  let total = 0, example3 = null;
  const involvedHist = {};
  for (const a of allAssignments(level)) {
    const sim = simulate(level, a);
    dist[sim.stars]++;
    total++;
    if (level.mode === 'chaos') involvedHist[sim.involved.length] = (involvedHist[sim.involved.length] || 0) + 1;
    if (sim.stars === 3 && !example3) example3 = { ...a };
  }
  console.log(`L${level.id} ${level.name} [${level.mode}] total=${total} 0★=${dist[0]} 1★=${dist[1]} 2★=${dist[2]} 3★=${dist[3]} (${(dist[3] / total * 100).toFixed(3)}%) ${Date.now() - t0}ms`);
  if (level.mode === 'chaos') console.log('   involved histogram', JSON.stringify(involvedHist));
  console.log('   3★ example', JSON.stringify(example3));
}
