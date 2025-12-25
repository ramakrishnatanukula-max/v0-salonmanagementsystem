# Family Members Feature Implementation Plan

## Database Schema Changes

### 1. Customers Table (Primary - Mobile as Key)
```sql
-- Already exists, ensure mobile is primary lookup
ALTER TABLE customers 
ADD COLUMN primary_contact BOOLEAN DEFAULT 1,
ADD INDEX idx_mobile (phone);
```

### 2. Family Members Table (New)
```sql
CREATE TABLE family_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  gender ENUM('male', 'female', 'other') NOT NULL,
  age INT,
  age_group ENUM('kid', 'adult', 'men', 'women') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  INDEX idx_customer (customer_id)
);
```

### 3. Appointments Table (Modification)
```sql
ALTER TABLE appointments
ADD COLUMN family_member_id INT NULL,
ADD COLUMN is_for_self BOOLEAN DEFAULT 1,
ADD FOREIGN KEY (family_member_id) REFERENCES family_members(id) ON DELETE SET NULL;
```

## API Endpoints Needed

### Customer Lookup
- `GET /api/customers/lookup?mobile={mobile}` - Fetch customer by mobile
- `POST /api/customers/quick-create` - Create customer with mobile

### Family Members
- `GET /api/customers/{id}/family-members` - List family members
- `POST /api/customers/{id}/family-members` - Add family member
- `PUT /api/family-members/{id}` - Update family member
- `DELETE /api/family-members/{id}` - Delete family member

## UI Flow

1. **Appointment Creation**
   - Enter mobile number
   - Click "Fetch Details" button
   - If exists: Show customer info + family members
   - If not: Show quick create form
   
2. **Booking Selection**
   - Radio: Self / Family Member
   - If Family Member: Dropdown to select or "+ Add New Member"
   
3. **Service Selection by Category**
   - Show categories as buttons (like diagram)
   - Selected category shows services
   - Each service has staff dropdown
   - Multiple services can be added with "+" button

4. **Staff Assignment View**
   - Staff can only see appointments assigned to them
   - Can update actual services for their assigned appointments

## Implementation Steps

1. Create database migration script
2. Create family members API routes
3. Create customer lookup API
4. Update appointments API to handle family members
5. Create FamilyMemberSelector component
6. Create CategoryServiceSelector component
7. Update AppointmentForm with new flow
8. Add staff-specific filtering in appointments view
