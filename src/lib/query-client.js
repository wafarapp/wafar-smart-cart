import { QueryClient } from '@tanstack/react-query';

// Optimized query client for better performance
export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
			staleTime: 5 * 60 * 1000, // 5 minutes - cache data
			gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache
		},
		mutations: {
			retry: 1,
		},
	},
});