import React, { useState, useMemo } from "react";

export function DataTable({
  columns = [],
  data = [],
  searchPlaceholder = "Search records...",
  searchKey = "",
  filterKey = "",
  filterOptions = [],
  filterLabel = "Filter",
  loading = false,
  emptyMessage = "No records found.",
  onRowClick,
  actionButton,
  className = ""
}) {
  const [search, setSearch] = useState("");
  const [filterVal, setFilterVal] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filter and Search logic
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Apply Search
      const searchMatch = !search || !searchKey || 
        String(item[searchKey] || "").toLowerCase().includes(search.toLowerCase());
      
      // Apply Filter
      const filterMatch = !filterVal || !filterKey || 
        String(item[filterKey] || "") === filterVal;

      return searchMatch && filterMatch;
    });
  }, [data, search, searchKey, filterVal, filterKey]);

  // Pagination logic
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      
      {/* Top Filter and Search Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {searchKey && (
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-slate-950/60 border border-slate-800 focus:border-blue-500/80 rounded-lg text-xs text-white outline-none focus:ring-2 focus:ring-blue-500/20 w-64 max-w-full transition"
            />
          )}
          
          {filterKey && filterOptions.length > 0 && (
            <select
              value={filterVal}
              onChange={(e) => {
                setFilterVal(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-slate-950/60 border border-slate-800 focus:border-blue-500/80 rounded-lg text-xs text-slate-300 outline-none focus:ring-2 focus:ring-blue-500/20 transition cursor-pointer"
            >
              <option value="">All {filterLabel}s</option>
              {filterOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
        </div>

        {actionButton && (
          <div className="w-full md:w-auto flex justify-end">
            {actionButton}
          </div>
        )}
      </div>

      {/* Main Table view */}
      <div className="border border-slate-800 rounded-2xl bg-slate-900 shadow-xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                {columns.map(col => (
                  <th key={col.key} className={`p-4 ${col.className || ""}`}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-800/40 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                      <span className="text-slate-500 font-semibold">Loading data...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="p-12 text-center text-slate-500 font-medium">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, idx) => (
                  <tr
                    key={row.id || idx}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={`transition duration-150 ${onRowClick ? "cursor-pointer hover:bg-slate-800/40" : "hover:bg-slate-850/20"}`}
                  >
                    {columns.map(col => (
                      <td key={col.key} className={`p-4 align-middle ${col.className || ""}`}>
                        {col.render ? col.render(row) : row[col.key] || "--"}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center bg-slate-900 border border-slate-800 px-4 py-3 rounded-xl text-xs">
          <span className="text-slate-400 font-medium">
            Page <span className="font-bold text-white">{currentPage}</span> of <span className="font-bold text-white">{totalPages}</span> ({filteredData.length} records)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-850 text-slate-300 disabled:opacity-40 rounded-lg transition border border-slate-800 cursor-pointer"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-850 text-slate-300 disabled:opacity-40 rounded-lg transition border border-slate-800 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
