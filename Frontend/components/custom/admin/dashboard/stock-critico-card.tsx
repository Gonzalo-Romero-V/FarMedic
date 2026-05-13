import { PackageX } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

export type StockCriticoItem = {
  id: string
  sucursal: string
  medicamento: string
  stockActual: number
  stockMinimo: number
}

type Props = {
  /** `undefined` = loading (skeleton). `[]` = vacío. */
  items?: readonly StockCriticoItem[]
}

const ROW_SKELETON_COUNT = 4

export function StockCriticoCard({ items }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PackageX className="h-4 w-4 text-destructive" aria-hidden />
          Stock crítico por sucursal
        </CardTitle>
        <CardDescription>Medicamentos por debajo del mínimo definido</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-4">Sucursal</TableHead>
              <TableHead>Medicamento</TableHead>
              <TableHead className="text-right">Actual</TableHead>
              <TableHead className="px-4 text-right">Mínimo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items === undefined
              ? Array.from({ length: ROW_SKELETON_COUNT }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="px-4">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="ml-auto h-4 w-10" />
                    </TableCell>
                    <TableCell className="px-4 text-right">
                      <Skeleton className="ml-auto h-4 w-10" />
                    </TableCell>
                  </TableRow>
                ))
              : items.length === 0
                ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                        Sin stock crítico — todos los medicamentos están sobre el mínimo.
                      </TableCell>
                    </TableRow>
                  )
                : items.map((it) => {
                    const ratio = it.stockMinimo === 0 ? 1 : it.stockActual / it.stockMinimo
                    return (
                      <TableRow key={it.id}>
                        <TableCell className="px-4 text-muted-foreground">{it.sucursal}</TableCell>
                        <TableCell className="font-medium">{it.medicamento}</TableCell>
                        <TableCell
                          className={cn(
                            "text-right tabular-nums",
                            ratio < 0.5 ? "text-destructive" : "text-amber-600 dark:text-amber-400",
                          )}
                        >
                          {it.stockActual}
                        </TableCell>
                        <TableCell className="px-4 text-right tabular-nums text-muted-foreground">
                          {it.stockMinimo}
                        </TableCell>
                      </TableRow>
                    )
                  })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
