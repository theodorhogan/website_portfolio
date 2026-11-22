import { NavLink } from "react-router-dom";
import { ROUTE_ITEMS } from "../routes";
import { useNewsletterContext } from "../state/useNewsletterContext";
import { formatDayMonthYear } from "../utils/dates";
import { HeadClock } from "./HeadClock";
import { HeadSearch } from "./HeadSearch";
import "./Head.css";

export function Head() {
  const { newsletters, selectedId, setSelectedId } = useNewsletterContext();

  // Bulletins are sorted newest first, so "older" is the next index up.
  const selectedIndex = newsletters.findIndex((entry) => entry.id === selectedId);
  const selected = selectedIndex >= 0 ? newsletters[selectedIndex] : null;
  const older = selected ? newsletters[selectedIndex + 1] : undefined;
  const newer = selected ? newsletters[selectedIndex - 1] : undefined;
  const latest = newsletters[0];

  return (
    <header className="head-container">
      <div className="head-primary">
        <span className="head-brand">
          <span className="head-brandMark" aria-hidden="true">
            &gt;
          </span>
          Terminal
        </span>
        <nav className="head-routeNav" aria-label="Primary">
          {ROUTE_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `head-routeLink ${isActive ? "head-routeLink--active" : "head-routeLink--inactive"}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <HeadSearch />
      </div>
      <div className="head-status">
        <div className="head-activeWeek" role="group" aria-label="Change active week">
          <button
            type="button"
            className="head-activeWeekButton"
            onClick={() => older && setSelectedId(older.id)}
            disabled={!older}
            aria-label="Go to older week"
          >
            {"<"}
          </button>
          <span className="head-activeWeekPrefix" aria-live="polite">
            Active {selected ? formatDayMonthYear(selected.sortDate) : "-- --- --"}
          </span>
          <button
            type="button"
            className="head-activeWeekButton"
            onClick={() => newer && setSelectedId(newer.id)}
            disabled={!newer}
            aria-label="Go to newer week"
          >
            {">"}
          </button>
          <button
            type="button"
            className="head-activeWeekLatest"
            onClick={() => latest && setSelectedId(latest.id)}
            disabled={!selected || selected === latest}
            aria-label="Jump to latest week"
          >
            Latest
          </button>
        </div>
        <HeadClock />
      </div>
    </header>
  );
}
