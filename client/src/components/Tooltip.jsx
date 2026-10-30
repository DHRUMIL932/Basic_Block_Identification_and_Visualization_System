import { useEffect, useRef, useState } from 'react';
// One global tooltip: any element (HTML or SVG) with a data-tip attribute shows its text on hover.
export default function Tooltip() {
  const [text, setText] = useState(null); const ref = useRef(null);
  useEffect(() => {
    const move = e => {
      const el = e.target.closest && e.target.closest('[data-tip]');
      setText(el ? el.getAttribute('data-tip') : null);
      if (ref.current) {
        const w = ref.current.offsetWidth || 260, x = Math.min(e.clientX + 16, innerWidth - w - 12);
        ref.current.style.transform = `translate(${Math.max(8, x)}px,${e.clientY + 18}px)`;
      }
    };
    const leave = () => setText(null);
    document.addEventListener('mousemove', move); document.addEventListener('mouseleave', leave);
    return () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseleave', leave); };
  }, []);
  return <div ref={ref} className={'tip' + (text ? ' on' : '')} role="tooltip">{text}</div>;
}
