import PanelHeader from '../components/common/PanelHeader';
import { useI18n } from '../i18n/I18nProvider';

export default function AdminTasksScreen({ onAction, submitting, tasks }) {
  const { t } = useI18n();
  return (
    <main className="screen-shell">
      <section className="auth-panel admin-panel single-panel">
        <PanelHeader title={t('adminTasks.panelTitle')} subtitle={t('adminTasks.panelSubtitle')} />
        <div className="task-stack">
          {tasks.length === 0 ? (
            <div className="empty-state">{t('adminTasks.empty')}</div>
          ) : (
            tasks.map((task) => (
              <article className="task-card" key={task.id}>
                <div>
                  <span className="task-type">{task.type === 'USER_APPROVAL' ? t('adminTasks.taskType') : task.type}</span>
                  <h3>{task.type === 'USER_APPROVAL' ? t('adminTasks.taskTitle') : task.title}</h3>
                  <p>{task.type === 'USER_APPROVAL' ? t('adminTasks.taskDescription', { username: task.username }) : task.description}</p>
                </div>
                {task.type === 'USER_APPROVAL' ? (
                  <div className="action-row compact">
                    <button className="primary-button" disabled={submitting} onClick={() => onAction(task.userId, 'activate')} type="button">
                      {t('actions.activate')}
                    </button>
                    <button className="ghost-button" disabled={submitting} onClick={() => onAction(task.userId, 'block')} type="button">
                      {t('actions.block')}
                    </button>
                  </div>
                ) : null}
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
