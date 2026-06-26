import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/layout/RootLayout";
import { AddEntryPage } from "./pages/AddEntryPage";
import { AnonymousSpacePage } from "./pages/AnonymousSpacePage";
import { FamilyTreePage } from "./pages/FamilyTreePage";
import { HomePage } from "./pages/HomePage";
import { JournalPage } from "./pages/JournalPage";
import { LoginPage } from "./pages/LoginPage";
import { MemoriesPage } from "./pages/MemoriesPage";
import { MessageCapsulesPage } from "./pages/MessageCapsulesPage";
import { PromiseZonePage } from "./pages/PromiseZonePage";
import { SettingsPage } from "./pages/SettingsPage";
import { SupportToolsPage } from "./pages/SupportToolsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: LoginPage },
      { path: "home", Component: HomePage },
      { path: "journal", Component: JournalPage },
      { path: "add-entry", Component: AddEntryPage },
      { path: "journal/:entryId/edit", Component: AddEntryPage },
      { path: "family", Component: FamilyTreePage },
      { path: "memories", Component: MemoriesPage },
      { path: "support", Component: SupportToolsPage },
      { path: "anonymous-space", Component: AnonymousSpacePage },
      { path: "promises", Component: PromiseZonePage },
      { path: "capsules", Component: MessageCapsulesPage },
      { path: "settings", Component: SettingsPage },
    ],
  },
]);
