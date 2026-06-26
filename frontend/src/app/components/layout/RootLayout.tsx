import { Outlet, useLocation, useNavigate } from "react-router";
import { useEffect } from "react";
import { BottomNavigation } from "./BottomNavigation";
import { useAuth } from "../../context/AuthContext";

export function RootLayout() {
  const { isAuthenticated, ready } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (!isAuthenticated && location.pathname !== "/") {
      navigate("/", { replace: true });
      return;
    }

    if (isAuthenticated && location.pathname === "/") {
      navigate("/home", { replace: true });
    }
  }, [isAuthenticated, location.pathname, navigate, ready]);

  const hideNavigation = location.pathname === "/" || !isAuthenticated;

  if (!ready) {
    return (
      <div className="min-h-dvh bg-gradient-to-b from-rose-50 via-pink-50 to-orange-50">
        <div className="mx-auto flex min-h-dvh w-full max-w-md items-center justify-center px-6">
          <div className="rounded-3xl bg-white/80 px-6 py-5 text-center shadow-lg backdrop-blur-sm">
            <p className="text-sm text-gray-500">Loading your space...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh bg-gradient-to-b from-rose-50 via-pink-50 to-orange-50">
      <div className="mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden bg-white/35 shadow-[0_0_0_1px_rgba(255,255,255,0.3)] backdrop-blur-[2px]">
        <main className="flex-1 overflow-y-auto pb-24">
          <Outlet />
        </main>
        {!hideNavigation && <BottomNavigation />}
      </div>
    </div>
  );
}
