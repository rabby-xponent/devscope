'use client';

import React, {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@/components/icons';

/**
 * DevScope UI primitives.
 *
 * A small, dependency-free component kit that replaces native controls
 * (`<select>`, `<input type="checkbox">`) with consistent, accessible,
 * theme-aware implementations. Every primitive is styled exclusively with
 * semantic tokens (`card`, `well`, `edge`, `muted`, `content`, `signal`)
 * so light and dark mode stay perfectly in sync.
 */

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

/* ==========================================================================
   Select — custom dropdown (portal, keyboard nav, type-ahead)
   ========================================================================== */

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  align?: 'left' | 'right';
  ariaLabel?: string;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  disabled = false,
  className = '',
  buttonClassName = '',
  menuClassName = '',
  align = 'left',
  ariaLabel,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const listId = useId();

  useEffect(() => setMounted(true), []);

  const selected = options.find((o) => o.value === value);

  const position = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setCoords({ top: r.bottom + 6, left: r.left, width: r.width });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    position();
    const onScroll = () => position();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open, position]);

  // Close on outside pointerdown
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (
        !triggerRef.current?.contains(t) &&
        !listRef.current?.contains(t)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (!open || highlight < 0) return;
    const node = listRef.current?.querySelector<HTMLElement>(`[data-index="${highlight}"]`);
    node?.scrollIntoView({ block: 'nearest' });
  }, [highlight, open]);

  const openMenu = () => {
    if (disabled) return;
    const idx = options.findIndex((o) => o.value === value);
    setHighlight(idx >= 0 ? idx : 0);
    setOpen(true);
  };

  const commit = (idx: number) => {
    const opt = options[idx];
    if (!opt) return;
    onChange(opt.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    switch (e.key) {
      case 'Enter':
      case ' ':
      case 'ArrowDown':
        e.preventDefault();
        if (!open) openMenu();
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!open) {
          const idx = options.findIndex((o) => o.value === value);
          setHighlight(idx >= 0 ? idx : options.length - 1);
          setOpen(true);
        }
        break;
      case 'Escape':
        if (open) {
          e.preventDefault();
          setOpen(false);
        }
        break;
    }
  };

  const onListKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlight((h) => Math.min(options.length - 1, h + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlight((h) => Math.max(0, h - 1));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (highlight >= 0) commit(highlight);
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        break;
      case 'Tab':
        setOpen(false);
        break;
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onTriggerKeyDown}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border bg-card px-2.5 py-1.5 font-mono text-xs text-content shadow-xs outline-none transition-colors
          hover:border-signal/50 focus-visible:border-signal focus-visible:ring-2 focus-visible:ring-signal/20
          disabled:cursor-not-allowed disabled:opacity-50
          ${open ? 'border-signal ring-2 ring-signal/20' : 'border-edge'}
          ${buttonClassName}`}
      >
        <span className={`min-w-0 truncate ${selected ? '' : 'text-muted'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <Icon.ChevronDown
          className={`h-3.5 w-3.5 flex-none text-muted transition-transform duration-150 ${open ? 'rotate-180 text-signal' : ''}`}
        />
      </button>

      {open && mounted && coords
        ? createPortal(
            <div
              ref={listRef}
              id={listId}
              role="listbox"
              tabIndex={-1}
              onKeyDown={onListKeyDown}
              style={{
                position: 'fixed',
                top: coords.top,
                left: align === 'left' ? coords.left : undefined,
                right: align === 'right' ? window.innerWidth - coords.left - coords.width : undefined,
                minWidth: coords.width,
              }}
              className={`z-[70] max-h-72 overflow-y-auto rounded-xl border border-edge bg-card p-1 shadow-pop thin-scroll animate-in ${menuClassName}`}
            >
              {options.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isHighlighted = idx === highlight;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    data-index={idx}
                    onMouseEnter={() => setHighlight(idx)}
                    onClick={() => commit(idx)}
                    className={`flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 text-left font-mono text-xs transition-colors
                      ${isSelected ? 'text-signal font-semibold' : isHighlighted ? 'bg-well text-content' : 'text-content'}
                      ${opt.description ? 'items-start' : ''}`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate">{opt.label}</span>
                      {opt.description && (
                        <span className="mt-0.5 block truncate font-sans text-[10px] text-muted">
                          {opt.description}
                        </span>
                      )}
                    </span>
                    {isSelected && <Icon.Check className="h-3.5 w-3.5 flex-none text-signal" />}
                  </button>
                );
              })}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

/* ==========================================================================
   Checkbox — premium square check with motion
   ========================================================================== */

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

export function Checkbox({ checked, onChange, disabled = false, className = '', ariaLabel }: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`flex h-[17px] w-[17px] flex-none items-center justify-center rounded-[5px] border transition-all duration-150 outline-none
        focus-visible:ring-2 focus-visible:ring-signal/40 focus-visible:ring-offset-1 focus-visible:ring-offset-card
        disabled:cursor-not-allowed disabled:opacity-40
        ${
          checked
            ? 'border-signal bg-signal text-[#0c0b0e]'
            : 'border-edge bg-card hover:border-signal/60'
        } ${className}`}
    >
      <Icon.Check
        className={`h-3 w-3 transition-all duration-150 ${checked ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}
        strokeWidth={2.5}
      />
    </button>
  );
}

/* ==========================================================================
   Switch — settings toggle
   ========================================================================== */

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

export function Switch({ checked, onChange, disabled = false, ariaLabel, className = '' }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-[20px] w-[36px] flex-none items-center rounded-full border transition-colors duration-200 outline-none
        focus-visible:ring-2 focus-visible:ring-signal/40 focus-visible:ring-offset-1 focus-visible:ring-offset-card
        disabled:cursor-not-allowed disabled:opacity-40
        ${checked ? 'border-signal bg-signal' : 'border-edge bg-well'} ${className}`}
    >
      <span
        className={`inline-block h-[14px] w-[14px] transform rounded-full bg-card shadow-sm transition-transform duration-200
          ${checked ? 'translate-x-[19px] bg-[#0c0b0e]' : 'translate-x-[2px] bg-muted'}`}
      />
    </button>
  );
}

