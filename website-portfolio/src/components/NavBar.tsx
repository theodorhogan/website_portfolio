import { NavLink } from "react-router-dom";
import "./NavBar.css";

const navItems = [
  { label: "Main", path: "/" },
  { label: "Duration", path: "/duration" },
  { label: "Beta", path: "/beta" },
  { label: "Models", path: "/models" },
];

export function NavBar() {
  return (
    <nav className="navbar">
      <ul className="navbar-list">
        {navItems.map((item) => (
          <li key={item.path} className="navbar-item">
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                [
                  "navbar-link",
                  isActive ? "navbar-link--active" : "navbar-link--inactive",
                ].join(" ")
              }
              end={item.path === "/"}
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
