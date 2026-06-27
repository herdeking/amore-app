# Register background notification task
path = '/data/data/com.termux/files/home/amore-app/index.ts'
with open(path, 'r') as f:
    content = f.read()

if 'TaskManager' not in content:
    bg_task = """
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND-NOTIFICATION-TASK';

TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }) => {
  if (error) return;
  // Background notification received - handled by system
  console.log('Background notification received:', data);
});

Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
"""
    content = bg_task + content
    with open(path, 'w') as f:
        f.write(content)
    print('✅ Background notification task registered')
else:
    print('ℹ️ Already registered')
