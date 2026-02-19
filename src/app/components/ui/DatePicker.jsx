"use client";
import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { Controller } from "react-hook-form";
import { createPortal } from "react-dom";
import { MdCalendarToday, MdChevronLeft, MdChevronRight, MdClose, MdArrowDropDown } from "react-icons/md";

/* ─── helpers ─────────────────────────────────────────────────────────── */
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

const parseValue = (v) => {
  if (!v) return null;
  const [y, m, d] = v.split("-").map(Number);
  if (!y || !m || !d) return null;
  return { year: y, month: m - 1, day: d };
};

const toValueString = ({ year, month, day }) =>
  `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const toDisplayString = ({ year, month, day }) =>
  `${MONTHS[month]} ${day}, ${year}`;

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstWeekday = (year, month) => new Date(year, month, 1).getDay();

const isSameDay = (a, b) =>
  a && b && a.year === b.year && a.month === b.month && a.day === b.day;

const today = (() => {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
})();

/* ─── Year range helper ─────────────────────────────────────────────── */
const getDecadeStart = (year) => Math.floor(year / 12) * 12;

/* ─── Calendar Popup ──────────────────────────────────────────────────── */
const CalendarPopup = ({ selected, onSelect, buttonRef, onClose }) => {
  const popupRef = useRef(null);
  // views: "day" | "month" | "year"
  const [view, setView] = useState("day");
  const [viewYear, setViewYear] = useState(selected?.year ?? today.year);
  const [viewMonth, setViewMonth] = useState(selected?.month ?? today.month);

  /* ── Continuous position tracking ── */
  const [style, setStyle] = useState({});
  useLayoutEffect(() => {
    if (!buttonRef) return;
    let rafId;
    const update = () => {
      const rect = buttonRef.getBoundingClientRect();
      const popupH = 320;
      const popupW = 288;
      const spaceBelow = window.innerHeight - rect.bottom;
      const top = spaceBelow >= popupH ? rect.bottom + 4 : rect.top - popupH - 4;
      const left = Math.min(rect.left, window.innerWidth - popupW - 8);
      setStyle({ top, left, width: Math.max(rect.width, popupW) });
      rafId = requestAnimationFrame(update);
    };
    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, [buttonRef]);

  /* ── Close on outside click ── */
  useEffect(() => {
    const handler = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  /* ── Header label & cycle ── */
  const headerLabel = view === "day"
    ? `${MONTHS[viewMonth]} ${viewYear}`
    : view === "month"
      ? `${viewYear}`
      : `${getDecadeStart(viewYear)} – ${getDecadeStart(viewYear) + 11}`;

  const cycleView = () =>
    setView((v) => v === "day" ? "month" : v === "month" ? "year" : "day");

  /* ── Prev / Next ── */
  const prev = () => {
    if (view === "day") {
      if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
      else setViewMonth(m => m - 1);
    } else if (view === "month") {
      setViewYear(y => y - 1);
    } else {
      setViewYear(y => y - 12);
    }
  };
  const next = () => {
    if (view === "day") {
      if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
      else setViewMonth(m => m + 1);
    } else if (view === "month") {
      setViewYear(y => y + 1);
    } else {
      setViewYear(y => y + 12);
    }
  };

  /* ── Day grid ── */
  const renderDays = () => {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstWeekday = getFirstWeekday(viewYear, viewMonth);
    const cells = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    return (
      <>
        {/* Day-of-week labels */}
        <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
          {DAYS.map((d) => (
            <div key={d} className="py-1 text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
              {d}
            </div>
          ))}
        </div>
        {/* Day cells */}
        <div className="grid grid-cols-7 gap-px p-2">
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} />;
            const thisDay = { year: viewYear, month: viewMonth, day };
            const isSel = isSameDay(selected, thisDay);
            const isTod = isSameDay(today, thisDay);
            return (
              <button
                key={day}
                type="button"
                onClick={() => { onSelect(thisDay); onClose(); }}
                className={`
                  w-full aspect-square rounded-lg text-[13px] font-medium transition-all duration-75
                  flex items-center justify-center
                  ${isSel
                    ? "bg-blue-600 text-white font-bold"
                    : isTod
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }
                `}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Today shortcut */}
        <div className="px-2 pb-2 border-t border-slate-100 dark:border-slate-700 pt-1.5">
          <button
            type="button"
            onClick={() => {
              setViewYear(today.year);
              setViewMonth(today.month);
              setView("day");
              onSelect(today);
              onClose();
            }}
            className="w-full py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
          >
            Today
          </button>
        </div>
      </>
    );
  };

  /* ── Month grid ── */
  const renderMonths = () => (
    <div className="grid grid-cols-3 gap-2 p-3">
      {MONTHS_SHORT.map((m, i) => {
        const isSel = selected?.year === viewYear && selected?.month === i;
        const isCur = today.year === viewYear && today.month === i;
        return (
          <button
            key={m}
            type="button"
            onClick={() => { setViewMonth(i); setView("day"); }}
            className={`
              py-2 rounded-lg text-sm font-medium transition-all
              ${isSel
                ? "bg-blue-600 text-white font-bold"
                : isCur
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              }
            `}
          >
            {m}
          </button>
        );
      })}
    </div>
  );

  /* ── Year grid ── */
  const renderYears = () => {
    const start = getDecadeStart(viewYear);
    const years = Array.from({ length: 12 }, (_, i) => start + i);
    return (
      <div className="grid grid-cols-3 gap-2 p-3">
        {years.map((y) => {
          const isSel = selected?.year === y;
          const isCur = today.year === y;
          return (
            <button
              key={y}
              type="button"
              onClick={() => { setViewYear(y); setView("month"); }}
              className={`
                py-2 rounded-lg text-sm font-medium transition-all
                ${isSel
                  ? "bg-blue-600 text-white font-bold"
                  : isCur
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                }
              `}
            >
              {y}
            </button>
          );
        })}
      </div>
    );
  };

  if (typeof window === "undefined") return null;

  return createPortal(
    <div
      ref={popupRef}
      style={{ position: "fixed", zIndex: 9999, ...style }}
      className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden select-none"
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-3 py-2 bg-blue-600 text-white">
        <button type="button" onClick={prev} className="p-1 rounded hover:bg-white/20 transition-colors">
          <MdChevronLeft size={18} />
        </button>

        {/* Clickable label cycles through views */}
        <button
          type="button"
          onClick={cycleView}
          className="flex items-center gap-0.5 text-sm font-semibold hover:bg-white/20 rounded px-2 py-0.5 transition-colors"
        >
          {headerLabel}
          <MdArrowDropDown
            size={18}
            className={`transition-transform duration-200 ${view !== "day" ? "rotate-180" : ""}`}
          />
        </button>

        <button type="button" onClick={next} className="p-1 rounded hover:bg-white/20 transition-colors">
          <MdChevronRight size={18} />
        </button>
      </div>

      {/* ── View content ── */}
      {view === "day" && renderDays()}
      {view === "month" && renderMonths()}
      {view === "year" && renderYears()}
    </div>,
    document.body
  );
};

/* ─── DateInput ─────────────────────────────────────────────────────────── */
const DateInput = ({
  value,
  onChange,
  label,
  placeholder = "Select date",
  error,
  size = "normal",
  disabled = false,
  fullWidth = false,
  className = "",
}) => {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);
  const selected = parseValue(value);
  const isSmall = size === "small";

  const openCalendar = () => { if (!disabled) setOpen(true); };

  const handleSelect = useCallback((dateObj) => {
    if (onChange) onChange(toValueString(dateObj));
  }, [onChange]);

  const clear = (e) => {
    e.stopPropagation();
    if (onChange) onChange("");
  };

  return (
    <div className={`${fullWidth ? "w-full" : "inline-block"} ${className}`}>
      <div
        className={`
          relative flex items-center
          border border-slate-400/30
          bg-white dark:bg-[#27354A]
          rounded-[4px]
          transition-colors duration-150
          ${error
            ? "border-red-500"
            : open
              ? "border-blue-500!"
              : "hover:border-slate-400/60 dark:hover:border-slate-400/60"
          }
          ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
          ${isSmall ? "h-10" : "h-14"}
        `}
        onClick={openCalendar}
        ref={buttonRef}
      >
        {/* Floating label */}
        {label && (
          <label
            className={`
              absolute left-3 pointer-events-none select-none transition-all duration-150
              ${selected || open
                ? `text-[11px] -top-[9px] px-0.5 bg-white dark:bg-slate-800 leading-none
                   ${open ? "text-blue-500" : error ? "text-red-500" : "text-slate-500 dark:text-slate-400"}`
                : "text-sm top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400"
              }
            `}
          >
            {label}
          </label>
        )}

        {/* Value / placeholder */}
        <span
          className={`
            flex-1 pl-3 pr-2 truncate text-sm
            ${selected ? "text-slate-900 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"}
          `}
        >
          {selected ? toDisplayString(selected) : (label ? "" : placeholder)}
        </span>

        {/* Right icon: clear × when selected, calendar otherwise */}
        {selected && !disabled ? (
          <button type="button" onClick={clear} className="pr-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0">
            <MdClose size={15} />
          </button>
        ) : (
          <span className="pr-2.5 text-slate-400 dark:text-slate-500 shrink-0 pointer-events-none">
            <MdCalendarToday size={isSmall ? 14 : 16} />
          </span>
        )}
      </div>

      {error && <p className="mt-1 mx-3 text-xs text-red-500">{error}</p>}

      {open && (
        <CalendarPopup
          selected={selected}
          onSelect={handleSelect}
          buttonRef={buttonRef.current}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
};

/* ─── RHF wrapper ──────────────────────────────────────────────────────── */
export const RHFDatePicker = ({
  control, name, label, placeholder, fullWidth, size, disabled, className, error,
}) => (
  <Controller
    name={name}
    control={control}
    defaultValue=""
    render={({ field, fieldState }) => (
      <DateInput
        value={field.value ?? ""}
        onChange={field.onChange}
        label={label}
        placeholder={placeholder}
        error={error || fieldState.error?.message}
        size={size}
        disabled={disabled}
        fullWidth={fullWidth}
        className={className}
      />
    )}
  />
);

export default DateInput;
