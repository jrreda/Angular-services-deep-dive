# Services Deep Dive

Small Angular 18 task manager used to practice **dependency injection**, **services**, and **injection tokens**. The UI lets you add tasks, filter them by status, and change each task’s status from a dropdown.

## What the app does

- **Add tasks** via the new-task form (`title`, `description`).
- **List tasks** with filters: All, Open, In progress, Done.
- **Update status** per task (Open → In progress → Completed).
- **Log actions** when a task is added (via `LoggingService`).

Task state lives in a single `TasksService` instance shared by all components that inject it.

## Project structure

```
src/
├── main.ts                          # Bootstrap + app-wide providers
└── app/
    ├── app.component.*              # Root shell; hosts <app-tasks>
    ├── logging.service.ts           # Root-scoped logging helper
    └── tasks/
        ├── task.model.ts            # Task types, status options, TASK_STATUS_OPTIONS token
        ├── tasks.service.ts         # Task state (signals) + add/update APIs
        ├── tasks.component.*        # Layout: new-task + tasks-list
        ├── new-task/                # Form; adds tasks through TasksService
        └── tasks-list/
            ├── tasks-list.component.*   # Filter UI + filtered task list
            └── task-item/               # Single row + status dropdown
```

## Services and dependency injection

This repo contrasts several ways to register and consume dependencies.

### `TasksService` — custom provider via `InjectionToken`

`TasksService` is **not** `providedIn: 'root'` (that line is commented out in the service). Instead, bootstrap registers it under a token:

```typescript
// main.ts
export const TasksServiceToken = new InjectionToken<TasksService>('tasks-service-token');

bootstrapApplication(AppComponent, {
  providers: [{ provide: TasksServiceToken, useClass: TasksService }],
});
```

Components inject the **token**, not the class directly:

- `NewTaskComponent` — constructor injection: `@Inject(TasksServiceToken)`
- `TasksListComponent`, `TaskItemComponent` — `inject(TasksServiceToken)`

That pattern decouples consumers from a concrete class and allows swapping implementations at bootstrap (e.g. for tests or alternate backends).

### `LoggingService` — `providedIn: 'root'`

`LoggingService` uses the default tree-shakable root provider. `TasksService` pulls it in with `inject(LoggingService)` and calls `log()` when a task is added.

### `TASK_STATUS_OPTIONS` — component-level `useValue` provider

Status labels and select `value` strings live in `TaskStatusOptions` (`task.model.ts`). A provider maps them to an injection token:

```typescript
export const TASK_STATUS_OPTIONS = new InjectionToken<TaskStatusOptionsType>('task-status-options');

export const taskStatusOptionsProvider: Provider = {
  provide: TASK_STATUS_OPTIONS,
  useValue: TaskStatusOptions,
};
```

`TasksListComponent` registers `taskStatusOptionsProvider` in its `providers` array so **it and its children** (`TaskItemComponent`) can `inject(TASK_STATUS_OPTIONS)` without polluting the entire app.

### State: signals in the service

`TasksService` keeps tasks in a private `signal<Task[]>()`, exposes `allTasks` as `asReadonly()`, and updates via `addTask()` / `updateTaskStatus()`. List filtering uses `computed()` in `TasksListComponent` over `allTasks()`.

### Task model

| Field         | Type                                              |
|---------------|---------------------------------------------------|
| `id`          | `string` (random id on create)                    |
| `title`       | `string`                                          |
| `description` | `string`                                          |
| `status`      | `'OPEN' \| 'IN_PROGRESS' \| 'DONE'`               |

UI filter/select values (`'open'`, `'in-progress'`, `'done'`) are mapped to `TaskStatus` in `TaskItemComponent` and `TasksListComponent`.

## Component flow

```
AppComponent
└── TasksComponent
    ├── NewTaskComponent          → TasksServiceToken.addTask()
    └── TasksListComponent        → filters via computed + TasksServiceToken
        └── TaskItemComponent     → TasksServiceToken.updateTaskStatus()
                                    TASK_STATUS_OPTIONS for dropdown
```

## Getting started

**Requirements:** Node.js and Angular CLI 18 (or use `npx ng`).

```bash
npm install
npm start          # or: ng serve
```

Open [http://localhost:4200/](http://localhost:4200/). The dev server reloads on file changes.

## Other CLI commands

| Command        | Purpose                          |
|----------------|----------------------------------|
| `ng build`     | Production build → `dist/`       |
| `ng test`      | Unit tests (Karma + Jasmine)     |
| `ng generate`  | Scaffold components, services, … |

## Further reading

- [Angular Dependency Injection](https://angular.dev/guide/di)
- [Injection tokens](https://angular.dev/guide/di/dependency-injection-providers#using-an-injectiontoken-object)
- [Angular CLI reference](https://angular.dev/tools/cli)
