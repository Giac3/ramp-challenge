import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useCustomFetch } from "./hooks/useCustomFetch"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee, Transaction } from "./utils/types"

export function App() {
  const { clearCache } = useCustomFetch()
  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  const [isLoading, setIsLoading] = useState(false)
  const [trackChanges, setTrackChanges] = useState<string[]>([])
  const [updateApprovals, setUpdateApprovals] = useState(false)
  const [viewMoreVisible, setViewMoreVisible] = useState(false)
  const [prevTransactions, setPrevTransactions] = useState<Transaction[] | null>()
  const transactions = useMemo(
    () => { 
      if(!paginatedTransactions?.nextPage) {
        setViewMoreVisible(false)
      }
      if(prevTransactions! && paginatedTransactions!){
        return prevTransactions.concat(paginatedTransactions.data)
      }
      
      return paginatedTransactions?.data ?? transactionsByEmployee ?? null
    },
    [paginatedTransactions, transactionsByEmployee, prevTransactions]
  )

  const loadAllTransactions = useCallback(async () => {
    setIsLoading(true)
    transactionsByEmployeeUtils.invalidateData()

    await employeeUtils.fetchAll()
    setIsLoading(false)
    await paginatedTransactionsUtils.fetchAll()
    setViewMoreVisible(true)
  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils])

  const loadMoreTransactions = useCallback(async () => {

    await paginatedTransactionsUtils.fetchAll()
    setPrevTransactions(transactions)

  }, [paginatedTransactionsUtils, transactions])

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      paginatedTransactionsUtils.invalidateData()
      setPrevTransactions(null)
      await transactionsByEmployeeUtils.fetchById(employeeId)
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions()
    }
  }, [employeeUtils.loading, employees, loadAllTransactions])

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={isLoading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            if (newValue === null) {
              return
            }

            if (newValue.id === ""){
              if (updateApprovals) {
                clearCache()
                setTrackChanges([])
              }
              await loadAllTransactions() 
              setViewMoreVisible(true)
              return
            }
            setViewMoreVisible(false)
            if(updateApprovals) {
              clearCache()
              setTrackChanges([])
            }

            await loadTransactionsByEmployee(newValue.id)
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={transactions} setUpdateApprovals={setUpdateApprovals} setTrackChanges={setTrackChanges} trackChanges={trackChanges}/>

          {transactions !== null && viewMoreVisible && (
            <button
              className="RampButton"
              disabled={paginatedTransactionsUtils.loading}
              onClick={async () => {
                await loadMoreTransactions()
              }}
            >
              View More
            </button>
          )}
        </div>
      </main>
    </Fragment>
  )
}
