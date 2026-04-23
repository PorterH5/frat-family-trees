"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { TreeNode } from "@/lib/tree";

const Tree = dynamic(() => import("react-d3-tree").then((m) => m.Tree), {
  ssr: false,
});

export function TreeView({ forest }: { forest: TreeNode[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [translate, setTranslate] = useState({ x: 200, y: 60 });
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const { width } = el.getBoundingClientRect();
    setTranslate({ x: width / 2, y: 80 });
  }, [activeIndex]);

  const data = useMemo(() => {
    if (forest.length === 1) return forest[0];
    // Wrap in a synthetic root so all families render when "All" is selected.
    return {
      name: "All families",
      children: forest,
    } satisfies TreeNode;
  }, [forest]);

  const toShow =
    forest.length <= 1 ? data : activeIndex === -1 ? data : forest[activeIndex];

  return (
    <div className="h-full w-full flex flex-col">
      {forest.length > 1 && (
        <div className="flex flex-wrap gap-2 p-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
          <button
            onClick={() => setActiveIndex(-1)}
            className={`text-xs px-3 py-1 rounded-full border ${
              activeIndex === -1
                ? "bg-zinc-900 text-zinc-50 border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100"
                : "border-zinc-300 dark:border-zinc-700"
            }`}
          >
            All families
          </button>
          {forest.map((root, i) => (
            <button
              key={root.memberId ?? i}
              onClick={() => setActiveIndex(i)}
              className={`text-xs px-3 py-1 rounded-full border ${
                activeIndex === i
                  ? "bg-zinc-900 text-zinc-50 border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100"
                  : "border-zinc-300 dark:border-zinc-700"
              }`}
            >
              {root.name}
            </button>
          ))}
        </div>
      )}
      <div ref={containerRef} className="flex-1 w-full">
        <Tree
          data={toShow}
          orientation="vertical"
          translate={translate}
          zoomable
          collapsible={false}
          pathFunc="elbow"
          separation={{ siblings: 1.2, nonSiblings: 1.4 }}
          nodeSize={{ x: 200, y: 100 }}
          renderCustomNodeElement={({ nodeDatum }) => {
            const pledge = nodeDatum.attributes?.pledgeClass as
              | string
              | undefined;
            return (
              <g>
                <rect
                  width={180}
                  height={56}
                  x={-90}
                  y={-28}
                  rx={8}
                  ry={8}
                  fill="#ffffff"
                  stroke="#3f3f46"
                  strokeWidth={1}
                />
                <text
                  textAnchor="middle"
                  y={-6}
                  className="fill-zinc-900"
                  style={{ fontSize: 13, fontWeight: 600 }}
                >
                  {nodeDatum.name.length > 24
                    ? nodeDatum.name.slice(0, 22) + "…"
                    : nodeDatum.name}
                </text>
                {pledge && (
                  <text
                    textAnchor="middle"
                    y={14}
                    className="fill-zinc-500"
                    style={{ fontSize: 11 }}
                  >
                    {pledge}
                  </text>
                )}
              </g>
            );
          }}
        />
      </div>
    </div>
  );
}
