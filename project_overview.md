# Basic Block Visualizer — Project Overview & Live Walkthrough

The **Basic Block Visualizer** is a Compiler Design / Lab 01 static analysis workbench for **Three Address Code (TAC)**. It parses TAC statements, identifies leader instructions, partitions instructions into basic blocks, computes dominators & cyclomatic complexity, and renders an interactive Control Flow Graph (CFG).

---

## 🚀 Live Application Status

Both servers are currently running and accessible:
- **Frontend (React + Vite):** [http://localhost:5173](http://localhost:5173)
- **Backend API (Node.js + Express):** [http://localhost:5050](http://localhost:5050)

---

## 📸 Live Visualizer in Action

### 1. Analysis Dashboard & Editor
Upon loading, the editor labels leader statements with `B# · leader` tags, displays parsing statistics, and presents a 4-step guided walkthrough:

![Analysis Dashboard](C:/Users/sutha/.gemini/antigravity-ide/brain/dd4950b3-8a11-4a31-82cf-79cfdd43d40e/initial_loaded_page_1792908573685.png)

### 2. Interactive Control Flow Graph & Reachability
The generated CFG renders block nodes with their TAC statements, labeled control-flow edges (`true`, `false`, `jump`, `next`), pan/zoom controls, and a BFS reachability inspector:

![Generated CFG Canvas](C:/Users/sutha/.gemini/antigravity-ide/brain/dd4950b3-8a11-4a31-82cf-79cfdd43d40e/generated_cfg_canvas_1792908605050.png)

### 3. Dominator Analysis & Basic Block Partitioning
Detailed table showing dominator sets for each block starting from entry `B1`, along with isolated block cards:

![Dominators and Block Partition](C:/Users/sutha/.gemini/antigravity-ide/brain/dd4950b3-8a11-4a31-82cf-79cfdd43d40e/if_else_generated_cfg_1792908790001.png)

---

## 📂 Codebase Breakdown

```
basic-block-visualizer/
├── package.json               # Root scripts (install:all, dev, build, start, test)
├── README.md                  # Project documentation & run guide
├── server/
│   ├── package.json           # Express, CORS dependencies
│   ├── index.js               # Express API endpoints (/api/health, /api/examples, /api/analyze)
│   ├── engine.js              # Compiler engine: TAC parser, leaders, CFG, dominators, complexity
│   ├── examples.js            # Preset TAC programs (Sequential, Conditional branch, If/else, etc.)
│   └── engine.test.js         # Comprehensive unit tests for compiler algorithms
└── client/
    ├── package.json           # React 18, Vite dependencies
    ├── vite.config.js         # Vite dev server configuration with proxy to port 5050
    ├── index.html             # HTML entry point with IBM Plex typography
    └── src/
        ├── main.jsx           # React DOM root entry
        ├── App.jsx            # Top-level state, auto-analysis, toast notifications, header/footer
        ├── utils.js           # Line helpers, blob export downloads, statement type tooltips
        ├── styles.css         # Custom responsive stylesheet (IBM Plex, animations, grid layouts)
        └── components/
            ├── Editor.jsx     # Numbered TAC editor, leader indicators, example selector
            ├── Graph.jsx      # SVG CFG renderer with draggable nodes, edge routing & SVG export
            ├── Results.jsx    # Stats cards, step-by-step wizard, dominator table, block cards
            ├── Tooltip.jsx    # Floating context tooltips for instructions & rules
            └── icons.jsx      # SVG vector icons
```

---

## ⚙️ How the Compiler Engine Works ([server/engine.js](file:///d:/CD_project/basic-block-visualizer/basic-block-visualizer/server/engine.js))

1. **TAC Parsing & Classification**:
   - Classifies instructions into: `assignment`, `conditional-jump` (`if ... goto ...`), `unconditional-jump` (`goto ...`), `label` (`L1:`), `print`, and `return`.
   - Resolves target destinations (both numerical line targets and symbolic labels).
2. **Leader Identification** (Classic 3-Rule Compiler Algorithm):
   - **Rule 1:** The first statement of the program is a leader.
   - **Rule 2:** Any target of a conditional or unconditional jump is a leader.
   - **Rule 3:** Any statement immediately following a conditional/unconditional jump or return is a leader.
3. **Basic Block Partitioning**:
   - Each basic block starts at a leader and includes all statements up to (but not including) the next leader or the end of the code.
4. **CFG Generation**:
   - Determines directed edges between blocks:
     - Conditional jumps branch into `true` (target block) and `false` (fallthrough next block).
     - Unconditional jumps create a `jump` edge to the target block.
     - Fall-through non-jump statements create a `next` edge.
5. **Graph Metrics & Relationships**:
   - **Reachability:** BFS from entry block `B1` to identify unreachable/dead code.
   - **Cyclomatic Complexity:** Computes $M = E - N + 2P$.
   - **Dominator Tree:** Computes blocks $D(n)$ that must be traversed on every path from entry to $n$.
