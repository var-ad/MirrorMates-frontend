"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  className,
  paper = false,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  paper?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-xl)] p-6 md:p-8",
        paper ? "paper-card" : "texture-card",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function SectionHeading({
  kicker,
  title,
  description,
  align = "left",
}: {
  kicker?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={cn("space-y-3", align === "center" && "text-center")}>
      {kicker ? <span className="section-kicker">{kicker}</span> : null}
      <h2
        className={cn(
          "font-[var(--font-display)] text-4xl leading-[0.95] tracking-[-0.04em] text-balance md:text-5xl",
          align === "center" && "mx-auto max-w-3xl",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "max-w-2xl text-lg leading-8 text-[var(--text-muted)]",
            align === "center" && "mx-auto",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function Button({
  className,
  tone = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "primary" | "ghost" | "secondary" | "danger";
}) {
  return (
    <button
      className={cn(
        "inline-flex min-h-12 items-center justify-center rounded-full px-5 py-3 text-sm font-bold tracking-[0.02em] transition duration-200 disabled:cursor-not-allowed disabled:opacity-45",
        tone === "primary" &&
          "bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] text-white shadow-[0_18px_40px_rgba(255,106,0,0.28)] hover:-translate-y-0.5",
        tone === "secondary" &&
          "border border-[var(--line-strong)] bg-[rgba(199,255,125,0.12)] text-[var(--text)] hover:border-[var(--signal)]",
        tone === "ghost" &&
          "border border-[var(--line)] bg-white/4 text-[var(--text)] hover:border-[var(--line-strong)] hover:bg-white/7",
        tone === "danger" &&
          "border border-[rgba(255,141,136,0.4)] bg-[rgba(255,141,136,0.16)] text-[var(--danger)] hover:bg-[rgba(255,141,136,0.22)]",
        className,
      )}
      {...props}
    />
  );
}

export const TextInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function TextInput({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "min-h-12 w-full rounded-[var(--radius-sm)] border border-[var(--line)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-[var(--text)] outline-none transition placeholder:text-[var(--text-subtle)] focus:border-[var(--accent)] focus:bg-[rgba(255,255,255,0.06)]",
        className,
      )}
      {...props}
    />
  );
});

export const SelectInput = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function SelectInput({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        "min-h-12 w-full rounded-[var(--radius-sm)] border border-[var(--line)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-[var(--text)] outline-none transition focus:border-[var(--accent)]",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});

export function Label({
  htmlFor,
  children,
  hint,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="block space-y-2">
      <span className="block text-sm font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
        {children}
      </span>
      {hint ? (
        <span className="block text-sm text-[var(--text-subtle)]">{hint}</span>
      ) : null}
    </label>
  );
}

export function Notice({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "success" | "warning" | "danger";
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] border px-4 py-3 text-sm leading-7",
        tone === "neutral" &&
          "border-[var(--line)] bg-white/4 text-[var(--text-muted)]",
        tone === "success" &&
          "border-[rgba(199,255,125,0.28)] bg-[rgba(199,255,125,0.09)] text-[var(--signal)]",
        tone === "warning" &&
          "border-[rgba(255,143,63,0.28)] bg-[rgba(255,143,63,0.09)] text-[#ffd3ab]",
        tone === "danger" &&
          "border-[rgba(255,141,136,0.28)] bg-[rgba(255,141,136,0.09)] text-[var(--danger)]",
      )}
    >
      {children}
    </div>
  );
}

export function Metric({
  label,
  value,
  accent = "default",
}: {
  label: string;
  value: React.ReactNode;
  accent?: "default" | "signal" | "accent";
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] border px-4 py-4",
        accent === "default" &&
          "border-[var(--line)] bg-[rgba(255,255,255,0.03)]",
        accent === "signal" &&
          "border-[rgba(199,255,125,0.28)] bg-[rgba(199,255,125,0.08)]",
        accent === "accent" &&
          "border-[rgba(255,143,63,0.28)] bg-[rgba(255,143,63,0.09)]",
      )}
    >
      <div className="text-xs uppercase tracking-[0.18em] text-[var(--text-subtle)]">
        {label}
      </div>
      <div className="mt-2 font-[var(--font-display)] text-3xl tracking-[-0.04em]">
        {value}
      </div>
    </div>
  );
}
