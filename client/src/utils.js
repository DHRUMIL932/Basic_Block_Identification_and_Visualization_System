export const rng = b => `L${b.startLine}–L${b.endLine}`;
export function download(name, data, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([data], { type }));
  a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 500);
}
export const TYPE_TIP = {
  'assignment': 'Assignment\nComputes a value and stores it in a variable.\nNever ends a block by itself.',
  'conditional-jump': 'Conditional jump\nBranches: true → jump target, false → next statement.\nAlways ends a basic block.',
  'unconditional-jump': 'Unconditional jump\nAlways transfers control to the target.\nEnds a block and has no fall-through edge.',
  'label': 'Label\nA symbolic name for a statement so jumps can refer to it.',
  'print': 'Print\nOutputs a value. Does not change control flow.',
  'return': 'Return\nLeaves the program. The block has no outgoing edge.',
};
