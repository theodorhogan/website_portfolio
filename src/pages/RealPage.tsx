import { Breakevens } from "../components/Breakevens";
import { Commodities } from "../components/Commodities";
import { FedWatch } from "../components/FedWatch";
import { HousingWatch } from "../components/HousingWatch";
import { OasSpreads } from "../components/OasSpreads";
import { RealYields } from "../components/RealYields";
import "./RealPage.css";

export function RealPage() {
  return (
    <section className="real-page">
      <div className="real-page__layout">
        <div className="real-page__column real-page__column--tables">
          <RealYields />
          <Breakevens />
          <OasSpreads />
        </div>
        <div className="real-page__column real-page__column--commodities">
          <Commodities />
        </div>
        <aside className="real-page__column real-page__column--watch">
          <FedWatch />
          <HousingWatch />
        </aside>
      </div>
    </section>
  );
}
