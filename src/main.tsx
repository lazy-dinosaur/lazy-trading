import { createRoot } from "react-dom/client";
import "./index.css";
import { MemoryRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Providers from "./contexts/providers.tsx";
import { AppRoutes } from "./routes";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <Providers>
      <MemoryRouter>
        <AppRoutes />
      </MemoryRouter>
    </Providers>
  </QueryClientProvider>,
);
