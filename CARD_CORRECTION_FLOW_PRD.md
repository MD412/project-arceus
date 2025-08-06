# Card Correction Flow - Technical Requirements PRD

## Executive Summary

The card correction flow allows users to review AI-detected cards from scanned images and correct misidentifications. Users can search for the correct card from a comprehensive local database and update the detection in real-time.

## Current System Architecture

### Database Schema
- **`scans` table**: Stores scan metadata (id, user_id, title, status, progress, storage_path, summary_image_path)
- **`scan_uploads` table**: Alternative scan storage with processing_status field
- **`card_detections` table**: Stores individual card detections with:
  - `id` (UUID)
  - `scan_id` (UUID, foreign key to scans)
  - `guess_card_id` (UUID, foreign key to cards table)
  - `confidence` (float)
  - `crop_path` (string, image path)
  - `created_at` (timestamp)

### Data Flow Issues Identified
1. **Card ID Mismatch**: Local JSON uses IDs like `base1-4`, database uses UUIDs like `8d3e9b6d-a6a3-447c-83f8-e9859655f9d3`
2. **UI State Synchronization**: Card names not updating after database changes
3. **Search Performance**: Switched from external API to local JSON for speed

## Core Components

### 1. Scan Review Page (`app/(app)/scans/[id]/page.tsx`)
**Purpose**: Main interface for reviewing and correcting card detections

**Key Features**:
- Displays scan image and detected cards
- Modal-based card correction interface
- Real-time search and selection
- Optimistic UI updates

**State Management**:
```typescript
const [scan, setScan] = useState<any>(null);
const [detections, setDetections] = useState<any[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [resolvedNames, setResolvedNames] = useState<Map<string, string>>(new Map());
const [selectedDetection, setSelectedDetection] = useState<any>(null);
const [showCorrectionModal, setShowCorrectionModal] = useState(false);
```

**Data Fetching**:
- Fetches scan data from `scan_uploads` or `scans` table
- Joins `card_detections` with `cards` table on `guess_card_id`
- Resolves card names for display

### 2. Card Search System (`app/api/cards/search/route.ts`)
**Purpose**: Provides fast card search from local JSON database

**Implementation**:
- Loads all JSON files from `pokemon-tcg-data/cards/en/`
- Caches data in memory for performance
- Filters by card name, set name, or card number
- Returns structured card objects

**Search Logic**:
```typescript
const searchTerm = searchParams.get('q')?.toLowerCase() || '';
const results = allCards.filter(card => 
  card.name.toLowerCase().includes(searchTerm) ||
  card.set.name.toLowerCase().includes(searchTerm) ||
  card.number.toLowerCase().includes(searchTerm)
);
```

**Performance**: "Blazing fast" - sub-50ms response times

### 3. Card Search Input (`components/ui/CardSearchInput.tsx`)
**Purpose**: Debounced search input with dropdown results

**Features**:
- 50ms debounce delay for responsive feel
- Dropdown with card images and details
- Keyboard navigation support
- Click-to-select functionality

**Styling**: CircuitDS design system with proper typography and spacing

### 4. Streamlined Scan Review (`components/ui/StreamlinedScanReview.tsx`)
**Purpose**: Displays detected cards with correction interface

**Features**:
- Clickable card areas (entire card item, not just button)
- Visual indicators for review state
- Approve/Reject all functionality
- Responsive grid layout

**Interaction**:
```typescript
const handleCardClick = (detection: any) => {
  setSelectedDetection(detection);
  setShowCorrectionModal(true);
};
```

## Critical Issues & Requirements

### Issue 1: Card ID Mismatch
**Problem**: Local JSON uses format `base1-4`, database expects UUIDs
**Impact**: Card corrections fail silently - UI shows old name after "successful" update
**Root Cause**: Database stores different card IDs than search results provide

**Requirements**:
- Implement card ID mapping between local JSON and database
- Ensure consistent card identification across systems
- Add validation to prevent ID mismatches

### Issue 2: UI State Synchronization
**Problem**: Database updates succeed but UI doesn't reflect changes
**Impact**: User sees "success" message but old card names remain
**Root Cause**: `resolvedNames` state not updating after database changes

**Requirements**:
- Implement proper state invalidation after database updates
- Ensure UI re-renders with updated card data
- Add loading states during updates

### Issue 3: Modal Design Regression
**Problem**: Modal reverted to old single-column layout
**Impact**: Search results cut off, poor UX
**Requirements**:
- Restore two-column modal layout
- Ensure search dropdown fits within modal bounds
- Maintain CircuitDS typography standards

## Technical Requirements

