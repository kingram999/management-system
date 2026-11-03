"use client";

import { useEffect, useMemo, useState } from "react";
import {
  SortableTh,
  sortRows,
  useSortableState,
} from "@/components/sortable-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatInr } from "@/lib/class-levels";
import type {
  TransportRouteRecord,
  TransportStopRecord,
} from "@/lib/data/transport";
import {
  createRouteAction,
  createStopAction,
  deleteRouteAction,
  deleteStopAction,
  updateRouteAction,
  updateStopAction,
} from "../actions";

type RouteSortKey = "name" | "code" | "annual_fee" | "stops" | "riders" | "status";
type StopSortKey = "sequence" | "name" | "pickup_time" | "riders";

export function TransportRoutesClient({
  routes,
  stops,
}: {
  routes: TransportRouteRecord[];
  stops: TransportStopRecord[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<string>(
    routes[0]?.id ?? "",
  );

  useEffect(() => {
    if (!selectedRouteId && routes[0]?.id) {
      setSelectedRouteId(routes[0].id);
      return;
    }
    if (
      selectedRouteId &&
      routes.length > 0 &&
      !routes.some((r) => r.id === selectedRouteId)
    ) {
      setSelectedRouteId(routes[0]?.id ?? "");
    }
  }, [routes, selectedRouteId]);
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);
  const [editingStopId, setEditingStopId] = useState<string | null>(null);

  const routeSort = useSortableState<RouteSortKey>("name");
  const stopSort = useSortableState<StopSortKey>("sequence");

  const sortedRoutes = useMemo(
    () =>
      sortRows(routes, routeSort.sortKey, routeSort.sortDir, (row, key) => {
        switch (key) {
          case "name":
            return row.name;
          case "code":
            return row.code;
          case "annual_fee":
            return row.annual_fee;
          case "stops":
            return row.stop_count;
          case "riders":
            return row.rider_count;
          case "status":
            return row.is_active ? "Active" : "Inactive";
        }
      }),
    [routes, routeSort.sortKey, routeSort.sortDir],
  );

  const routeStops = useMemo(
    () => stops.filter((s) => s.route_id === selectedRouteId),
    [stops, selectedRouteId],
  );

  const sortedStops = useMemo(
    () =>
      sortRows(routeStops, stopSort.sortKey, stopSort.sortDir, (row, key) => {
        switch (key) {
          case "sequence":
            return row.sequence;
          case "name":
            return row.name;
          case "pickup_time":
            return row.pickup_time;
          case "riders":
            return row.rider_count ?? 0;
        }
      }),
    [routeStops, stopSort.sortKey, stopSort.sortDir],
  );

  const selectedRoute = routes.find((r) => r.id === selectedRouteId) ?? null;

  async function run(
    action: (formData: FormData) => Promise<{ error?: string }>,
    formData: FormData,
    successMessage: string,
  ) {
    setError(null);
    setMessage(null);
    setPending(true);
    try {
      const result = await action(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage(successMessage);
      setEditingRouteId(null);
      setEditingStopId(null);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="display-font text-3xl">Routes & stops</h2>
        <p className="mt-1 text-sm text-muted">
          Create bus routes and ordered pickup stops
        </p>
      </div>

      <form
        className="grid gap-3 rounded-xl border border-border bg-background p-4 sm:grid-cols-2 lg:grid-cols-5"
        action={async (formData) => {
          await run(createRouteAction, formData, "Route added.");
        }}
      >
        <div>
          <Label htmlFor="route-name">Route name</Label>
          <Input id="route-name" name="name" required placeholder="Route A" />
        </div>
        <div>
          <Label htmlFor="route-code">Code</Label>
          <Input id="route-code" name="code" placeholder="A" />
        </div>
        <div>
          <Label htmlFor="route-fee">Annual fee (₹)</Label>
          <Input
            id="route-fee"
            name="annualFee"
            type="number"
            min={0}
            defaultValue={0}
          />
        </div>
        <div className="flex items-end sm:col-span-2 lg:col-span-2">
          <Button type="submit" disabled={pending}>
            Add route
          </Button>
        </div>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-success">{message}</p> : null}

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-background text-muted">
            <tr>
              <SortableTh
                columnKey="name"
                label="Route"
                sortKey={routeSort.sortKey}
                sortDir={routeSort.sortDir}
                onSort={routeSort.toggleSort}
              />
              <SortableTh
                columnKey="code"
                label="Code"
                sortKey={routeSort.sortKey}
                sortDir={routeSort.sortDir}
                onSort={routeSort.toggleSort}
              />
              <SortableTh
                columnKey="annual_fee"
                label="Annual fee"
                sortKey={routeSort.sortKey}
                sortDir={routeSort.sortDir}
                onSort={routeSort.toggleSort}
              />
              <SortableTh
                columnKey="stops"
                label="Stops"
                sortKey={routeSort.sortKey}
                sortDir={routeSort.sortDir}
                onSort={routeSort.toggleSort}
              />
              <SortableTh
                columnKey="riders"
                label="Riders"
                sortKey={routeSort.sortKey}
                sortDir={routeSort.sortDir}
                onSort={routeSort.toggleSort}
              />
              <SortableTh
                columnKey="status"
                label="Status"
                sortKey={routeSort.sortKey}
                sortDir={routeSort.sortDir}
                onSort={routeSort.toggleSort}
              />
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {sortedRoutes.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">
                  No routes yet. Add the first one above.
                </td>
              </tr>
            ) : (
              sortedRoutes.map((route) =>
                editingRouteId === route.id ? (
                  <tr key={route.id} className="border-t border-border">
                    <td colSpan={7} className="px-4 py-3">
                      <form
                        className="flex flex-wrap items-end gap-3"
                        action={async (formData) => {
                          formData.set("id", route.id);
                          await run(
                            updateRouteAction,
                            formData,
                            "Route updated.",
                          );
                        }}
                      >
                        <div>
                          <Label htmlFor={`name-${route.id}`}>Name</Label>
                          <Input
                            id={`name-${route.id}`}
                            name="name"
                            required
                            defaultValue={route.name}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`code-${route.id}`}>Code</Label>
                          <Input
                            id={`code-${route.id}`}
                            name="code"
                            defaultValue={route.code ?? ""}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`fee-${route.id}`}>Annual fee</Label>
                          <Input
                            id={`fee-${route.id}`}
                            name="annualFee"
                            type="number"
                            min={0}
                            defaultValue={route.annual_fee}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`active-${route.id}`}>Status</Label>
                          <select
                            id={`active-${route.id}`}
                            name="isActive"
                            defaultValue={route.is_active ? "true" : "false"}
                            className="h-10 rounded-lg border border-border bg-card px-3 text-sm"
                          >
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                          </select>
                        </div>
                        <Button type="submit" size="sm" disabled={pending}>
                          Save
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => setEditingRouteId(null)}
                        >
                          Cancel
                        </Button>
                      </form>
                    </td>
                  </tr>
                ) : (
                  <tr
                    key={route.id}
                    className={`border-t border-border ${
                      selectedRouteId === route.id ? "bg-brand/5" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="font-medium text-brand hover:underline"
                        onClick={() => setSelectedRouteId(route.id)}
                      >
                        {route.name}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-muted">{route.code || "—"}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {formatInr(route.annual_fee)}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{route.stop_count}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {route.rider_count}
                    </td>
                    <td className="px-4 py-3">
                      {route.is_active ? "Active" : "Inactive"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setSelectedRouteId(route.id);
                            setEditingRouteId(route.id);
                          }}
                        >
                          Edit
                        </Button>
                        <form
                          action={async (formData) => {
                            if (
                              !window.confirm(
                                "Delete this route and its stops?",
                              )
                            ) {
                              return;
                            }
                            formData.set("id", route.id);
                            await run(
                              deleteRouteAction,
                              formData,
                              "Route deleted.",
                            );
                            if (selectedRouteId === route.id) {
                              setSelectedRouteId("");
                            }
                          }}
                        >
                          <Button
                            type="submit"
                            size="sm"
                            variant="danger"
                            disabled={pending}
                          >
                            Delete
                          </Button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ),
              )
            )}
          </tbody>
        </table>
      </div>

      {selectedRoute ? (
        <section className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">
              Stops on {selectedRoute.name}
            </h3>
            <p className="text-sm text-muted">
              Ordered by sequence for pickup planning
            </p>
          </div>

          <form
            className="grid gap-3 rounded-xl border border-border bg-background p-4 sm:grid-cols-2 lg:grid-cols-5"
            action={async (formData) => {
              formData.set("routeId", selectedRoute.id);
              await run(createStopAction, formData, "Stop added.");
            }}
          >
            <div>
              <Label htmlFor="stop-name">Stop name</Label>
              <Input
                id="stop-name"
                name="name"
                required
                placeholder="Main Gate"
              />
            </div>
            <div>
              <Label htmlFor="stop-seq">Sequence</Label>
              <Input
                id="stop-seq"
                name="sequence"
                type="number"
                min={0}
                defaultValue={routeStops.length + 1}
              />
            </div>
            <div>
              <Label htmlFor="stop-time">Pickup time</Label>
              <Input
                id="stop-time"
                name="pickupTime"
                placeholder="07:30"
              />
            </div>
            <div className="flex items-end sm:col-span-2 lg:col-span-2">
              <Button type="submit" disabled={pending}>
                Add stop
              </Button>
            </div>
          </form>

          <div className="overflow-hidden rounded-xl border border-border">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-background text-muted">
                <tr>
                  <SortableTh
                    columnKey="sequence"
                    label="#"
                    sortKey={stopSort.sortKey}
                    sortDir={stopSort.sortDir}
                    onSort={stopSort.toggleSort}
                  />
                  <SortableTh
                    columnKey="name"
                    label="Stop"
                    sortKey={stopSort.sortKey}
                    sortDir={stopSort.sortDir}
                    onSort={stopSort.toggleSort}
                  />
                  <SortableTh
                    columnKey="pickup_time"
                    label="Pickup"
                    sortKey={stopSort.sortKey}
                    sortDir={stopSort.sortDir}
                    onSort={stopSort.toggleSort}
                  />
                  <SortableTh
                    columnKey="riders"
                    label="Riders"
                    sortKey={stopSort.sortKey}
                    sortDir={stopSort.sortDir}
                    onSort={stopSort.toggleSort}
                  />
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {sortedStops.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-muted"
                    >
                      No stops on this route yet.
                    </td>
                  </tr>
                ) : (
                  sortedStops.map((stop) =>
                    editingStopId === stop.id ? (
                      <tr key={stop.id} className="border-t border-border">
                        <td colSpan={5} className="px-4 py-3">
                          <form
                            className="flex flex-wrap items-end gap-3"
                            action={async (formData) => {
                              formData.set("id", stop.id);
                              await run(
                                updateStopAction,
                                formData,
                                "Stop updated.",
                              );
                            }}
                          >
                            <div>
                              <Label htmlFor={`seq-${stop.id}`}>Sequence</Label>
                              <Input
                                id={`seq-${stop.id}`}
                                name="sequence"
                                type="number"
                                min={0}
                                defaultValue={stop.sequence}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`sname-${stop.id}`}>Name</Label>
                              <Input
                                id={`sname-${stop.id}`}
                                name="name"
                                required
                                defaultValue={stop.name}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`ptime-${stop.id}`}>
                                Pickup time
                              </Label>
                              <Input
                                id={`ptime-${stop.id}`}
                                name="pickupTime"
                                defaultValue={stop.pickup_time ?? ""}
                              />
                            </div>
                            <Button type="submit" size="sm" disabled={pending}>
                              Save
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => setEditingStopId(null)}
                            >
                              Cancel
                            </Button>
                          </form>
                        </td>
                      </tr>
                    ) : (
                      <tr key={stop.id} className="border-t border-border">
                        <td className="px-4 py-3 tabular-nums">
                          {stop.sequence}
                        </td>
                        <td className="px-4 py-3 font-medium">{stop.name}</td>
                        <td className="px-4 py-3 text-muted">
                          {stop.pickup_time || "—"}
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {stop.rider_count ?? 0}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => setEditingStopId(stop.id)}
                            >
                              Edit
                            </Button>
                            <form
                              action={async (formData) => {
                                if (!window.confirm("Delete this stop?")) {
                                  return;
                                }
                                formData.set("id", stop.id);
                                await run(
                                  deleteStopAction,
                                  formData,
                                  "Stop deleted.",
                                );
                              }}
                            >
                              <Button
                                type="submit"
                                size="sm"
                                variant="danger"
                                disabled={pending}
                              >
                                Delete
                              </Button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    ),
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
