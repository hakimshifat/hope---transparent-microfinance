# Hope: Transparent Microfinance Loan Management Web Application

**Software Development Project Report**  
**Course:** CSE 3208, Software Development Project  
**Institution:** Bangladesh University of Professionals, Department of Computer Science and Engineering  
**Group:** Group 1  
**Date:** 13 May 2026

## Submitted By

| Name | ID |
| --- | --- |
| Abdul Hakim Shifat | 23524202129 |
| SM Shahrier Emon | 23524202095 |
| MD Mainul Islam | 23524202047 |
| Sarowar Rony | 23524202051 |

## Introduction

Hope is a full-stack web application developed to support a transparent and organized microfinance loan management workflow. The project focuses on reducing manual dependency in borrower registration, loan application review, installment tracking, and overdue follow-up. It provides separate role-based dashboards for borrowers, field officers, supervisors, and administrators. The system was designed as an MVP for the Bangladeshi microfinance context, using a mock payment review workflow instead of real banking or payment gateway integration.

## Project Idea

The submitted project idea was to build **Hope**, a transparent microfinance loan management web application for institutions that currently depend on manual loan records and field collection processes. In the proposed workflow, borrowers can register, complete their profiles, apply for predefined institutional loan products, submit installment payments, and view a clear ledger of paid, due, overdue, and remaining amounts. Field officers become involved mainly when borrowers miss payments or need offline assistance, while supervisors and admins monitor approvals, payments, overdue cases, and audit records.

The implemented project follows the main idea of the proposal and converts it into a working MVP. It includes borrower onboarding, borrower verification, predefined loan products, loan application approval, automatic repayment schedule generation, mock payment submission, payment approval, receipt creation, ledger visibility, overdue detection, case assignment, field officer visit logs, audit logs, and role-based access control. Features such as real OTP verification, NID verification through government services, real payment gateway integration, SMS notification, GPS tracking, and AI credit scoring were kept outside the MVP scope.

## Features of the Project

| Area | Implemented Features |
| --- | --- |
| Authentication and Roles | Registration, login, JWT authentication, protected routes, and role-based access for Borrower, Field Officer, Supervisor, and Admin. |
| Borrower Profile | Borrower profile creation with personal, occupation, income, NID, nominee, and verification information. |
| Borrower Verification | Supervisor/Admin can approve or reject borrower profiles with verification status tracking. |
| Loan Products | Predefined loan products with minimum amount, maximum amount, service charge, duration, installment frequency, late fee, eligibility note, and status. |
| Loan Applications | Borrowers can apply for suitable loan products; Supervisor/Admin can approve or reject applications. |
| Loan Generation | Approved applications create active loans and automatic installment schedules. |
| Installment Tracking | Installments show due dates, paid amount, outstanding amount, and status such as paid, due, and overdue. |
| Mock Payment Flow | Borrowers submit mock installment payments using methods such as bKash, Nagad, Rocket, Card, or Cash Assist. |
| Payment Review | Supervisor/Admin reviews pending payments, approves valid submissions, rejects invalid ones, and updates installment records. |
| Receipts | Approved payments generate receipt records that borrowers can view later. |
| Ledger | Borrowers can view transparent loan summaries, total payable, total paid, remaining balance, next due date, and repayment history. |
| Overdue Management | The system detects overdue installments and supports assignment of cases to field officers. |
| Field Officer Workflow | Field officers see assigned cases and submit visit logs after borrower follow-up. |
| Audit Logs | Important actions such as approvals, rejections, payments, and case operations are recorded for accountability. |
## Design of the Project

The project follows a client-server architecture with a React frontend, an Express REST API, and a MongoDB database. The frontend is organized into reusable components, protected routes, context-based authentication, and separate pages for each user role. The backend contains modular route files, middleware for authentication and error handling, Mongoose models for all core entities, and utility functions for loan calculation, overdue detection, and audit logging.

The visual design uses a responsive dashboard-based layout. Borrower screens are designed around clarity, showing loan progress, payment options, repayment schedules, and ledger information in a simple sequence. Supervisor and admin screens use tab-based operational panels for borrower verification, loan application review, pending payment review, overdue assignment, field logs, audit logs, user management, and product management. Field officer screens are kept task-focused so assigned overdue cases and visit updates can be handled quickly.

### High-Level Architecture

| Layer | Main Responsibility |
| --- | --- |
| Frontend | Presents role-based interfaces, forms, dashboards, ledger views, and API-connected workflows. |
| Backend API | Handles authentication, authorization, validation, business rules, loan workflows, and audit logging. |
| Database | Stores users, borrower profiles, loan products, applications, loans, installments, payments, receipts, cases, visit logs, and audit logs. |
| Utilities | Calculates loan totals and schedules, refreshes overdue installments, and records audit actions. |

### Main Data Entities

