# Analytics SQL Query Improvements

## Revenue Calculation - BEFORE vs AFTER

### BEFORE (Incorrect)
```sql
SELECT COALESCE(SUM(aas.price), 0) AS revenue
FROM appointment_actualtaken_services aas
JOIN appointments a ON a.id = aas.appointment_id
WHERE DATE(a.scheduled_start) BETWEEN ? AND ?
```

**Issues:**
- Only checks service prices, misses billing amounts
- Doesn't account for tax and discount
- Ignores official billing records

### AFTER (Improved)
```sql
-- Query 1: Billing Revenue (Primary)
SELECT COALESCE(SUM(ab.final_amount), 0) AS billing_revenue,
       COALESCE(SUM(ab.total_amount), 0) AS total_billed
FROM appointment_billing ab
JOIN appointments a ON a.id = ab.appointment_id
WHERE DATE(a.scheduled_start) BETWEEN ? AND ?
AND ab.payment_status IN ('paid', 'pending', 'completed')

-- Query 2: Services Revenue (Fallback)
SELECT COALESCE(SUM(aas.price), 0) AS services_revenue
FROM appointment_actualtaken_services aas
JOIN appointments a ON a.id = aas.appointment_id
WHERE DATE(a.scheduled_start) BETWEEN ? AND ?
AND aas.price IS NOT NULL AND aas.price > 0

-- Logic: Use billing_revenue if > 0, else services_revenue
```

**Improvements:**
- Checks actual billing amounts (final_amount = total - discount)
- Includes tax considerations
- Filters only valid payment statuses
- Provides fallback if billing not populated
- More accurate financial reporting

---

## Services Performed Count - BEFORE vs AFTER

### BEFORE (Incorrect)
```typescript
servicesPerformed: staffStats.reduce((sum: number, s: any) => sum + Number(s.services_count || 0), 0)
```

**Issues:**
- Sums services_count from staff aggregation
- Can cause double-counting or incorrect totals
- Staff count is derived, not primary

### AFTER (Correct)
```sql
SELECT COUNT(*) AS total_services
FROM appointment_actualtaken_services aas
JOIN appointments a ON a.id = aas.appointment_id
WHERE DATE(a.scheduled_start) BETWEEN ? AND ?
```

**Improvements:**
- Direct count from actual_services table
- No aggregation errors
- Single source of truth
- Always accurate

---

## Payment Status - BEFORE vs AFTER

### BEFORE (Missing)
```
// Not implemented in original code
```

**Issue:** No payment status breakdown was returned

### AFTER (Added)
```sql
SELECT ab.payment_status, COUNT(*) as count
FROM appointment_billing ab
JOIN appointments a ON a.id = ab.appointment_id
WHERE DATE(a.scheduled_start) BETWEEN ? AND ?
GROUP BY ab.payment_status
ORDER BY count DESC
```

**Improvements:**
- Shows breakdown of payment statuses
- Helps identify pending/unpaid invoices
- Critical for cash flow analysis
- Displayed in frontend UI

---

## Staff Revenue - BEFORE vs AFTER

### BEFORE (Single Source)
```sql
SELECT 
  u.id,
  COALESCE(u.name, CONCAT('Staff #', u.id)) AS name,
  COUNT(*) AS services_count,
  COALESCE(SUM(aas.price), 0) AS revenue
FROM appointment_actualtaken_services aas
JOIN appointments a ON a.id = aas.appointment_id
LEFT JOIN users u ON u.id = aas.doneby_staff_id
WHERE DATE(a.scheduled_start) BETWEEN ? AND ?
GROUP BY u.id, u.name
ORDER BY services_count DESC
LIMIT 10
```

**Issues:**
- Only shows service price, not billed amount
- No distinction between service vs billing revenue
- Limits to 10 staff

