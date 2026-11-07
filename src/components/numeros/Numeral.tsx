import styles from "./NumerosShell.module.css";

export function Numeral({
  digits,
  size = "stage",
}: {
  digits: string;
  size?: "stage" | "card";
}) {
  const long = digits.replace(/\s/g, "").length > 10;

  return (
    <div
      className={styles.medallion}
      data-long={long ? "1" : "0"}
      data-size={size}
    >
      <img src="/numeros/medallion.jpg" alt="" />
      <p>
        <span>{digits}</span>
      </p>
    </div>
  );
}
