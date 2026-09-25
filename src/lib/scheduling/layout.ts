import type { ScheduleBlock } from "@/types/domain";

export interface PositionedBlock {
  block: ScheduleBlock;
  lane: number;
  lanes: number;
}

/**
 * Assigns overlapping timed blocks to side-by-side lanes (like a calendar).
 * Blocks in the same overlap cluster share the cluster's lane count.
 */
export function layoutDayBlocks(blocks: readonly ScheduleBlock[]): PositionedBlock[] {
  const timed = blocks
    .filter((b) => b.startMinutes !== null)
    .sort((a, b) => a.startMinutes! - b.startMinutes! || b.durationMinutes - a.durationMinutes);
  const out: PositionedBlock[] = [];
  let cluster: PositionedBlock[] = [];
  let laneEnds: number[] = [];
  let clusterEnd = -1;

  const flush = () => {
    const lanes = laneEnds.length;
    for (const p of cluster) p.lanes = lanes;
    out.push(...cluster);
    cluster = [];
    laneEnds = [];
  };

  for (const block of timed) {
    const start = block.startMinutes!;
    const end = start + block.durationMinutes;
    if (start >= clusterEnd && cluster.length) flush();
    let lane = laneEnds.findIndex((e) => e <= start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(end);
    } else laneEnds[lane] = end;
    cluster.push({ block, lane, lanes: 1 });
    clusterEnd = Math.max(clusterEnd, end);
  }
  if (cluster.length) flush();
  return out;
}
