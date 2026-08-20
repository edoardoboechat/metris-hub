export default function Field({ error, label, name, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        autoComplete="off"
        className={error ? 'input-error' : ''}
        name={name}
        onChange={(event) => onChange((current) => ({ ...current, [name]: event.target.value }))}
        placeholder={placeholder}
        type={type}
        value={value}
      />
      {error ? <small className="field-error">{error}</small> : null}
    </label>
  );
}