### Database Requirements
1. **Card ID Consistency**: Implement UUID mapping for local JSON cards
2. **Foreign Key Integrity**: Ensure `guess_card_id` references valid cards
3. **Transaction Support**: Use database transactions for atomic updates
4. **Audit Trail**: Log card correction history

### API Requirements
1. **Search Performance**: Maintain <100ms response times
2. **Card Mapping**: Implement ID translation layer
3. **Error Handling**: Proper error responses for failed updates
4. **Validation**: Validate card IDs before database updates

### UI Requirements
1. **Real-time Updates**: Immediate UI feedback after corrections
2. **Loading States**: Clear indication during database operations
3. **Error Handling**: User-friendly error messages
4. **Accessibility**: Keyboard navigation and screen reader support

### State Management Requirements
1. **Single Source of Truth**: Eliminate duplicate state
2. **Optimistic Updates**: Show changes immediately, rollback on failure
3. **Cache Invalidation**: Proper cache management for updated data
4. **Race Condition Prevention**: Handle concurrent updates safely

## Implementation Strategy

### Phase 1: Fix Card ID Mapping
1. Create card ID translation service
2. Update search API to return database-compatible IDs
3. Add validation to prevent ID mismatches
4. Test with existing card corrections

### Phase 2: Fix UI Synchronization
1. Implement proper state invalidation
2. Add loading states during updates
3. Ensure UI re-renders with updated data
4. Test end-to-end correction flow

### Phase 3: Restore Modal Design
1. Fix modal layout to two-column design
2. Ensure search dropdown fits properly
3. Apply CircuitDS typography standards
4. Test responsive behavior

### Phase 4: Performance Optimization
1. Implement proper caching strategy
2. Optimize database queries
3. Add error boundaries
4. Performance testing

## Success Criteria

### Functional Requirements
- [ ] Card corrections update UI immediately
- [ ] Search results show correct card names
- [ ] Modal design follows CircuitDS standards
- [ ] No duplicate "Approve All" buttons
- [ ] Database updates are atomic and consistent

### Performance Requirements
- [ ] Search response time <100ms
- [ ] UI updates within 500ms of database change
- [ ] No memory leaks from state management
- [ ] Smooth animations and transitions

### User Experience Requirements
- [ ] Clear feedback for all user actions
- [ ] Intuitive card selection interface
- [ ] Responsive design on all screen sizes
- [ ] Accessible to users with disabilities

## Risk Assessment

### High Risk
1. **Card ID Mapping Complexity**: Risk of data corruption if mapping fails
2. **State Management Race Conditions**: Risk of inconsistent UI state
3. **Database Transaction Failures**: Risk of partial updates

### Medium Risk
1. **Performance Degradation**: Risk of slow search with large card database
2. **UI Regression**: Risk of breaking existing functionality
3. **Browser Compatibility**: Risk of issues on different browsers

### Low Risk
1. **Styling Issues**: Risk of minor visual inconsistencies
2. **Console Logging**: Risk of excessive debug output in production

## Testing Strategy

### Unit Testing
- Card ID mapping functions
- Search API endpoints
- State management logic
- Database update functions

### Integration Testing
- End-to-end card correction flow
- Database transaction integrity
- API response consistency
- UI state synchronization

### User Acceptance Testing
- Card correction accuracy
- Search performance
- Modal usability
- Responsive design

## Monitoring & Debugging

### Key Metrics
- Card correction success rate
- Search response times
- Database update latency
- UI update consistency

### Debug Tools
- Console logging for state changes
- Database query monitoring
- Network request tracking
- UI state inspection

## Dependencies

### External Dependencies
- Supabase database
- Local JSON card database
- CircuitDS design system
- React Hot Toast for notifications

### Internal Dependencies
- Card search API
- Database schema
- State management patterns
- UI component library

## Timeline Estimate

### Phase 1 (Card ID Mapping): 2-3 days
- Implement ID translation service
- Update search API
- Add validation
- Testing

### Phase 2 (UI Synchronization): 2-3 days
- Fix state management
- Add loading states
- Implement proper invalidation
- Testing

### Phase 3 (Modal Design): 1-2 days
- Fix layout issues
- Apply design standards
- Responsive testing

### Phase 4 (Optimization): 1-2 days
- Performance tuning
- Error handling
- Final testing

**Total Estimate**: 6-10 days for complete implementation

## Conclusion

The card correction flow is a critical user-facing feature that requires careful attention to data consistency, UI synchronization, and user experience. The identified issues stem from architectural decisions around state management and data mapping that need to be addressed systematically.

The implementation should prioritize fixing the core functionality (card ID mapping and UI synchronization) before addressing design refinements. Success depends on maintaining data integrity while providing a smooth, responsive user experience. 