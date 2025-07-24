import axios from "axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useEffect, useState, useRef } from "react";
import { InputSwitch } from "primereact/inputswitch";
import { Button } from "primereact/button";
import { OverlayPanel } from "primereact/overlaypanel";
import { InputNumber } from "primereact/inputnumber";
import ChevronDown from "./icons/ChevronDown";

// // Required CSS files for PrimeReact
// import "primereact/resources/themes/lara-light-cyan/theme.css";
// import "primereact/resources/primereact.min.css";
// import "primeicons/primeicons.css";
// import "primeflex/primeflex.css";

interface Artwork {
  id: number;
  title: string;
  place_of_origin: string | null;
  artist_display: string;
  inscriptions: string | null;
  date_start: number;
  date_end: number;
}

interface ApiResponse {
  pagination: {
    total: number;
  };
  data: Artwork[];
}

function App() {
  const [items, setItems] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [lazyState, setLazyState] = useState({ first: 0, rows: 12 });
  const [favoriteIds, setFavoriteIds] = useState(new Set<number>());
  const [numToSelect, setNumToSelect] = useState<number | null>(null);
  const op = useRef<OverlayPanel>(null);

  useEffect(() => {
    const fetchApi = async () => {
      try {
        setLoading(true);
        const page = lazyState.first / lazyState.rows + 1;

        const response = await axios.get<ApiResponse>(
          `https://api.artic.edu/api/v1/artworks?page=${page}`
        );
        setItems(response.data.data);
        setTotalRecords(response.data.pagination.total);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchApi();
  }, [lazyState]);

  const onFavoriteChange = (artworkId: number, isSelected: boolean) => {
    setFavoriteIds((prevIds) => {
      const newIds = new Set(prevIds);
      isSelected ? newIds.add(artworkId) : newIds.delete(artworkId);
      return newIds;
    });
  };

  const onSelectAllChange = (event: { value: boolean }) => {
    const isSelected = event.value;
    const currentPageIds = items.map((item) => item.id);
    setFavoriteIds((prevIds) => {
      const newIds = new Set(prevIds);
      if (isSelected) {
        currentPageIds.forEach((id) => newIds.add(id));
      } else {
        currentPageIds.forEach((id) => newIds.delete(id));
      }
      return newIds;
    });
  };

  const handleBulkSelect = () => {
    if (numToSelect && numToSelect > 0) {
      const idsToSelect = items.slice(0, numToSelect).map((item) => item.id);
      setFavoriteIds((prevIds) => {
        const newIds = new Set(prevIds);
        idsToSelect.forEach((id) => newIds.add(id));
        return newIds;
      });
    }
    op.current?.hide();
    setNumToSelect(null);
  };

  const itemsWithFavorites = items.map((item) => ({
    ...item,
    isFavorite: favoriteIds.has(item.id),
  }));

  const favoriteBodyTemplate = (rowData: Artwork & { isFavorite: boolean }) => {
    return (
      <InputSwitch
        checked={rowData.isFavorite}
        onChange={(e) => onFavoriteChange(rowData.id, e.value)}
      />
    );
  };

  const favoriteHeaderTemplate = () => {
    const allOnPageSelected =
      items.length > 0 && items.every((item) => favoriteIds.has(item.id));
    return (
      <div className="flex align-items-center gap-1">
        <InputSwitch onChange={onSelectAllChange} checked={allOnPageSelected} />
        <Button
          icon={<ChevronDown />}
          rounded
          text
          className="p-button-sm "
          onClick={(e) => op.current?.toggle(e)}
          aria-label="Open selection options"
          aria-haspopup
          aria-controls="overlay_panel"
        />
      </div>
    );
  };

  return (
    <div style={{ padding: "1rem" }}>
      <OverlayPanel ref={op} id="overlay_panel">
        <div className="flex flex-column gap-3 w-15rem">
          <span>Select top 'N' items</span>
          <InputNumber
            value={numToSelect}
            onValueChange={(e) => setNumToSelect(e.value ?? null)}
            max={items.length}
            min={1}
            placeholder="Enter a number"
            showButtons
          />
          <Button
            label="Select"
            onClick={handleBulkSelect}
            disabled={!numToSelect}
          />
        </div>
      </OverlayPanel>

      <DataTable
        value={itemsWithFavorites}
        dataKey="id"
        paginator
        rows={lazyState.rows}
        lazy
        onPage={(e) => setLazyState(e)}
        tableStyle={{ minWidth: "50rem" }}
        loading={loading}
        first={lazyState.first}
        totalRecords={totalRecords}
      >
        <Column
          header={favoriteHeaderTemplate}
          body={favoriteBodyTemplate}
          headerStyle={{ width: "6rem" }}
          bodyStyle={{ textAlign: "center" }}
        />
        <Column field="title" header="Title"></Column>
        <Column field="place_of_origin" header="Place of Origin"></Column>
        <Column field="artist_display" header="Artist Display"></Column>
        <Column field="inscriptions" header="Inscriptions"></Column>
        <Column field="date_start" header="Start date"></Column>
        <Column field="date_end" header="End date"></Column>
      </DataTable>
    </div>
  );
}

export default App;
