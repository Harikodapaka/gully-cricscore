import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { signIn } from "next-auth/react";

export const UnauthenticatedPage = ({
  router,
}: {
  router: AppRouterInstance;
}) => {
  return (
    <div className="mx-auto max-w-[480px] px-4 py-5">
      <div className="unauth-card">
        <div className="unauth-head">Umpire Panel</div>
        <div className="unauth-body">
          <p className="unauth-msg">
            Sign in with Google to access the umpire panel and start recording
            scores.
          </p>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => signIn("google")}
              className="form-submit"
            >
              Sign in with Google
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="ump-delete-btn"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
