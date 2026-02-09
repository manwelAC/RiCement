# Project Collaboration Feature Implementation

## Overview
The RiCement system now supports team collaboration on projects within companies. Users can add team members to projects, and the system tracks individual contributions (number of blocks completed by each team member).

## Features Implemented

### 1. **Team Member Selection When Creating Projects**
- When creating a new project, users from the same company are displayed in a dropdown
- Multiple team members can be selected to collaborate on a project
- Selected team members appear as tags and can be easily removed
- Team member selection is only available for users with a company assigned

### 2. **Project-Specific User Visibility**
- Users only see projects they created or are invited to collaborate on
- When a user is added as a collaborator to a project, they automatically gain access to view and work on that project
- The system filters projects based on user participation (creator or collaborator)

### 3. **Contribution Tracking**
- Each collaborator's contribution is tracked in blocks
- The system records how many hollow blocks each team member contributed to a project
- Real-time updates ensure contribution data is accurate throughout the project lifecycle

### 4. **Project Details View**
- A new "Info" button (information-circle-outline icon) appears on each project card
- Clicking the info button displays a detailed modal showing:
  - Project name and status
  - Total blocks and completed blocks
  - Progress percentage
  - Estimated time and date
  - Team members and their individual contributions
  - Total number of team members
  - Total blocks contributed by all team members

## Technical Changes

### Data Model Extensions

#### Updated `Project` Interface
```typescript
export interface Project {
  // ... existing fields ...
  companyId?: string;                    // Company this project belongs to
  collaborators?: Collaborator[];        // Users collaborating on this project
  completedBlocks?: number;              // Total blocks completed by all collaborators
}
```

#### New `Collaborator` Interface
```typescript
export interface Collaborator {
  userId: string;
  fullName: string;
  email: string;
  blocksContributed: number;  // Track how many blocks this user completed
  joinedAt?: Date;
}
```

### Firebase Service Methods

#### New Methods in `firebaseService.ts`

1. **`getUserProjects(userId: string): Promise<Project[]>`**
   - Retrieves all projects where the user is either the creator or a collaborator
   - Combines both queries and returns sorted results

2. **`getCompanyUsersList(companyId: string): Promise<Collaborator[]>`**
   - Fetches all users in a specific company
   - Used for populating the collaborator selection dropdown

3. **`addCollaboratorsToProject(projectId: string, userIds: string[], userDetails: {...}): Promise<void>`**
   - Adds one or more collaborators to an existing project
   - Updates the Firestore document with new collaborators

4. **`updateCollaboratorBlocks(projectId: string, userId: string, blocksAdded: number): Promise<void>`**
   - Updates the number of blocks a specific collaborator has contributed
   - Automatically recalculates total project completion

5. **`removeCollaborator(projectId: string, userId: string): Promise<void>`**
   - Removes a collaborator from a project
   - Updates project metadata accordingly

### UI Components

#### New Modal: `ProjectDetailsModal.tsx`
Located at: `components/ProjectDetailsModal.tsx`

Features:
- Displays comprehensive project information
- Shows team composition with member avatars
- Displays block contribution for each team member
- Shows summary statistics (team size, total contributions)
- Clean, organized layout with sections

#### Updated: `process.tsx`
Changes made:
1. Added collaborator dropdown to the "Add Project" modal
2. Added "Info" button to project cards
3. Integrated ProjectDetailsModal component
4. Added state management for collaborators and project details modal
5. Updated project creation/editing logic to handle collaborators
6. Added styling for collaborator selection UI elements

## User Flow

### Adding Collaborators to a New Project
1. User clicks "ADD" button to create a new project
2. User enters project details (name, blocks, etc.)
3. User sees "Add Team Members" section (only if assigned to a company)
4. User clicks on dropdown to see list of company users
5. User selects multiple team members (checkboxes)
6. Selected members appear as removable tags below the dropdown
7. User clicks "Add Project" to create project with collaborators

### Viewing Project Details
1. User sees project card in the "Project Library"
2. User clicks the info button (ℹ️ icon) on the project card
3. Modal opens showing:
   - Project information (status, blocks, progress, dates, times)
   - Team section listing all collaborators
   - Each collaborator's block contribution
   - Summary statistics

### Tracking Contributions
During project execution:
- As blocks are completed by team members, their individual `blocksContributed` values are updated
- Total `completedBlocks` reflects sum of all collaborators' contributions
- This data persists in Firestore for historical tracking

## Firestore Structure

### Projects Collection
Each project document now contains:
```javascript
{
  id: "projectId",
  name: "Project Name",
  blocks: 100,
  estimatedTime: "01:40:00",
  date: "13/01/2026",
  status: "Queue",
  userId: "creatorUserId",
  companyId: "companyId",
  collaborators: [
    {
      userId: "user1Id",
      fullName: "John Doe",
      email: "john@example.com",
      blocksContributed: 25,
      joinedAt: Timestamp
    },
    {
      userId: "user2Id",
      fullName: "Jane Smith",
      email: "jane@example.com",
      blocksContributed: 30,
      joinedAt: Timestamp
    }
  ],
  completedBlocks: 55,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Key Features

✅ **Team Collaboration**: Multiple users can work on a single project
✅ **Contribution Tracking**: System tracks individual block contributions per user
✅ **Project Visibility**: Users see only projects they're part of
✅ **Company-Based Teams**: Team members are selected from the same company
✅ **Detailed Insights**: View team composition and contributions in detail
✅ **Real-time Updates**: Contributions update as work progresses
✅ **Easy Management**: Add/remove collaborators from projects

## Usage Examples

### Creating a Project with Team Members
1. Go to "Projects" tab → Click "ADD"
2. Fill project details
3. Scroll to "Add Team Members" section
4. Click dropdown and select team members
5. Click "Add Project"

### Viewing Team Performance
1. Find project in library
2. Click the info button (ℹ️)
3. Scroll to "Team Members & Contributions" section
4. See each member's contribution and summary stats

## Future Enhancement Opportunities

1. **Role-Based Permissions**: Assign roles (lead, member) to collaborators
2. **Activity Timeline**: Show who did what and when
3. **Notifications**: Notify team members when added to a project
4. **Collaboration Features**: Real-time chat or comments within projects
5. **Performance Analytics**: Generate team performance reports
6. **Export Reports**: Export project data with team contributions to PDF/CSV

## Notes

- Collaborator selection is only available if the user has a company assigned
- Company users are fetched dynamically when the modal opens
- All updates to collaborators and contributions are synced to Firestore
- The system maintains backward compatibility with existing single-user projects