| Entity | Purpose |
| --- | --- |
| User | Stores account credentials, contact information, role, and status. |
| BorrowerProfile | Stores borrower verification and eligibility details. |
| LoanProduct | Defines institutional product rules and limits. |
| LoanApplication | Tracks borrower loan requests and review decisions. |
| Loan | Stores approved loan details and total payable amount. |
| Installment | Stores repayment schedule, due amount, paid amount, due date, and status. |
| Payment | Stores mock payment submissions and approval status. |
| Receipt | Stores receipt details for approved payments. |
| OverdueCase | Tracks overdue installment follow-up assigned to field officers. |
| VisitLog | Records field officer borrower visits. |
| AuditLog | Maintains accountability for sensitive system actions. |

## Development of the Project

The project was implemented as a full-stack MVP with a separated frontend and backend structure. Requirements were derived from the submitted proposal and converted into role-based workflows for borrowers, field officers, supervisors, and admins. The backend was built first around Express routes, Mongoose models, authentication middleware, and business utilities for loan calculation and overdue detection. Database schemas were created for users, borrower profiles, loan products, applications, loans, installments, payments, receipts, overdue cases, visit logs, and audit logs. Seed data was added to demonstrate realistic borrowers, loan products, active loans, paid installments, pending payments, overdue installments, and assigned cases. The frontend was developed using React, Vite, Tailwind CSS, React Router, Axios, and Lucide icons. Protected routes and authentication context were added so that each role can access only its permitted pages. Borrower screens were connected to APIs for profile, loan, installment, payment, receipt, and ledger data. Supervisor and admin dashboards were connected to review queues, case assignment tools, product management, user management, and audit logs. The system was tested with seeded demo accounts and screenshots were captured from the working local application.

### Development Tools, Languages, and Software

| Category | Tools / Languages / Software Used |
| --- | --- |
| Frontend Language | JavaScript, JSX, HTML5, CSS3 |
| Frontend Framework | React.js with Vite |
| Frontend Styling | Tailwind CSS |
| UI Icons | Lucide React |
| Routing | React Router DOM |
| API Client | Axios |
| Backend Language | JavaScript running on Node.js |
| Backend Framework | Express.js |
| Database | MongoDB |
| ODM | Mongoose |
| Authentication | JSON Web Token and bcryptjs |
| Backend Security / Middleware | Helmet, CORS, Morgan, custom auth middleware |
| Development Environment | Visual Studio Code, npm, local terminal |
| Testing / Demo Support | Seed script, local MongoDB, browser testing, Playwright screenshots |

## Overview of the Project

This section presents selected screenshots from the developed project. The screenshots show the public landing page, borrower dashboard, borrower ledger, admin loan application review, and overdue case management workflow.

### Public Home Page

![Hope public home page](report-assets/hope-home.png)

The home page introduces the platform and communicates the main value of transparent, role-based microfinance management.

### Borrower Dashboard

![Borrower dashboard](report-assets/hope-borrower-dashboard.png)

The borrower dashboard shows the borrower's profile status, repayment progress, loan summary, active loan information, payment submission area, and repayment schedule.

### Borrower Ledger

![Borrower ledger](report-assets/hope-ledger.png)

The ledger screen gives borrowers a transparent view of payment progress, total payable amount, total paid amount, remaining balance, and installment-level records.

### Admin Loan Application Review

![Admin loan application review](report-assets/hope-admin-applications.png)

The admin and supervisor workflow includes review queues for loan applications, allowing authorized users to approve or reject applications based on borrower and product information.

### Overdue Case Management

![Overdue case management](report-assets/hope-overdue-cases.png)

The overdue management screen supports assignment of overdue installments to field officers and helps the institution track follow-up actions.

## Contribution

| Member Name | ID | Contribution |
| --- | --- | --- |
| Abdul Hakim Shifat | 23524202129 | Led project planning and requirement mapping from the proposal; designed the backend workflow for authentication, loan applications, loan approval, repayment schedules, and API structure; coordinated final integration and report preparation. |
| SM Shahrier Emon | 23524202095 | Developed and refined frontend pages for public navigation, borrower dashboard, login/register flow, loan product browsing, payment submission, ledger view, and responsive interface behavior. |
| MD Mainul Islam | 23524202047 | Worked on database design and backend data modeling for users, borrower profiles, loan products, loans, installments, payments, receipts, overdue cases, visit logs, and audit logs; supported seed data preparation for demonstrations. |
| Sarowar Rony | 23524202051 | Contributed UI/UX review, dashboard usability improvements, role-based workflow testing, screenshot preparation, bug reporting, and validation of borrower, supervisor/admin, and field officer use cases. |

## Conclusion

Hope successfully demonstrates how a microfinance institution can digitize loan application, approval, repayment monitoring, ledger transparency, and overdue follow-up within a single web platform. The completed MVP preserves the central idea of the original proposal while keeping high-risk external integrations, such as real OTP, NID verification, and payment gateway services, outside the project scope. The role-based design improves clarity for borrowers and gives institutional users better control over approvals, cases, products, users, and audit records. Future development can extend the system with real payment gateway integration, SMS/OTP services, document upload, deployment, analytics, and stronger production-grade security controls.
