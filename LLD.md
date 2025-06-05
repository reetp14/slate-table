# slate-table: Low-Level Design Documentation

## 1. Introduction

### 1.1 Purpose
This Low-Level Design (LLD) document provides detailed technical specifications for implementing the slate-table plugin. It serves as a comprehensive guide for developers working on the implementation, maintenance, and enhancement of the plugin's features.

### 1.2 Scope
This document covers:
- Detailed component-level designs
- State management implementations
- Event handling mechanisms 
- Business logic specifications
- Data flow between components
- Error handling strategies

## 2. Assumptions
- Slate.js version >= 0.100.0 is used as the core editor framework
- React is used for component implementation
- TypeScript is used for type safety
- Modern browser APIs are available
- DOM manipulation is handled through Slate's transformation API
- Table structures follow HTML-like semantics

## 3. Detailed Design

### 3.1 Frontend Design

#### 3.1.1 UI Components

##### Table Component
Purpose: Renders and manages table structure in the editor
- Renders main table container with data attributes
- Manages section rendering (thead, tbody, tfoot)
- Handles table-level attributes and properties
- Provides context for nested components

##### Table Cell Component
Purpose: Handles individual cell rendering and interactions
- Manages cell-specific attributes (colspan, rowspan)
- Handles cell content rendering
- Provides selection and focus states
- Manages cell-level event handlers

##### Toolbar Controls
Purpose: Provides UI controls for table operations
- Table insertion controls with dimension options
- Row and column manipulation buttons
- Cell merge/split operations
- Table deletion and reset options

#### 3.1.2 State Management

##### Editor State
The editor maintains table-specific state including:
- Current table position in document
- Active cell selection
- Table dimensions and structure
- Operation history for undo/redo
- Validation state and errors

##### Selection State
Manages selection-related information:
- Selected cell ranges
- Selection direction
- Multi-cell selection state
- Selection boundaries
- Cell spanning considerations

#### 3.1.3 Event Handling

##### Keyboard Events
Handles keyboard interactions including:
- Tab navigation between cells
- Enter for row navigation
- Arrow key cell navigation
- Delete/Backspace content handling
- Shortcut key combinations
- Selection modification with Shift key

##### Mouse Events
Manages mouse-based interactions:
- Cell selection start/end
- Drag selection handling
- Click position detection
- Selection range calculation
- Context menu triggers
- Double-click behaviors

#### 3.1.4 Business Logic

##### Table Operations
1. Table Creation:
   - Validates insertion position
   - Creates table structure with specified dimensions
   - Initializes default cell content
   - Sets up section structure (thead/tbody)
   - Positions cursor in first cell

2. Cell Merging:
   - Validates mergeable cell selection
   - Calculates merged cell dimensions
   - Preserves content from merged cells
   - Updates colspan/rowspan attributes
   - Maintains table structure integrity

3. Row/Column Management:
   - Handles insertion at specific positions
   - Maintains cell spanning across operations
   - Updates table dimensions
   - Recalculates cell positions
   - Preserves existing content

##### Table Navigation
1. Cursor Movement:
   - Calculates next valid position
   - Handles edge cases (table boundaries)
   - Respects cell spanning
   - Manages section boundaries
   - Implements different navigation modes

2. Selection Management:
   - Tracks selection ranges
   - Updates selection boundaries
   - Handles multi-cell selection
   - Validates selection states
   - Manages focus/anchor points

##### Data Validation
1. Cell Validation:
   - Checks span attribute validity
   - Validates content structure
   - Ensures minimal cell content
   - Verifies attribute types
   - Checks for structural integrity

2. Table Validation:
   - Validates overall structure
   - Checks section organization
   - Verifies row/column counts
   - Ensures proper nesting
   - Validates table attributes

##### Error Handling
1. Operation Errors:
   - Identifies error types
   - Provides error messages
   - Implements recovery actions
   - Maintains editor stability
   - Logs error details

2. State Recovery:
   - Tracks operation history
   - Implements reversion logic
   - Restores valid states
   - Preserves user content
   - Notifies user of issues

### 3.2 Matrix Evaluation System

#### 3.2.1 Matrix Representation

The matrix system is implemented through three key files:

