"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { TreeNode } from "@/lib/tree";

const Tree = dynamic(() => import("react-d3-tree").then((m) => m.Tree), {
  ssr: false,
});

const NODE_W = 200;
const NODE_H = 72;

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
      {/* Styles for react-d3-tree links and text rendering. Scoped via the
          .frat-tree wrapper so this doesn't affect anything else. */}
      <style>{`
        .frat-tree .rd3t-link {
          stroke: #52525b;
          stroke-width: 2;
          fill: none;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        .frat-tree .rd3t-tree-container svg {
          text-rendering: geometricPrecision;
          shape-rendering: geometricPrecision;
        }
      `}</style>
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
      <div ref={containerRef} className="flex-1 w-full frat-tree">
        <Tree
          data={toShow}
          orientation="vertical"
          translate={translate}
          zoomable
          collapsible={false}
          pathFunc="elbow"
          separation={{ siblings: 1.4, nonSiblings: 1.6 }}
          nodeSize={{ x: NODE_W + 40, y: NODE_H + 60 }}
          renderCustomNodeElement={({ nodeDatum }) => {
            const pledge = nodeDatum.attributes?.pledgeClass as
              | string
              | undefined;
            return (
              <g>
                {/* HTML-rendered card via foreignObject — gives us crisp,
                    subpixel-accurate text rendering instead of fuzzy SVG text. */}
                <foreignObject
                  x={-NODE_W / 2}
                  y={-NODE_H / 2}
                  width={NODE_W}
                  height={NODE_H}
                >
                  <div
                    style={{
                      width: NODE_W,
                      height: NODE_H,
                      boxSizing: "border-box",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 2,
                      padding: "6px 10px",
                      background: "#ffffff",
                      border: "1.5px solid #3f3f46",
                      borderRadius: 10,
                      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                      fontFamily:
                        'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                      color: "#18181b",
                      textAlign: "center",
                      lineHeight: 1.2,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        width: "100%",
                      }}
                      title={nodeDatum.name}
                    >
                      {nodeDatum.name}
                    </div>
                    {pledge && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "#71717a",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          width: "100%",
                        }}
                      >
                        {pledge}
                      </div>
                    )}
                  </div>
                </foreignObject>
              </g>
            );
          }}
        />
      </div>
    </div>
  );
}
