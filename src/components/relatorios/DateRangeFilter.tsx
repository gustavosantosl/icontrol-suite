import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangeFilterProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

export function DateRangeFilter({ dateRange, onDateRangeChange }: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);

  const presetRanges = {
    "thisMonth": {
      label: "Este Mês",
      range: {
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date())
      }
    },
    "lastMonth": {
      label: "Mês Anterior",
      range: {
        from: startOfMonth(subMonths(new Date(), 1)),
        to: endOfMonth(subMonths(new Date(), 1))
      }
    },
    "last3Months": {
      label: "Últimos 3 Meses",
      range: {
        from: startOfMonth(subMonths(new Date(), 2)),
        to: endOfMonth(new Date())
      }
    },
    "last6Months": {
      label: "Últimos 6 Meses",
      range: {
        from: startOfMonth(subMonths(new Date(), 5)),
        to: endOfMonth(new Date())
      }
    },
    "thisYear": {
      label: "Este Ano",
      range: {
        from: new Date(new Date().getFullYear(), 0, 1),
        to: new Date(new Date().getFullYear(), 11, 31)
      }
    }
  };

  const handlePresetSelect = (preset: string) => {
    const range = presetRanges[preset as keyof typeof presetRanges];
    if (range) {
      onDateRangeChange(range.range);
    }
  };

  const handleDateSelect = (range: any) => {
    if (range?.from && range?.to) {
      onDateRangeChange({
        from: range.from,
        to: range.to
      });
      setOpen(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <Select onValueChange={handlePresetSelect}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Período pré-definido" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(presetRanges).map(([key, preset]) => (
            <SelectItem key={key} value={key}>
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full sm:w-[300px] justify-start text-left font-normal",
              !dateRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                  {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                </>
              ) : (
                format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
              )
            ) : (
              <span>Selecionar período customizado</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={{
              from: dateRange?.from,
              to: dateRange?.to
            }}
            onSelect={handleDateSelect}
            numberOfMonths={2}
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}