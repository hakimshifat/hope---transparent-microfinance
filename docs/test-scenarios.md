# Hope MVP Test Scenarios

## Authentication

| ID | Scenario | Steps | Expected Result |
| --- | --- | --- | --- |
| AUTH-01 | Borrower registration | Open Register, submit full name, phone, email, password | Borrower account is created and user is redirected to profile |
| AUTH-02 | Login | Login with seeded admin, supervisor, officer, or borrower credentials | JWT is stored and correct role dashboard opens |
| AUTH-03 | Role route protection | Login as borrower and open `/admin` | User is redirected to dashboard |

## Borrower Profile

| ID | Scenario | Steps | Expected Result |
| --- | --- | --- | --- |
| PROF-01 | Create profile | Borrower submits address, occupation, income, NID | Profile is saved with `pending` verification |
| PROF-02 | Verify borrower | Admin/Supervisor clicks Verify in dashboard | Profile status becomes `verified` and audit log is created |
| PROF-03 | Reject borrower | Admin/Supervisor rejects profile with reason | Profile status becomes `rejected` |

## Loan Products And Applications

| ID | Scenario | Steps | Expected Result |
| --- | --- | --- | --- |
| PROD-01 | Create product | Admin creates product with amount limits and installments | Product appears in product list |
| PROD-02 | Submit application | Verified borrower applies for active product within min/max | Pending application is created |
| APP-01 | Reject invalid approval | Supervisor approves application for unverified borrower | API blocks approval |
| APP-02 | Approve application | Supervisor approves pending application | Loan is created and installments are generated |
| APP-03 | One active loan rule | Borrower with active loan applies again and approval is attempted | API blocks second active loan |

## Repayment And Ledger

| ID | Scenario | Steps | Expected Result |
| --- | --- | --- | --- |
| PAY-01 | Submit mock payment | Borrower selects unpaid installment and submits bKash/Nagad transaction ID | Payment status is `pending`; installment remains unpaid |
| PAY-02 | Approve payment | Admin/Supervisor approves pending payment | Installment amountPaid updates, status becomes paid or partial, receipt is generated |
| PAY-03 | Reject payment | Admin/Supervisor rejects pending payment | Borrower sees rejected payment with reason |
| LED-01 | Ledger update | Approve payment and open borrower ledger | Total paid increases and remaining balance decreases |

## Overdue And Field Officer

| ID | Scenario | Steps | Expected Result |
| --- | --- | --- | --- |
| OVD-01 | Overdue detection | Run `PATCH /api/installments/update-overdue` or open dashboards after due date passes | Past unpaid installments become `overdue` |
| CASE-01 | Assign case | Supervisor/Admin assigns overdue installment to field officer | Officer sees the case in assigned cases |
| CASE-02 | Field officer isolation | Officer tries to access another officer's case logs | API returns forbidden |
| VISIT-01 | Submit visit log | Officer submits visit outcome and follow-up date | Visit log is saved and case status updates |

## Access Control

| ID | Scenario | Steps | Expected Result |
| --- | --- | --- | --- |
| RBAC-01 | Borrower data isolation | Borrower calls another borrower ledger endpoint | API returns forbidden |
| RBAC-02 | Field officer restrictions | Field officer attempts payment approval | API returns forbidden |
| RBAC-03 | Supervisor limitation | Supervisor attempts product creation | API returns forbidden |
| RBAC-04 | Admin control | Admin creates users, products, reviews payments, views audit logs | Actions succeed |
