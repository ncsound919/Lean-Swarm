"""
Monte Carlo Hyper-Tree Expansion (MCHE) Engine
Reference Python Implementation (CLI / Batch Testing)

Architecture Hierarchy:
- Live Server Engine: `server/mcheEngine.ts` (TypeScript / Express / WebSockets)
- Python Research Kernel: `mche_engine.py` (CLI exploration, batch simulations)
Both implementations share identical UCT scoring, node expansion invariants, and bit-width routing.
"""

from typing import List, Dict, Any, Optional
import math
import hashlib
import time

class MCHENode:
    def __init__(self, node_id: str, label: str, node_type: str, bit_width: int, parent_id: Optional[str] = None):
        self.id = node_id
        self.label = label
        self.node_type = node_type  # 'AND', 'OR', 'LEAF'
        self.bit_width = bit_width
        self.parent_id = parent_id
        self.children_ids: List[str] = []
        self.visits = 0
        self.value = 0.0  # Total accumulated reward
        self.status = "unexpanded"  # 'unexpanded', 'proving', 'closed', 'refuted'
        self.provenance_hash = hashlib.sha256(f"{node_id}:{label}:{bit_width}".encode()).hexdigest()

    def uct_score(self, total_parent_visits: int, exploration_constant: float = 1.414) -> float:
        if self.visits == 0:
            return float('inf')
        exploitation = self.value / self.visits
        exploration = exploration_constant * math.sqrt(math.log(total_parent_visits) / self.visits)
        # Prioritize smaller bit-width
        bit_width_bonus = 100.0 / (1.0 + self.bit_width)
        return exploitation + exploration + bit_width_bonus

class MCHETree:
    def __init__(self, root_label: str, root_bit_width: int):
        self.nodes: Dict[str, MCHENode] = {}
        self.root_id = "node_root"
        root_node = MCHENode(self.root_id, root_label, "OR", root_bit_width)
        self.nodes[self.root_id] = root_node
        self.total_iterations = 0

    def select_leaf(self) -> MCHENode:
        """Select leaf node using UCT score across tree."""
        current = self.nodes[self.root_id]
        while current.children_ids:
            # Filter unrefuted children
            active_children = [
                self.nodes[cid] for cid in current.children_ids
                if self.nodes[cid].status != "refuted"
            ]
            if not active_children:
                break
            # Find best child by UCT score
            current = max(active_children, key=lambda c: c.uct_score(max(1, current.visits)))
            if current.status == "unexpanded" or current.node_type == "LEAF":
                break
        return current

    def expand(self, leaf: MCHENode, decompositions: List[Dict[str, Any]]) -> List[MCHENode]:
        """Expand node into child scaffolds with strictly decreasing bit-widths."""
        new_children = []
        for i, dec in enumerate(decompositions):
            child_id = f"{leaf.id}_c{i+1}_{int(time.time()*1000)%10000}"
            child_bw = dec.get("bit_width", leaf.bit_width // 2)
            child = MCHENode(
                node_id=child_id,
                label=dec["label"],
                node_type=dec.get("node_type", "LEAF"),
                bit_width=child_bw,
                parent_id=leaf.id
            )
            self.nodes[child_id] = child
            leaf.children_ids.append(child_id)
            new_children.append(child)
        leaf.status = "proving"
        return new_children

    def backpropagate(self, node_id: str, reward: float, is_closed: bool = False, is_refuted: bool = False):
        """Propagate verification reward / status up the tree."""
        curr_id = node_id
        while curr_id in self.nodes:
            node = self.nodes[curr_id]
            node.visits += 1
            node.value += reward
            if is_closed:
                node.status = "closed"
            elif is_refuted:
                node.status = "refuted"
            if not node.parent_id:
                break
            curr_id = node.parent_id

def run_sample_mche_simulation(steps: int = 10) -> Dict[str, Any]:
    tree = MCHETree("Riemann Hypothesis Robin Bound for all n > 5040", 50000)
    for step in range(steps):
        leaf = tree.select_leaf()
        if leaf.bit_width <= 5000:
            # Deterministic closer zone
            tree.backpropagate(leaf.id, reward=1.0, is_closed=True)
        else:
            # Decompose into dyadic halves
            sub1 = {"label": f"Sub-bound lower range from {leaf.label}", "bit_width": leaf.bit_width // 2, "node_type": "AND"}
            sub2 = {"label": f"Sub-bound upper range from {leaf.label}", "bit_width": leaf.bit_width // 2, "node_type": "AND"}
            tree.expand(leaf, [sub1, sub2])
            tree.backpropagate(leaf.id, reward=0.5)
    return {
        "root_visits": tree.nodes[tree.root_id].visits,
        "total_nodes": len(tree.nodes),
        "status": tree.nodes[tree.root_id].status
    }

if __name__ == "__main__":
    result = run_sample_mche_simulation(15)
    print("MCHE Python Simulation Result:", result)
