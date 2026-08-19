import { InputHTMLAttributes, forwardRef, useId } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", id: idProp, ...props }, ref) => {
    const autoId = useId();
    const id = idProp ?? autoId;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={id}
            className="text-xs font-medium uppercase tracking-wider text-slate-500"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={[
            "h-9 w-full rounded-md border px-3 text-sm",
            "bg-slate-800 text-slate-100 placeholder-slate-500",
            "transition-colors duration-150",
            error
              ? "border-red-500 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
              : "border-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className,
          ].join(" ")}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-400" role="alert">
            {error}
          </p>
        )}
        {!error && hint && (
          <p className="text-xs text-slate-500">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
