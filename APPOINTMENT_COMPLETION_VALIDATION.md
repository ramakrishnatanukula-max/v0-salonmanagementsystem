# Appointment Completion Validation

## Overview
Implemented comprehensive validation logic to ensure data integrity and proper workflow in the appointment system:
1. An appointment can only be marked as "completed" when all actual services are either "completed" or "cancelled"
2. A service cannot be marked as "completed" without having a staff member assigned

## Changes Made

### Backend Changes

#### File: `app/api/appointments/[id]/route.ts`

1. **PUT Endpoint Enhancement**
   - Added validation check before updating appointment status to "completed"
   - Queries all actual services for the appointment
   - Verifies that no services have status other than "completed" or "canceled"
   - Returns 400 error with descriptive message if validation fails

2. **PATCH Endpoint Enhancement**
   - Same validation logic as PUT endpoint
   - Ensures partial updates also respect the business rule
   - Returns 400 error with descriptive message if validation fails

#### File: `app/api/appointments/[id]/actual-services/route.ts`

1. **POST Endpoint Enhancement (Adding Services)**
   - Added validation to prevent adding services with "completed" status without staff assignment
   - Returns 400 error: "Cannot mark service as completed without assigning a staff member."

2. **PATCH Endpoint Enhancement (Updating Services)**
   - Added validation before allowing status change to "completed"
   - Checks both current and new staff assignment values
   - Prevents marking service as completed if no staff member is assigned
   - Returns 400 error with descriptive message if validation fails

### Frontend Changes

#### File: `app/dashboard/appointments/page.tsx`

1. **DetailsModal Component Enhancement**
   - Added `toastConfig` state to track validation errors
   - Updated `handleSave` function to:
     - Check response status from the API
     - Parse and display error messages
     - Show error popup to the user
   - Added Toast notification component for error display

2. **ActualServicesModal Component Enhancement**
   - Added `toastConfig` state for service-level error handling
   - Added `onError` callback prop to child modals
   - Integrated Toast notification component

3. **EditServiceModal Component Enhancement**
   - Added `onError` prop to handle validation errors
   - Enhanced error handling in `handleSave` function
   - Parses API error responses and displays via toast popup

4. **AddServiceModal Component Enhancement**
   - Added `onError` prop to handle validation errors
   - Enhanced error handling in `handleSave` function
   - Displays staff assignment requirement errors via toast popup

## Business Logic

The validation ensures:
- **Appointment Level:**
  - All actual services must be in "completed" or "canceled" status before appointment can be marked complete
  - Prevents premature marking of appointments as complete
  
- **Service Level:**
  - Services cannot be marked as "completed" without a staff member assigned
  - Ensures accountability and proper tracking of who performed each service
  - Maintains data integrity across the service lifecycle

## User Experience

### Scenario 1: Marking Appointment as Completed
When a user attempts to mark an appointment as completed with incomplete services:
1. The save action is prevented
2. A popup toast notification appears with the error message
3. Error message: "Cannot mark appointment as completed. All actual services must be either completed or cancelled."
4. User must complete or cancel all actual services before marking the appointment as complete

### Scenario 2: Completing Service Without Staff Assignment
When a user attempts to mark a service as completed without assigning staff:
1. The save action is prevented
2. A popup toast notification appears with the error message
3. Error message: "Cannot mark service as completed without assigning a staff member."
4. User must assign a staff member before marking the service as complete

## Testing Recommendations

### Test Case 1: Appointment Completion Validation
1. Create an appointment with multiple services
2. Leave some services in "scheduled" or "in_service" status
3. Try to mark the appointment as "completed"
4. Verify the error popup appears
5. Complete or cancel all services
6. Verify the appointment can now be marked as "completed"

### Test Case 2: Service Completion Without Staff
1. Open an existing appointment
2. Add a new service or edit an existing one
3. Leave staff assignment empty/unassigned
4. Try to mark the service status as "completed"
5. Verify the error popup appears
6. Assign a staff member to the service
7. Verify the service can now be marked as "completed"
