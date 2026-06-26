import React from "react";

type SwitchProps = {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  ariaLabel?: string;
};

export function Switch({
  checked = false,
  onCheckedChange,
  disabled = false,
  className = "",
  id,
  ariaLabel,
}: SwitchProps) {
  const base =
    "relative inline-flex h-6 w-12 items-center !rounded-full border border-white/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-500";
  const onClass = "bg-teal-600";
  const offClass = "bg-gray-300 dark:bg-gray-700";
  const disabledClass = "opacity-50 cursor-not-allowed";

  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => {
        if (!disabled) {
          onCheckedChange?.(!checked);
        }
      }}
      className={`${base} ${checked ? onClass : offClass} ${disabled ? disabledClass : ""} ${className}`}
    >
      <span className="sr-only">Toggle</span>
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default Switch;