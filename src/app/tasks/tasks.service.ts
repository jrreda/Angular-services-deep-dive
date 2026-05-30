import { inject, Injectable, signal } from '@angular/core';

import type { Task, TaskStatus } from './task.model';
import { LoggingService } from '../logging.service';

// More efficient bundle chunking
@Injectable({
  providedIn: 'root',
})
export class TasksService {
  private tasks = signal<Task[]>([]);
  private loggingService = inject(LoggingService);

  allTasks = this.tasks.asReadonly();

  addTask(taskData: { title: string; description: string }) {
    const newTask: Task = {
      ...taskData,
      id: Math.random().toString(),
      status: 'OPEN',
    };

    this.tasks.update((oldTasks) => [...oldTasks, newTask]);
    this.loggingService.log(`Add task with title ${taskData.title}`);
  }

  updateTaskStatus(taskId: string, taskStatus: TaskStatus) {
    this.tasks.update((oldTasks) =>
      oldTasks.map((task) =>
        task.id === taskId ? { ...task, status: taskStatus } : task,
      ),
    );
    console.log(`Change task status to ${taskStatus}`);
  }
}
