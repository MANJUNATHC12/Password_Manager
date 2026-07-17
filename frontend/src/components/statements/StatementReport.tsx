import {
  TrendingDown,
  TrendingUp,
  Wallet,
  Hash,
  ArrowRightLeft,
  PieChart as PieIcon,
  BarChart3,
  Trophy,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { DonutChart } from '@/components/charts/DonutChart'
import { BarChart } from '@/components/charts/BarChart'
import { TopTransactions } from '@/components/charts/TopTransactions'
import { categoryColor, formatCurrency, formatDate } from '@/config/expenses'
import type { StatementAnalytics } from '@/lib/statementAnalytics'

interface Props {
  analytics: StatementAnalytics
}

function Stat({
  icon,
  label,
  value,
  tone = 'default',
}: {
  icon: React.ReactNode
  label: string
  value: string
  tone?: 'default' | 'expense' | 'income' | 'net-pos' | 'net-neg'
}) {
  const valueColor =
    tone === 'expense'
      ? 'text-red-600'
      : tone === 'income'
        ? 'text-emerald-600'
        : tone === 'net-pos'
          ? 'text-emerald-600'
          : tone === 'net-neg'
            ? 'text-red-600'
            : 'text-slate-900'
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <p className="text-sm">{label}</p>
      </div>
      <p className={`mt-1 text-2xl font-bold ${valueColor}`}>{value}</p>
    </Card>
  )
}

function SectionTitle({
  icon,
  children,
}: {
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="text-slate-400">{icon}</span>
      <h3 className="text-sm font-semibold text-slate-700">{children}</h3>
    </div>
  )
}

export function StatementReport({ analytics }: Props) {
  const {
    totalExpense,
    totalIncome,
    net,
    txnCount,
    dateFrom,
    dateTo,
    byCategory,
    overTime,
    isMonthly,
    topTransactions,
  } = analytics

  const donutData = byCategory.map((c) => ({
    label: c.category,
    value: c.total,
    color: categoryColor(c.category),
  }))

  const overTimeData = overTime.map((p) => ({
    label: p.display,
    value: p.total,
  }))

  const incomeVsExpense = [
    { label: 'Income', value: totalIncome, color: '#10b981' },
    { label: 'Expense', value: totalExpense, color: '#ef4444' },
  ]

  return (
    <div className="space-y-6">
      {(dateFrom || dateTo) && (
        <p className="text-sm text-slate-500">
          Statement period:{' '}
          <span className="font-medium text-slate-700">
            {dateFrom ? formatDate(dateFrom) : '—'} – {dateTo ? formatDate(dateTo) : '—'}
          </span>
        </p>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          icon={<TrendingDown className="h-4 w-4" />}
          label="Total expenses"
          value={formatCurrency(totalExpense)}
          tone="expense"
        />
        <Stat
          icon={<TrendingUp className="h-4 w-4" />}
          label="Total income"
          value={formatCurrency(totalIncome)}
          tone="income"
        />
        <Stat
          icon={<Wallet className="h-4 w-4" />}
          label="Net"
          value={formatCurrency(net)}
          tone={net >= 0 ? 'net-pos' : 'net-neg'}
        />
        <Stat
          icon={<Hash className="h-4 w-4" />}
          label="Transactions"
          value={String(txnCount)}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Category donut */}
        <Card className="p-5">
          <SectionTitle icon={<PieIcon className="h-4 w-4" />}>
            Spending by category
          </SectionTitle>
          <DonutChart
            data={donutData}
            centerLabel="Total spend"
            centerValue={formatCurrency(totalExpense)}
            emptyText="No expense transactions found"
          />
        </Card>

        {/* Income vs Expense */}
        <Card className="p-5">
          <SectionTitle icon={<ArrowRightLeft className="h-4 w-4" />}>
            Income vs expense
          </SectionTitle>
          <BarChart data={incomeVsExpense} height={220} showValues />
          <p className="mt-3 text-center text-sm text-slate-500">
            Net {net >= 0 ? 'surplus' : 'deficit'} of{' '}
            <span
              className={`font-semibold ${net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
            >
              {formatCurrency(Math.abs(net))}
            </span>
          </p>
        </Card>

        {/* Spending over time */}
        <Card className="p-5">
          <SectionTitle icon={<BarChart3 className="h-4 w-4" />}>
            Spending over time ({isMonthly ? 'monthly' : 'daily'})
          </SectionTitle>
          <BarChart data={overTimeData} color="#6366f1" height={220} />
        </Card>

        {/* Top transactions */}
        <Card className="p-5">
          <SectionTitle icon={<Trophy className="h-4 w-4" />}>
            Top transactions
          </SectionTitle>
          <TopTransactions items={topTransactions} />
        </Card>
      </div>
    </div>
  )
}
