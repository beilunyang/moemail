import React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface CheckboxProps {
  id?: string
  checked?: boolean
  onChange?: (checked: boolean) => void
  className?: string
  disabled?: boolean
}

export const Checkbox: React.FC<CheckboxProps> = ({
  id,
  checked = false,
  onChange,
  className,
  disabled = false
}) => {
  const handleChange = () => {
    if (!disabled && onChange) {
      onChange(!checked)
    }
  }

  return (
    <div 
      className={cn(
        "relative inline-flex items-center justify-center w-5 h-5 rounded border-2 cursor-pointer transition-all duration-200",
        checked 
          ? "bg-primary border-primary text-primary-foreground" 
          : "bg-background border-input hover:border-primary/50",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={handleChange}
    >
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={() => {}} // Controlled by div onClick
        className="sr-only"
        disabled={disabled}
      />
      {checked && (
        <Check 
          className="w-3 h-3 text-current animate-in fade-in-0 scale-in-95 duration-200" 
        />
      )}
    </div>
  )
} 