import { NavLink } from "react-router-dom";
import { ROUTE_ITEMS } from "../routes";
import "./NavBar.css";

/** Bottom tab bar, shown on phones where the header nav is hidden. */
export function NavBar() {
  return (
    <nav className="navbar" aria-label="Primary">
      <ul className="navbar-list">
        {ROUTE_ITEMS.map((item) => (
          <li key={item.path} className="navbar-item">
            <NavLink
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) => `navbar-link ${isActive ? "navbar-link--active" : "navbar-link--inactive"}`}
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
