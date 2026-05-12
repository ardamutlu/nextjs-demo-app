"use client";

import { ReactNode, useState } from "react";
import * as Sentry from "@sentry/nextjs";
import { CircleX } from "lucide-react";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { toast } from "sonner";
import { Alert, AlertIcon, AlertTitle } from "@/components/ui/alert";

const QueryProvider = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
          },
        },
        queryCache: new QueryCache({
          onError: (error, query) => {
            const message =
              error.message || "Something went wrong. Please try again.";

            Sentry.captureException(error, {
              tags: {
                queryKey: JSON.stringify(query.queryKey),
              },
            });

            toast.custom(
              () => (
                <Alert variant="mono" icon="destructive" close={false}>
                  <AlertIcon>
                    <CircleX />
                  </AlertIcon>
                  <AlertTitle>{message}</AlertTitle>
                </Alert>
              ),
              {
                position: "top-center",
              },
            );
          },
        }),
        mutationCache: new MutationCache({
          onError: (error) => {
            Sentry.captureException(error);
          },
        }),
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
      {children}
    </QueryClientProvider>
  );
};

export { QueryProvider };
