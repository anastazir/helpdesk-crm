import { ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export interface MultiSelectOption {
  value: string
  label: string
}

interface MultiSelectFilterProps {
  label: string
  placeholder: string
  options: MultiSelectOption[]
  selected: string[]
  onChange: (values: string[]) => void
}

const MultiSelectFilter = ({
  label,
  placeholder,
  options,
  selected,
  onChange,
}: MultiSelectFilterProps) => {
  const { t } = useTranslation()

  const selectedLabels = options
    .filter((option) => selected.includes(option.value))
    .map((option) => option.label)

  const triggerLabel =
    selected.length === 0
      ? placeholder
      : selected.length === 1
        ? selectedLabels[0]
        : t('common.selectedCount', { count: selected.length })

  const toggle = (value: string, checked: boolean) => {
    onChange(
      checked
        ? [...selected, value]
        : selected.filter((item) => item !== value),
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between font-normal"
          aria-label={label}
        >
          <span className="truncate">{triggerLabel}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-2"
      >
        {options.length === 0 ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">
            {t('common.noResults')}
          </p>
        ) : (
          <>
            <div className="max-h-60 space-y-1 overflow-y-auto">
              {options.map((option) => {
                const checked = selected.includes(option.value)
                return (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) => toggle(option.value, value === true)}
                    />
                    <span className="truncate">{option.label}</span>
                  </label>
                )
              })}
            </div>
            {selected.length > 0 && (
              <div className="mt-2 border-t border-border pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => onChange([])}
                >
                  {t('common.clear')}
                </Button>
              </div>
            )}
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}

export default MultiSelectFilter
