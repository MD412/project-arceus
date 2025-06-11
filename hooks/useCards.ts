import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCards, deleteCard } from '@/services/cards';
import toast from 'react-hot-toast';

export function useCards(userId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: cards, isLoading, isError, error } = useQuery({
    queryKey: ['cards', userId],
    queryFn: () => getCards(userId!),
    enabled: !!userId, // Only run the query if the userId is available
  });

  const { mutate: deleteCardMutation, isPending: isDeleting } = useMutation({
    mutationFn: deleteCard,
    onSuccess: () => {
      toast.success('Card deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['cards', userId] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete card: ${error.message}`);
    },
  });

  return {
    cards,
    isLoading,
    isError,
    error,
    deleteCard: deleteCardMutation,
    isDeleting,
  };
} 