1. Basic Matrix (`matrix.ts`):
   - Generator function that yields cell arrays
   - Traverses table structure row by row
   - Returns NodeEntry<CellElement>[] for each row
   - Supports reverse traversal option
   - Handles location-based filtering

2. Filled Matrix (`filled-matrix.ts`):
   - Creates complete matrix with virtual cells
   - Handles colspan/rowspan calculations
   - Manages cell context with directional spans:
     * rtl: Right-to-left position tracking
     * ltr: Left-to-right position tracking
     * ttb: Top-to-bottom position tracking
     * btt: Bottom-to-top position tracking
   - Preserves section boundaries (thead/tbody/tfoot)
   - Implements offset management for spans

3. Matrix Types (`types.ts`):
```typescript
type NodeEntryWithContext = [
  NodeEntry<CellElement>,
  {
    rtl: number  // Position from right edge
    ltr: number  // Position from left edge
    ttb: number  // Position from top
    btt: number  // Position from bottom
  }
]
```

#### 3.2.2 Matrix Operations

1. Matrix Construction (`filled-matrix.ts`):
   - Iterates through table sections separately
   - Creates section-specific matrices
   - Initializes empty matrix arrays
   - Processes cells with spanning
   - Calculates virtual positions

2. Span Processing:
   - Extracts rowSpan/colSpan values
   - Handles offset calculations
   - Creates virtual cell entries
   - Updates position contexts
   - Maintains section integrity

3. Position Management:
   - Maps between DOM and matrix positions
   - Handles selection coordinates
   - Resolves spanning conflicts
   - Validates cell boundaries
   - Processes section transitions

#### 3.2.3 Matrix Transformations

1. Column Operations (insertColumn/removeColumn):
   - Calculates insertion/removal point based on current selection
   - Handles colspan adjustments:
     * Increases colspan when inserting within spanning cells
     * Decreases colspan when removing spanned columns
   - Maintains section-specific cell types (th/td)
   - Handles virtual cell redistribution
   - Updates matrix indices after changes

2. Row Operations (insertRow/removeRow):
   - Determines row position and boundaries
   - Handles rowspan management:
     * Increases rowspan for cells spanning the insertion point
     * Decreases rowspan for cells spanning removed rows
   - Preserves cell content during operations
   - Maintains table section integrity
   - Handles empty section cleanup

3. Merge/Split Operations:
   - Validates mergeable cell selections
   - Calculates spanning requirements
   - Preserves content from affected cells
   - Updates matrix structure after changes
   - Handles section-specific merge rules

#### 3.2.4 Matrix Algorithms

1. Navigation Logic (`TableCursor`):
   - Four-directional movement (upward, downward, forward, backward)
   - Selection mode support (start, end, all)
   - Edge detection for table boundaries
   - Matrix-based position tracking
   - Path-based cell location

2. Cell Selection:
   - Multi-cell selection management
   - Selection state persistence using WeakMap
   - Selection validation and clearing
   - Cell selection status tracking
   - Selection matrix maintenance

3. Position Management:
   - Cell boundary detection (isOnEdge)
   - First/last cell detection
   - Row position tracking
   - Section boundary handling
   - Selection point normalization

#### 3.2.5 Optimization and Normalization

1. Normalization Chain:
   - Attributes normalization (colspan/rowspan)
   - Content structure validation
   - Section organization (thead/tbody/tfoot)
   - Table structure integrity
   - Cell content validation
   - Row structure verification

2. Performance Optimizations:
   - WeakMap for editor state storage
   - Batched operations via withoutNormalizing
   - Lazy matrix calculations
   - Selective normalization based on changes
   - Efficient path comparisons

3. State Management:
   - Editor-specific options storage
   - Selection state caching
   - Matrix representation caching
   - Operation batching
   - Memory cleanup for removed elements

#### 3.2.6 Error Prevention

1. Structure Validation:
   - Cell attribute validation
   - Content structure verification
   - Section organization checks
   - Table integrity verification
   - Row/column consistency

2. Recovery Mechanisms:
   - Automatic structure correction
   - Invalid span normalization
   - Content structure repair
   - Section reorganization
   - Table cleanup on removal