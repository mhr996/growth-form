"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";

interface DropdownOption {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  required?: boolean;
}

export function CustomDropdown({
  options,
  value,
  onChange,
  placeholder = "اختر...",
  disabled = false,
  error = false,
  required = false,
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger Button */}
      <motion.button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        whileHover={!disabled ? { scale: 1.005 } : {}}
        whileTap={!disabled ? { scale: 0.995 } : {}}
        className={`
          w-full px-5 py-4 rounded-xl border-2 bg-white
          transition-all duration-300 text-base text-right
          flex items-center justify-between gap-3
          leading-normal
          ${
            error
              ? "border-red-400 animate-[shake_0.3s_ease-in-out]"
              : "border-gray-200"
          }
          ${
            isOpen
              ? "border-[#2A3984] ring-4 ring-[#2A3984]/10"
              : "hover:border-gray-300"
          }
          ${disabled ? "bg-gray-50 cursor-not-allowed opacity-60" : ""}
        `}
      >
        <span
          className={`leading-normal ${
            selectedOption ? "text-gray-900" : "text-gray-400"
          }`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </motion.div>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute z-50 w-full mt-2 bg-white rounded-xl border-2 border-gray-200 shadow-2xl overflow-hidden"
          >
            <div className="max-h-64 overflow-y-auto custom-scrollbar">
              {options.map((option, index) => {
                const isSelected = value === option.value;
                return (
                  <motion.button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className={`
                      w-full px-5 py-3.5 text-right transition-all duration-200
                      flex items-center justify-between gap-3
                      ${
                        isSelected
                          ? "bg-gradient-to-r from-[#2A3984]/10 to-[#2A3984]/5 text-[#2A3984] font-semibold"
                          : "text-gray-700 hover:bg-gray-50"
                      }
                    `}
                  >
                    <span>{option.label}</span>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 25,
                        }}
                      >
                        <Check className="w-5 h-5 text-[#2A3984]" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
