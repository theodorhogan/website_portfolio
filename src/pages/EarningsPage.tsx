import { EarningsCalendar } from "../components/EarningsCalendar";
import { IndexEarnings } from "../components/IndexEarnings";
import "./EarningsPage.css";

export function EarningsPage() {
  return (
    <section className="earnings-page">
      <div className="earnings-page__layout">
        <div className="earnings-page__calendarSlot">
          <EarningsCalendar />
        </div>
        <div className="earnings-page__indexSlot">
          <IndexEarnings />
        </div>
      </div>
    </section>
  );
}
