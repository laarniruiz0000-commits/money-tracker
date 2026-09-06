Money Tracker V3 PWA v2.3 TEST

This is the corrected v2.3 test build.

Finalized test rules:
- Salary Cutoff View is merged into Payday View.
- Payday 10th covers expenses/bills/installments dated 10th-24th.
- Payday 25th covers expenses/bills/installments dated 25th-9th.
- Current Money uses salary received plus previous money left, less actual expenses paid.
- Paid bills/installments reduce Current Money; unpaid upcoming bills remain available for planning.
- Income = Payday 10th + Payday 25th.
- Type options: Expense, Bill, Installment, Budget.
- Category no longer uses Bills, Budget, or Installment as categories.
- Bills added through Expenses are automatically added to Bills Overview.
- Bills Overview supports filtering by Bill/Installment and bank.
- Installments accept starting installment number OR start month; the other can be left blank.
- Installment entries generate the remaining monthly bills automatically.
- Budget entries are planning assumptions and do not reduce Current Money.
- Search and Transaction History support Edit/Delete.
- Service-worker cache is versioned for v2.3.

Test scenarios:
1. Salary on the 10th and 25th; verify Income and Payday View.
2. Add a bill through Expenses; verify Bills Overview updates immediately.
3. Add installment 3/12 and verify 3/12 through 12/12.
4. Mark a bill paid; verify Payday allocation does not change but Current Money decreases.
5. Add Budget; verify it appears in Budget and does not reduce Current Money.
6. Use previous/next month controls or swipe navigation where supported.
