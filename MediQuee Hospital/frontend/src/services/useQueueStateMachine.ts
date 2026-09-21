import { useState, useEffect } from 'react';
import { type QueueEntry, type QueueStatus, receptionistApi } from './receptionistApi';

export function useQueueStateMachine(departmentId?: string) {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Future real-time subscription setup goes here
  // useEffect(() => {
  //   const sub = socket.subscribe('queue_updates', (update) => setQueue(prev => ...));
  //   return () => sub.unsubscribe();
  // }, []);

  const fetchQueue = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await receptionistApi.getQueue(departmentId ? { departmentId } : undefined);
      setQueue(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch queue');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [departmentId]);

  const isValidTransition = (current: QueueStatus, next: QueueStatus): boolean => {
    const transitions: Record<QueueStatus, QueueStatus[]> = {
      'ARRIVED': ['WAITING', 'CANCELLED'],
      'WAITING': ['CALLED', 'CANCELLED'],
      'CALLED': ['IN_CONSULTATION', 'WAITING', 'CANCELLED'],
      'IN_CONSULTATION': ['COMPLETED'],
      'COMPLETED': [],
      'CANCELLED': []
    };
    return transitions[current]?.includes(next) ?? false;
  };

  const updateStatus = async (id: string, newStatus: QueueStatus) => {
    const entry = queue.find(q => q.id === id);
    if (!entry) return;

    if (!isValidTransition(entry.status, newStatus)) {
      setError(`Invalid status transition from ${entry.status} to ${newStatus}`);
      return;
    }

    try {
      setError(null);
      await receptionistApi.updateQueueStatus(id, newStatus);
      // In a real app with WebSockets, we might just wait for the broadcast.
      // Or optimistically update:
      // setQueue(prev => prev.map(q => q.id === id ? { ...q, status: newStatus } : q));
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
      throw err;
    }
  };

  return {
    queue,
    isLoading,
    error,
    updateStatus,
    refreshQueue: fetchQueue,
    isValidTransition
  };
}
