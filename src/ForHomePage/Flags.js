export default function Flags({ countryCode, size = 24, circle = false }) {
  const code = countryCode?.toLowerCase();

  if (!code) return null;

  return (
    <img
      src={`https://flagcdn.com/${code}.svg`}
      alt={code}
      style={{
        width: size,
        height: circle ? size : "auto",
        borderRadius: circle ? "50%" : 0,
        objectFit: "cover",
        display: "block",
      }}
    />
  );
}
