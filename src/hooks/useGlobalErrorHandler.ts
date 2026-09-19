import { useEffect } from 'react';
import { notification } from 'antd';

/**
 * Ловит необработанные ошибки и отклонённые промисы на уровне окна.
 * Показывает уведомление и логирует. В проде можно отправлять в Sentry.
 */
export function useGlobalErrorHandler() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      console.error('[global error]', event.error ?? event.message);
      notification.error({
        message: 'Непредвиденная ошибка',
        description: String(event.error?.message ?? event.message).slice(0, 200),
        placement: 'topRight',
      });
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      console.error('[unhandled rejection]', reason);
      notification.error({
        message: 'Ошибка в асинхронном коде',
        description: String(reason?.message ?? reason).slice(0, 200),
        placement: 'topRight',
      });
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);
}