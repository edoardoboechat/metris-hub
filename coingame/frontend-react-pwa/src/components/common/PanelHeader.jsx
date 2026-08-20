export default function PanelHeader({ title, subtitle }) {
  return (
    <div className="panel-header">
      <p className="eyebrow">{title}</p>
      <h3>{subtitle}</h3>
    </div>
  );
}
