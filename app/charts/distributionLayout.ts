import { type Department } from "../data/experienceTypes";

export type DistributionFrame = {
  rows: {
    department: Department;
    change: number;
    targetChange: number;
    y: number;
    radius: number;
  }[];
  min: number;
  max: number;
  increaseShare: number;
};

export function buildDistributionLayout(
  target: { department: Department; change: number | null }[],
  selectedCode: string,
  width = 720,
  height = 160,
): DistributionFrame {
  const min = Math.min(0, ...target.map((row) => row.change!));
  const max = Math.max(0, ...target.map((row) => row.change!));
  const scaleX = (value: number) =>
    20 + ((value - min) / Math.max(0.001, max - min)) * (width - 40);
  const pixelScale = 160 / Math.max(20, height);
  const normalRadius = 4.1 * pixelScale;
  const collisionGap = 0.28 * pixelScale;
  type PhysicsNode = DistributionFrame["rows"][number] & { x: number };
  const nodes: PhysicsNode[] = [...target]
    .sort((a, b) => a.change! - b.change!)
    .map((row, index) => ({
      department: row.department,
      change: row.change!,
      targetChange: row.change!,
      x: scaleX(row.change!),
      y: 80 + (index % 2 ? 1 : -1) * (0.03 + index * 0.001),
      radius: normalRadius,
    }));
  const resolveCollisions = (attraction: number) => {
    for (const node of nodes) node.y += (80 - node.y) * attraction;
    for (let leftIndex = 0; leftIndex < nodes.length; leftIndex += 1) {
      for (
        let rightIndex = leftIndex + 1;
        rightIndex < nodes.length;
        rightIndex += 1
      ) {
        const left = nodes[leftIndex];
        const right = nodes[rightIndex];
        const minimumDistance = left.radius + right.radius + collisionGap;
        const deltaX = right.x - left.x;
        if (Math.abs(deltaX) >= minimumDistance) continue;
        const minimumDeltaY = Math.sqrt(
          Math.max(0, minimumDistance ** 2 - deltaX ** 2),
        );
        const deltaY = right.y - left.y;
        if (Math.abs(deltaY) >= minimumDeltaY) continue;
        const direction =
          Math.abs(deltaY) < 0.0001
            ? (leftIndex + rightIndex) % 2
              ? 1
              : -1
            : Math.sign(deltaY);
        const correction = (minimumDeltaY - Math.abs(deltaY)) / 2;
        left.y -= direction * correction;
        right.y += direction * correction;
      }
    }
    for (const node of nodes)
      node.y = Math.max(node.radius + 2, Math.min(158 - node.radius, node.y));
  };

  for (let iteration = 0; iteration < 180; iteration += 1)
    resolveCollisions(0.075);
  const selectedNode = nodes.find(
    (node) => node.department.code === selectedCode,
  );
  if (selectedNode) selectedNode.radius = 9 * pixelScale;
  for (let iteration = 0; iteration < 140; iteration += 1)
    resolveCollisions(0.055);
  for (let iteration = 0; iteration < 20; iteration += 1) resolveCollisions(0);

  const rows = target.map(
    (row) =>
      nodes.find((node) => node.department.code === row.department.code)!,
  );
  return {
    rows,
    min,
    max,
    increaseShare: rows.length
      ? (100 * rows.filter((row) => row.change > 0).length) / rows.length
      : 0,
  };
}
