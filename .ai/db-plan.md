<conversation_summary>
<decisions>
1. Hierarchical user structure: one employee can have only one manager, one manager can be assigned to many employees.
2. Database will store both active and historical assessment processes using status flags.
3. Goal weights validation will be handled in application logic, not enforced at database level.
4. Authentication will be implemented with Supabase Auth integrated with user table.
5. Row Level Security (RLS) will limit employees to viewing only their own assessment processes and goals, while managers can access their subordinates' data.
6. Goals, self-assessments, and final assessments will be separate entities with appropriate relationships.
7. Assessment processes will have status tracking (e.g., "in definition", "awaiting self-assessment", etc.).
8. UUIDs will be used for primary keys following Supabase conventions.
</decisions>

<matched_recommendations>
1. Structure user table to include roles and hierarchical relationships.
2. Implement status tracking for assessment processes (active/inactive).
3. Integrate Supabase Auth with database user tables.
4. Implement Row Level Security for proper access control.
5. Design goals table with weight field without database-level constraints on sum.
6. Use enum tables for goal categories.
7. Separate goals, self-assessments, and final assessments as distinct entities.
8. Implement assessment process status tracking mechanism.
9. Use UUID types for primary keys.
10. Add indexes on frequently queried columns.
11. Include timestamps for auditing on all relevant records.
</matched_recommendations>

<database_planning_summary>
The database design for the Goal Assessment System MVP will center around several key entities:

1. **Users**: Storing employee and manager information with hierarchical relationships. Each employee will have exactly one manager, while managers can oversee multiple employees. This table will connect with Supabase Auth for authentication.

2. **Assessment Processes**: Representing evaluation cycles with status tracking (e.g., "in definition", "awaiting self-assessment", "in self-assessment", "awaiting manager assessment", "completed"). Each process will have an active/inactive flag to distinguish current from historical records.

3. **Goals**: Individual objectives assigned to employees within an assessment process, containing descriptions, weights (as percentages), and categories. Goals will be linked to specific employees and assessment processes.

4. **Goal Categories**: Implemented as an enum table rather than simple strings, providing standardized categorization options.

5. **Self-Assessments**: Employee evaluations of their goal achievements, linked to specific goals.

6. **Manager Assessments**: Final evaluations by managers, also linked to specific goals.

The database will implement Row Level Security to ensure employees can only view and interact with their own data, while managers can access information related to their subordinates. Data validation for goal weights (ensuring they sum to 100%) will occur at the application level rather than through database constraints, allowing for work-in-progress data storage.

All tables will utilize UUID primary keys in line with Supabase conventions and include timestamps (created_at, updated_at) for audit purposes. Strategic indexing will be applied to frequently queried columns such as user IDs and goal statuses to optimize performance.

The schema is designed with extensibility in mind, potentially accommodating more complex management hierarchies in future iterations.
</database_planning_summary>

<unresolved_issues>
1. Specific format and scale for assessment ratings (numeric, text-based, percentage-based)
2. Implementation details for predefined goal suggestions
3. Whether comments or feedback will be stored alongside assessments
4. Specific metadata fields needed for goals beyond the core requirements
5. Detailed requirements for reporting and analytics capabilities
6. Specific goal categories to be included in the enum table
</unresolved_issues>
</conversation_summary>
