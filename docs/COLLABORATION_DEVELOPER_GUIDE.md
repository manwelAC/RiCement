# Project Collaboration Feature - Developer Guide

## Quick Reference

### Modified Files
1. **services/firebaseService.ts**
   - Added `Collaborator` interface
   - Extended `Project` interface with `companyId` and `collaborators` fields
   - Added 5 new methods for collaborator management

2. **app/(tabs)/process.tsx**
   - Added collaborator state management
   - Added project details modal state
   - Updated `handleAddProject()` to load company users
   - Updated `handleEditProject()` to load collaborators
   - Updated `handleSaveProject()` to handle collaborators
   - Added collaborator dropdown UI to create project modal
   - Added info button to project cards
   - Integrated ProjectDetailsModal component
   - Added new styling for collaborator UI elements

3. **components/ProjectDetailsModal.tsx** (NEW)
   - New modal component for displaying project details
   - Shows team members and their contributions
   - Displays project status, blocks, progress, dates

### New Interfaces

```typescript
// In firebaseService.ts
export interface Collaborator {
  userId: string;
  fullName: string;
  email: string;
  blocksContributed: number;
  joinedAt?: Date;
}

// Updated Project interface
export interface Project {
  // ... existing fields ...
  companyId?: string;
  collaborators?: Collaborator[];
  completedBlocks?: number;
}
```

### Key Methods in FirebaseService

```typescript
// Get user's projects (created or collaborated on)
await firebaseService.getUserProjects(userId: string)

// Get company users for selection
await firebaseService.getCompanyUsersList(companyId: string)

// Add collaborators to project
await firebaseService.addCollaboratorsToProject(
  projectId: string,
  userIds: string[],
  userDetails: {[key: string]: {fullName: string; email: string}}
)

// Update collaborator's block contribution
await firebaseService.updateCollaboratorBlocks(
  projectId: string,
  userId: string,
  blocksAdded: number
)

// Remove collaborator from project
await firebaseService.removeCollaborator(projectId: string, userId: string)
```

### State Management in process.tsx

```typescript
// Collaborators
const [companyUsers, setCompanyUsers] = useState<Collaborator[]>([]);
const [selectedCollaborators, setSelectedCollaborators] = useState<string[]>([]);
const [showCollaboratorDropdown, setShowCollaboratorDropdown] = useState(false);
const [currentUserCompany, setCurrentUserCompany] = useState<string | null>(null);
const [isLoadingUsers, setIsLoadingUsers] = useState(false);

// Project details modal
const [selectedProject, setSelectedProject] = useState<Project | null>(null);
const [isProjectDetailsModalVisible, setIsProjectDetailsModalVisible] = useState(false);
```

### Integration Points

1. **Create/Edit Project Modal**
   - Location: Lines 1365-1475 in process.tsx
   - Shows collaborator dropdown if user has a company
   - Displays selected collaborators as removable tags

2. **Project Card**
   - Location: Lines 1100-1245 in process.tsx
   - Info button triggers project details modal
   - Shows project status and quick info

3. **Project Details Modal**
   - Imported from: `components/ProjectDetailsModal.tsx`
   - Displays comprehensive project and team information

## Workflow for Contributing Blocks

When a collaborator completes blocks during project execution:

```typescript
// Update their contribution
await firebaseService.updateCollaboratorBlocks(
  projectId,
  userId,
  blockCount  // number of blocks completed
);

// This will:
// 1. Update collaborator.blocksContributed
// 2. Recalculate total completedBlocks
// 3. Update Firestore
```

## Testing Checklist

- [ ] Create project with multiple collaborators
- [ ] Verify collaborators can see the project
- [ ] Add/remove collaborators from existing project
- [ ] View project details modal
- [ ] Verify contribution tracking shows correct numbers
- [ ] Test with users from different companies (should only see own company users)
- [ ] Test with user without company (dropdown should not appear)
- [ ] Verify Firestore structure matches expected format

## Styling Classes Added

Collaborator-related styles in process.tsx:

```typescript
collaboratorDropdown         // Dropdown button style
collaboratorDropdownText     // Dropdown text style
collaboratorDropdownMenu     // Menu container
collaboratorsList            // List wrapper
collaboratorItem             // Individual item
collaboratorItemSelected     // Selected item highlight
collaboratorCheckbox         // Checkbox style
collaboratorInfo             // Info container
collaboratorName             // Name text
collaboratorEmail            // Email text
selectedCollaboratorsList    // Tags container
selectedCollaboratorTag      // Tag style
selectedCollaboratorText     // Tag text
noCollaboratorsText          // Empty state text
```

## Common Tasks

### Adding a Collaborator After Project Creation
```typescript
const userDetails = {
  [userId]: {
    fullName: user.fullName,
    email: user.email
  }
};

await firebaseService.addCollaboratorsToProject(
  projectId,
  [userId],
  userDetails
);
```

### Tracking Block Contribution
```typescript
// When user completes 5 blocks
await firebaseService.updateCollaboratorBlocks(projectId, userId, 5);

// To update again with 3 more blocks
await firebaseService.updateCollaboratorBlocks(projectId, userId, 3);
// Total will be 8 blocks
```

### Getting All Collaborator Projects
```typescript
const projects = await firebaseService.getUserProjects(userId);
// Returns both created and collaborated projects
```

## Error Handling

All methods include error handling:
- Logs errors to console
- Throws error for caller to handle
- Firestore operations wrapped in try-catch

## Performance Considerations

1. **Company Users Query**: Fetches on modal open (not on every render)
2. **Firestore Updates**: Real-time updates via onSnapshot for live sync
3. **Array Operations**: Efficiently filters/maps collaborators
4. **Component Re-renders**: State properly isolated to prevent unnecessary updates

## Future Integration Points

When implementing other features, remember:

1. **Project Listing**: Use `getUserProjects()` instead of `getProjects()`
2. **Project Updates**: Maintain `collaborators` array when updating
3. **Block Tracking**: Call `updateCollaboratorBlocks()` when blocks complete
4. **Admin Views**: Display all projects (no filtering needed for admins)
5. **Reports**: Can now generate per-user contribution reports

## Notes

- Backward compatible: projects without collaborators still work
- Company field is optional but required for collaborator selection
- Contribution tracking is additive (blocks are summed)
- All Firestore updates include `updatedAt` timestamp
