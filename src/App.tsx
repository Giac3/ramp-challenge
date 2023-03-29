import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee, Transaction } from "./utils/types"

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  const [isLoading, setIsLoading] = useState(false)
  const [prevTransactions, setPrevTransactions] = useState<Transaction[] | null>()
  const transactions = useMemo(
    () => { 
      if (paginatedTransactions?.data && transactionsByEmployee){
        let arr = transactionsByEmployee.concat(paginatedTransactions.data)
        
        const uniqueIds: string[] = [];

        const uniqueTransactions = arr.filter(element => {
          const isDuplicate = uniqueIds.includes(element.id);

          if (!isDuplicate) {
            uniqueIds.push(element.id);
            return true;
          }
          return false;

        });
        return uniqueTransactions

      }
      
      if(paginatedTransactions?.data && !transactionsByEmployee && prevTransactions) {
        let arr = prevTransactions.concat(paginatedTransactions.data)
        
        const uniqueIds: string[] = [];

        const uniqueTransactions: Transaction[] = arr.filter((element: Transaction) => {
          const isDuplicate = uniqueIds.includes(element.id);

          if (!isDuplicate) {
            uniqueIds.push(element.id);
            return true;
          }
          return false;

        });
        return uniqueTransactions
      }
      setPrevTransactions(paginatedTransactions?.data ?? transactionsByEmployee ?? null)
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
  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils])

  const loadMoreTransactions = useCallback(async () => {

    await paginatedTransactionsUtils.fetchAll()

  }, [paginatedTransactionsUtils])

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      paginatedTransactionsUtils.invalidateData()
      await transactionsByEmployeeUtils.fetchById(employeeId)
      setPrevTransactions(null)
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
              await loadAllTransactions() 
              return
            }
            await loadTransactionsByEmployee(newValue.id)
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={transactions} />

          {transactions !== null && (
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
