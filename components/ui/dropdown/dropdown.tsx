"use client";

import { Glass } from "@/components/ui/glass";
import { cn } from "@/lib/utils/cn";
import { AnimatePresence, motion } from "motion/react";
import type { KeyboardEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

export interface DropdownItem {
  id: string;
  label: string;
  value: string;
  icon?: ReactNode;
  disabled?: boolean;
}

interface DropdownProps {
  /**
   * Dropdown items
   */
  items: DropdownItem[];

  /**
   * Selected item value
   */
  value?: string;

  /**
   * Callback when item is selected
   */
  onSelect: (value: string) => void;

  /**
   * Placeholder text
   */
  placeholder?: string;

  /**
   * Enable search filter
   * @default false
   */
  searchable?: boolean;

  /**
   * Search placeholder
   */
  searchPlaceholder?: string;

  /**
   * Disabled state
   */
  disabled?: boolean;

  /**
   * Additional classes
   */
  className?: string;

  /**
   * Label
   */
  label?: string;
}

/**
 * Dropdown component with keyboard navigation and search filter
 */
export function Dropdown({
  items,
  value,
  onSelect,
  placeholder = "Select an option",
  searchable = false,
  searchPlaceholder = "Search...",
  disabled = false,
  className = "",
  label,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedItem = items.find((item) => item.value === value);

  // Filter items based on search query
  const filteredItems = searchable
    ? items.filter((item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : items;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Reset focused index when filtered items change
  useEffect(() => {
    setFocusedIndex(0);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isOpen) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setFocusedIndex((prev) =>
          prev < filteredItems.length - 1 ? prev + 1 : prev
        );
        break;

      case "ArrowUp":
        event.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;

      case "Enter":
        event.preventDefault();
        if (
          filteredItems[focusedIndex] &&
          !filteredItems[focusedIndex].disabled
        ) {
          handleSelect(filteredItems[focusedIndex].value);
        }
        break;

      case "Escape":
        event.preventDefault();
        setIsOpen(false);
        setSearchQuery("");
        break;

      case "Home":
        event.preventDefault();
        setFocusedIndex(0);
        break;

      case "End":
        event.preventDefault();
        setFocusedIndex(filteredItems.length - 1);
        break;

      default:
        break;
    }
  };

  const handleSelect = (selectedValue: string) => {
    onSelect(selectedValue);
    setIsOpen(false);
    setSearchQuery("");
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className={cn("relative w-full", className)} ref={dropdownRef}>
      {label && (
        <span className="block text-sm font-medium mb-2 text-slate-200">
          {label}
        </span>
      )}

      {/* Trigger button */}
      <button
        type="button"
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={cn(
          "w-full flex items-center justify-between",
          "px-4 py-2 rounded-lg",
          "bg-slate-900/50 border border-slate-700/50",
          "text-slate-200",
          "transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          isOpen && "ring-2 ring-primary border-transparent"
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={label || "Dropdown"}
      >
        <span className="flex items-center gap-2">
          {selectedItem?.icon && <span>{selectedItem.icon}</span>}
          <span>{selectedItem?.label || placeholder}</span>
        </span>

        <motion.svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          role="img"
          aria-label="Toggle"
        >
          <path
            d="M5 7.5L10 12.5L15 7.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      </button>

      {/* Dropdown menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2"
          >
            <Glass variant="strong" border="medium" className="p-2">
              {/* Search input */}
              {searchable && (
                <div className="mb-2">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    className={cn(
                      "w-full px-3 py-2 rounded-lg",
                      "bg-slate-900/50 border border-slate-700/50",
                      "text-slate-200 placeholder:text-slate-500",
                      "text-sm",
                      "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    )}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}

              {/* Items list */}
              <div
                role="listbox"
                className="max-h-60 overflow-y-auto scrollbar-thin"
                tabIndex={-1}
              >
                {filteredItems.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-slate-400 text-center">
                    No results found
                  </div>
                ) : (
                  filteredItems.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => !item.disabled && handleSelect(item.value)}
                      disabled={item.disabled}
                      className={cn(
                        "w-full flex items-center gap-2",
                        "px-3 py-2 rounded-lg",
                        "text-sm text-left",
                        "transition-all duration-150",
                        "focus:outline-none",
                        item.disabled
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer hover:bg-muted",
                        value === item.value &&
                          "bg-primary/10 text-primary font-medium",
                        focusedIndex === index && !item.disabled && "bg-muted"
                      )}
                      role="option"
                      aria-selected={value === item.value}
                      aria-disabled={item.disabled}
                    >
                      {item.icon && <span>{item.icon}</span>}
                      <span className="flex-1">{item.label}</span>
                      {value === item.value && (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          role="img"
                          aria-label="Selected"
                        >
                          <path
                            d="M13.333 4L6 11.333L2.667 8"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </button>
                  ))
                )}
              </div>
            </Glass>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export type { DropdownProps };