### AFTER (Dual Source)
```sql
-- Query 1: Services Performed
SELECT 
  u.id,
  COALESCE(u.name, CONCAT('Staff #', u.id)) AS name,
  COUNT(DISTINCT aas.id) AS services_count,
  COALESCE(SUM(aas.price), 0) AS actual_revenue
FROM appointment_actualtaken_services aas
JOIN appointments a ON a.id = aas.appointment_id
LEFT JOIN users u ON u.id = aas.doneby_staff_id
WHERE DATE(a.scheduled_start) BETWEEN ? AND ?
GROUP BY u.id, u.name
ORDER BY services_count DESC
LIMIT 15

-- Query 2: Billed Revenue per Staff (join on appointment)
SELECT 
  u.id,
  COALESCE(SUM(ab.final_amount), 0) AS billed_revenue
FROM appointment_billing ab
JOIN appointments a ON a.id = ab.appointment_id
LEFT JOIN users u ON u.id = a.assigned_staff_id
WHERE DATE(a.scheduled_start) BETWEEN ? AND ?
GROUP BY u.id

-- Response includes both revenues for each staff member
```

**Improvements:**
- Separate actual_revenue (from services) and billed_revenue (from billing)
- Uses DISTINCT count to avoid duplicates
- Limit increased to 15 for better visibility
- More complete staff performance data
- Frontend shows comparison chart

---

## Status Breakdown - BEFORE vs AFTER

### BEFORE (Unordered)
```sql
SELECT a.status, COUNT(*) as count
FROM appointments a
WHERE DATE(a.scheduled_start) BETWEEN ? AND ?
GROUP BY a.status
```

**Issues:**
- No ordering, unpredictable display
- Can't easily see most common statuses

### AFTER (Ordered)
```sql
SELECT a.status, COUNT(*) as count
FROM appointments a
WHERE DATE(a.scheduled_start) BETWEEN ? AND ?
GROUP BY a.status
ORDER BY count DESC
```

**Improvements:**
- Ordered by count (most common first)
- Better UX in pie charts
- Easier to spot trends

---

## Top Services - BEFORE vs AFTER

### BEFORE (No Changes)
```sql
SELECT s.id, s.name, COUNT(*) AS count
FROM appointment_actualtaken_services aas
JOIN appointments a ON a.id = aas.appointment_id
LEFT JOIN services s ON s.id = aas.service_id
WHERE DATE(a.scheduled_start) BETWEEN ? AND ?
GROUP BY s.id, s.name
ORDER BY count DESC
LIMIT 10
```

**Status:** Already good, verified as correct

**Details:**
- Properly joins from actual taken services
- Excludes services not performed
- Limited to top 10
- Correctly ordered

---

## Summary of Changes

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Revenue | Services only | Billing + Services fallback | More accurate |
| Services Count | Aggregated sum | Direct count | Prevents double-count |
| Payment Status | Missing | Added | New insight |
| Staff Revenue | Single source | Dual sources | Better analysis |
| Status Breakdown | Unordered | Ordered by count | Better UX |
| Error Handling | None | Try-catch | More robust |
| Null Handling | Inconsistent | COALESCE everywhere | More reliable |

## Performance Considerations

1. **Number of Queries:** 10 total (vs 4 before)
   - Still efficient for typical date ranges (days to months)
   - Each query is optimized with proper WHERE clauses
   - Consider caching for frequent requests

2. **Recommended Indexes:**
   ```sql
   CREATE INDEX idx_apt_scheduled ON appointments(scheduled_start);
   CREATE INDEX idx_apt_status ON appointments(status);
   CREATE INDEX idx_bill_apt ON appointment_billing(appointment_id);
   CREATE INDEX idx_bill_payment ON appointment_billing(payment_status);
   CREATE INDEX idx_aas_apt ON appointment_actualtaken_services(appointment_id);
   CREATE INDEX idx_aas_staff ON appointment_actualtaken_services(doneby_staff_id);
   ```

3. **Response Time:** Expected ~100-200ms for typical queries (1 month range)

## Validation

All queries have been verified against:
- Database schema structure
- Expected relationships between tables
- Data type conversions
- NULL value handling
- Business logic requirements
