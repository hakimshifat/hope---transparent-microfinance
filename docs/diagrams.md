# Hope MVP Diagrams

## Use Case Diagram

```mermaid
flowchart LR
  Borrower((Borrower))
  Officer((Field Officer))
  Supervisor((Supervisor))
  Admin((Admin))

  Register[Register and login]
  Profile[Complete profile and NID demo data]
  Browse[Browse loan products]
  Apply[Submit loan application]
  Pay[Submit mock installment payment]
  Ledger[View ledger and receipts]
  ReviewApps[Approve or reject loan applications]
  ReviewPayments[Approve or reject payments]
  Verify[Verify borrower profile]
  Assign[Assign overdue case]
  Visit[Submit visit log]
  Products[Manage loan products]
  Users[Manage users and roles]
  Audit[View audit logs]

  Borrower --> Register
  Borrower --> Profile
  Borrower --> Browse
  Borrower --> Apply
  Borrower --> Pay
  Borrower --> Ledger
  Officer --> Visit
  Supervisor --> Verify
  Supervisor --> ReviewApps
  Supervisor --> ReviewPayments
  Supervisor --> Assign
  Admin --> Verify
  Admin --> ReviewApps
  Admin --> ReviewPayments
  Admin --> Assign
  Admin --> Products
  Admin --> Users
  Admin --> Audit
```

## ER Diagram

```mermaid
erDiagram
  USER ||--o| BORROWER_PROFILE : owns
  USER ||--o{ LOAN_APPLICATION : submits
  USER ||--o{ LOAN : borrows
  USER ||--o{ PAYMENT : submits
  USER ||--o{ OVERDUE_CASE : assigned_to
  USER ||--o{ AUDIT_LOG : acts
  LOAN_PRODUCT ||--o{ LOAN_APPLICATION : selected_for
  LOAN_PRODUCT ||--o{ LOAN : defines
  LOAN ||--o{ INSTALLMENT : has
  LOAN ||--o{ PAYMENT : receives
  INSTALLMENT ||--o{ PAYMENT : paid_by
  PAYMENT ||--o| RECEIPT : generates
  LOAN ||--o{ OVERDUE_CASE : creates
  OVERDUE_CASE ||--o{ VISIT_LOG : has

  USER {
    string fullName
    string phone
    string email
    string role
    string status
  }
  BORROWER_PROFILE {
    string address
    string occupation
    number monthlyIncome
    string nidNumber
    string verificationStatus
  }
  LOAN_PRODUCT {
    string productName
    number minAmount
    number maxAmount
    number serviceChargeRate
    string installmentFrequency
  }
  LOAN {
    number principalAmount
    number serviceChargeAmount
    number totalPayableAmount
    string loanStatus
  }
  INSTALLMENT {
    number installmentNumber
    date dueDate
    number amountDue
    number amountPaid
    string status
  }
  PAYMENT {
    number amount
    string paymentMethod
    string transactionId
    string paymentStatus
  }
```

## Class Diagram

```mermaid
classDiagram
  class User {
    fullName
    phone
    email
    password
    role
    status
  }
  class BorrowerProfile {
    address
    occupation
    monthlyIncome
    nidNumber
    verificationStatus
  }
  class LoanProduct {
    productName
    minAmount
    maxAmount
    serviceChargeRate
    numberOfInstallments
  }
  class LoanApplication {
    requestedAmount
    purpose
    applicationStatus
  }
  class Loan {
    principalAmount
    totalPayableAmount
    installmentAmount
    loanStatus
  }
  class Installment {
    installmentNumber
    dueDate
    amountDue
    amountPaid
    status
  }
  class Payment {
    amount
    paymentMethod
    transactionId
    paymentStatus
  }
  class Receipt {
    receiptNumber
    amount
    paymentDate
  }
  class OverdueCase {
    caseStatus
    priority
    notes
  }
  class VisitLog {
    visitDate
    visitOutcome
    borrowerResponse
  }
```

## Activity Diagram: Loan Approval

```mermaid
flowchart TD
  A[Borrower completes profile] --> B[Admin or Supervisor verifies profile]
  B --> C[Borrower applies for loan product]
  C --> D{Application valid?}
  D -- No --> E[Reject with reason]
  D -- Yes --> F[Approve application]
  F --> G[Create active loan]
  G --> H[Generate installment schedule]
  H --> I[Borrower views ledger]
```

## Sequence Diagram: Mock Payment

```mermaid
sequenceDiagram
  participant B as Borrower
  participant UI as React UI
  participant API as Express API
  participant DB as MongoDB
  participant A as Admin/Supervisor

  B->>UI: Submit mock transaction ID
  UI->>API: POST /api/payments
  API->>DB: Create payment pending
  A->>UI: Open pending payments
  UI->>API: PATCH /api/payments/:id/approve
  API->>DB: Update payment approved
  API->>DB: Update installment paid/partial
  API->>DB: Create receipt
  B->>UI: Open ledger
  UI->>API: GET /api/ledger/my
  API->>DB: Calculate approved totals
  API-->>UI: Ledger summary and history
```

## UI Mockups

```text
Borrower Dashboard
+-----------------------------------------------------+
| Verification | Total Payable | Paid | Remaining     |
| Loan summary | Payment form for selected installment |
| Repayment schedule table                            |
+-----------------------------------------------------+

Supervisor Dashboard
+-----------------------------------------------------+
| Borrowers | Active Loans | Pending Apps | Cases      |
| Borrower verification table                         |
| Loan application review table                       |
| Pending payment review cards                        |
| Overdue assignment form + recent cases              |
+-----------------------------------------------------+

Field Officer Dashboard
+-----------------------------------------------------+
| Assigned | Open | Urgent                             |
| Case list              | Case details + visit log    |
+-----------------------------------------------------+
```
