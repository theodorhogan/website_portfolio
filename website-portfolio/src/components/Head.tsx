import { useEffect, useState } from "react";
import "./Head.css";

function formatTime(date: Date) {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function Head() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <header className="head-container">
      <div className="head-search">
        <span className="head-searchPrompt" aria-hidden="true">
          &gt;
        </span>
        <input
          id="global-search"
          type="search"
          placeholder="Search"
          className="head-searchInput"
          aria-label="Search"
        />
      </div>
      <time className="head-timer" dateTime={now.toISOString()}>
        {formatTime(now)}
      </time>
    </header>
  );
}
