import { useCallback, useEffect } from "react"
import { useCustomFetch } from "src/hooks/useCustomFetch"
import { SetTransactionApprovalParams } from "src/utils/types"
import { TransactionPane } from "./TransactionPane"
import { SetTransactionApprovalFunction, TransactionsComponent } from "./types"

export const Transactions: TransactionsComponent = ({ transactions, setUpdateApprovals, setTrackChanges, trackChanges }) => {
  const { fetchWithoutCache, loading } = useCustomFetch()
  const setTransactionApproval = useCallback<SetTransactionApprovalFunction>(
    async ({ transactionId, newValue }) => {
      await fetchWithoutCache<void, SetTransactionApprovalParams>("setTransactionApproval", {
        transactionId,
        value: newValue,
      })

      setTrackChanges(prev => {
        if (prev.includes(transactionId)) {
          prev = prev.filter(prev => prev !== transactionId)
          return prev
        }
        return [...prev, transactionId]
      })

    },
    [fetchWithoutCache, setTrackChanges]
  )

  useEffect(() => {

    if (trackChanges.length === 0) {
      setUpdateApprovals(false)
    } else {
      setUpdateApprovals(true)
    }

  }, [trackChanges, setUpdateApprovals])
  

  if (transactions === null) {
    return <div className="RampLoading--container">Loading...</div>
  }

  return (
    <div data-testid="transaction-container">
      {transactions.map((transaction) => (
        <TransactionPane
          key={transaction.id}
          transaction={transaction}
          loading={loading}
          setTransactionApproval={setTransactionApproval}
        />
      ))}
    </div>
  )
}
