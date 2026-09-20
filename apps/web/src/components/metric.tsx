export function Metric({
  label,
  value,
  note,
}: {
  label: string;
  value: string | number;
  note?: string;
}) {
  return (
    <div className="panel px-4 py-3">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-metric font-semibold tabular">{value}</p>
      {note ? <p className="mt-0.5 text-xs text-muted">{note}</p> : null}
    </div>
  );
}
