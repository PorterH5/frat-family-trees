export type MemberNode = {
  id: string;
  firstName: string;
  lastName: string | null;
  nickname: string | null;
  pledgeClass: string | null;
  bigId: string | null;
};

export type TreeNode = {
  name: string;
  attributes?: Record<string, string>;
  memberId?: string;
  children?: TreeNode[];
};

function displayName(m: MemberNode): string {
  const full = [m.firstName, m.lastName].filter(Boolean).join(" ");
  return m.nickname ? `${full} "${m.nickname}"` : full;
}

/**
 * Build a forest of family trees from a flat list of members.
 * Roots are members whose `bigId` is null or whose big isn't in the
 * provided list. Each returned node is the originator of a family line.
 */
export function buildForest(members: MemberNode[]): TreeNode[] {
  const byId = new Map<string, MemberNode>();
  for (const m of members) byId.set(m.id, m);

  const childrenByBig = new Map<string, MemberNode[]>();
  const roots: MemberNode[] = [];
  for (const m of members) {
    if (m.bigId && byId.has(m.bigId)) {
      const list = childrenByBig.get(m.bigId) ?? [];
      list.push(m);
      childrenByBig.set(m.bigId, list);
    } else {
      roots.push(m);
    }
  }

  // Detect simple cycles defensively and break them at the visited node.
  const visited = new Set<string>();
  const build = (m: MemberNode): TreeNode => {
    visited.add(m.id);
    const kids = (childrenByBig.get(m.id) ?? []).filter(
      (k) => !visited.has(k.id),
    );
    const node: TreeNode = {
      name: displayName(m),
      memberId: m.id,
      attributes: m.pledgeClass ? { pledgeClass: m.pledgeClass } : undefined,
    };
    if (kids.length) node.children = kids.map(build);
    return node;
  };

  // Sort roots by pledge class then name for stable display.
  roots.sort((a, b) => {
    const pa = a.pledgeClass ?? "";
    const pb = b.pledgeClass ?? "";
    if (pa !== pb) return pa.localeCompare(pb);
    return displayName(a).localeCompare(displayName(b));
  });

  return roots.map(build);
}