/* ==========================================================================
   StarRating — precise SVG star rating input
   ========================================================================== */

export function StarRating({
  value,
  onChange,
  size = 'sm',
  className = '',
}: {
  value: number;
  onChange?: (rating: number) => void;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const [hover, setHover] = useState(0);
  const interactive = !!onChange;
  const display = hover || value;
  const px = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <div
      className={`inline-flex items-center gap-0.5 ${className}`}
      onMouseLeave={() => interactive && setHover(0)}
      role={interactive ? 'radiogroup' : undefined}
      aria-label={interactive ? 'Rating' : undefined}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = display >= star;
        const IconCmp = filled ? Icon.Star : Icon.StarOutline;
        const starBtn = (
          <IconCmp
            className={`${px} transition-colors duration-100 ${
              filled ? 'text-signal' : 'text-muted/40'
            }`}
          />
        );
        if (!interactive) return <span key={star}>{starBtn}</span>;
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
            onClick={() => onChange(value === star ? 0 : star)}
            onMouseEnter={() => setHover(star)}
            className="rounded-sm p-px outline-none transition-transform duration-100 hover:scale-110 focus-visible:ring-2 focus-visible:ring-signal/40"
          >
            {starBtn}
          </button>
        );
      })}
    </div>
  );
}

/* ==========================================================================
   SearchInput — bordered search field with icon + clear affordance
   ========================================================================== */

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  className = '',
  inputClassName = '',
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  ariaLabel?: string;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-lg border border-edge bg-card px-2.5 shadow-xs transition-colors focus-within:border-signal/70 focus-within:ring-2 focus-within:ring-signal/15 ${className}`}
    >
      <Icon.Search className="h-3.5 w-3.5 flex-none text-muted" />
      <input
        type="text"
        value={value}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-transparent py-1.5 font-mono text-xs text-content outline-none placeholder:text-muted/60 ${inputClassName}`}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="flex-none rounded p-0.5 text-muted transition-colors hover:text-signal"
        >
          <Icon.X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

/* ==========================================================================
   SegmentedTabs — filter pill row (active uses solid brand accent)
   ========================================================================== */

export function SegmentedTabs({
  tabs,
  active,
  onChange,
  className = '',
}: {
  tabs: { value: string; label: string; count?: number }[];
  active: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-1.5 font-mono text-xs ${className}`}>
      {tabs.map((tab) => {
        const isActive = active === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            aria-pressed={isActive}
            className={`rounded-lg px-2.5 py-1 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-signal/40 ${
              isActive
                ? 'bg-signal font-bold text-[#0c0b0e] shadow-xs'
                : 'bg-well text-muted hover:text-content'
            }`}
          >
            {tab.label}
            {typeof tab.count === 'number' && ` (${tab.count})`}
          </button>
        );
      })}
    </div>
  );
}
