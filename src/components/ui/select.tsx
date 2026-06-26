import React, { useEffect, useRef, useState } from "react";

export type SelectOption = { value: string; label: string };

type Props = {
  value: string;
  onChange: (val: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export default function Select({ value, onChange, options, placeholder = "Selecione…", className = "", disabled = false }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`w-full text-left px-3 py-2 rounded-lg border border-white/15 bg-[#0B1220] text-white text-sm hover:bg-white/10 disabled:opacity-60`}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <span className="float-right opacity-70">▾</span>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-white/15 bg-[#0E1525] shadow-lg max-h-56 overflow-auto">
          {options.length === 0 && (
            <div className="px-3 py-2 text-sm text-white/70">Nenhuma opção</div>
          )}
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`block w-full text-left px-3 py-2 text-sm ${active ? "bg-white/10 text-white" : "text-white/90 hover:bg-white/5"}`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}