import {
  TERRITORY_AGES,
  ODISSE_AGES,
  TERRITORY_SEXES,
} from "../data/indicatorDefinitions";
import type { TerritoryExplorerModel } from "./useTerritoryExplorer";
type Props = TerritoryExplorerModel["selection"]["filters"];

export function TerritoryFilters({
  mode,
  code,
  setCode,
  setChartView,
  territoryDataset,
  departmentOptions,
  age,
  profileAge,
  setAge,
  setProfileAge,
  sex,
  profileSex,
  setSex,
  setProfileSex,
}: Props) {
  return (
    <div className="territory-filters">
      {mode === "territories" && (
        <label htmlFor="department">
          Territoire
          <select
            id="department"
            value={code}
            onChange={(event) => {
              setCode(event.target.value);
              if (event.target.value === "FR") setChartView("level");
            }}
          >
            <option value="FR">
              {territoryDataset === "emergency"
                ? "France · référence couverte"
                : "France entière"}
            </option>
            {departmentOptions.map((row) => (
              <option key={row.department.code} value={row.department.code}>
                {row.department.code} · {row.department.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <label htmlFor="territory-age">
        Tranche d’âge
        <select
          id="territory-age"
          value={mode === "territories" ? age : profileAge}
          onChange={(event) =>
            mode === "territories"
              ? setAge(event.target.value)
              : setProfileAge(event.target.value)
          }
        >
          {(mode === "territories" ? TERRITORY_AGES : ODISSE_AGES).map(
            (item) => (
              <option key={item} value={item}>
                {item === "Tous" ? "Tous les âges" : item}
              </option>
            ),
          )}
        </select>
      </label>
      <label htmlFor="territory-sex">
        Sexe
        <select
          id="territory-sex"
          value={mode === "territories" ? sex : profileSex}
          onChange={(event) =>
            mode === "territories"
              ? setSex(event.target.value)
              : setProfileSex(event.target.value)
          }
        >
          {(mode === "territories"
            ? TERRITORY_SEXES
            : ["Femmes", "Hommes"]
          ).map((item) => (
            <option key={item} value={item}>
              {item === "Hommes et Femmes" ? "Tous les sexes" : item}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
