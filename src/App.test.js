import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders RateFlow on the homepage", () => {
  render(<App />);
  expect(screen.getByText(/Live Money Intelligence/i)).toBeInTheDocument();
});
