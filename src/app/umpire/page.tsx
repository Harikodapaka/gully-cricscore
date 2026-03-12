import { StartMatchForm } from "./startMatchForm";

export default function UmpirePage() {
  return (
    <div className="mx-auto max-w-[480px] px-4 py-5">
      <div className="ump-form-card">
        <div className="ump-form-head">Match Setup</div>
        <div className="ump-form-body">
          <StartMatchForm />
        </div>
      </div>
    </div>
  );
}
