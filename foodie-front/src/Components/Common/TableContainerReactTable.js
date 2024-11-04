import React, { Fragment, useEffect, useState } from "react";
import { CardBody, Col, Row, Table } from "reactstrap";
import { Link } from "react-router-dom";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';
import { rankItem } from '@tanstack/match-sorter-utils';

// Column Filter
const Filter = ({ column, table }) => {
  const columnFilterValue = column.getFilterValue();

  return (
    <>
      <DebouncedInput
        type="text"
        value={columnFilterValue ?? ''}
        onChange={value => column.setFilterValue(value)}
        placeholder="Search..."
        className="w-36 border shadow rounded"
        list={column.id + 'list'}
      />
      <div className="h-1" />
    </>
  );
};

// Global Filter
const DebouncedInput = ({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounce);

    return () => clearTimeout(timeout);
  }, [debounce, onChange, value]);

  return (
    <input {...props} value={value} id="search-bar-0" className="form-control border-0 search" onChange={e => setValue(e.target.value)} />
  );
};

const TableContainer = ({
  columns,
  data,
  isGlobalFilter,
  customPageSize,
  tableClass,
  theadClass,
  trClass,
  thClass,
  divClass,
  SearchPlaceholder,
}) => {
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnSizing, setColumnSizing] = useState({});
  const [pageIndex, setPageIndex] = useState(0); // Internal page index state

  const fuzzyFilter = (row, columnId, value, addMeta) => {
    const itemRank = rankItem(row.getValue(columnId), value);
    addMeta({ itemRank });
    return itemRank.passed;
  };

  const table = useReactTable({
    columns,
    data,
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    state: {
      columnFilters,
      globalFilter,
      columnSizing,
      pagination: {
        pageIndex, // Use internal page index
        pageSize: customPageSize || 10, // Set default page size
      },
    },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnSizingChange: setColumnSizing,
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const {
    getHeaderGroups,
    getRowModel,
    getCanPreviousPage,
    getCanNextPage,
    getPageOptions,
    nextPage,
    previousPage,
    setPageSize,
    getState,
  } = table;

  // Set custom page size if provided
  useEffect(() => {
    if (customPageSize) {
      setPageSize(customPageSize);
    }
  }, [customPageSize]);

  // Sync page index state with table state when page changes
  useEffect(() => {
    setPageIndex(getState().pagination.pageIndex);
  }, [getState().pagination.pageIndex]);

  return (
    <Fragment>
      {isGlobalFilter && (
        <Row className="mb-3">
          <CardBody className="border border-dashed border-end-0 border-start-0">
            <form>
              <Row>
                <Col sm={5}>
                  <div className="search-box ms-auto me-2 mb-2 d-inline-block col-12">
                    <DebouncedInput
                      value={globalFilter ?? ''}
                      onChange={value => setGlobalFilter(value)}
                      placeholder={SearchPlaceholder}
                    />
                    <i className="bx bx-search-alt search-icon"></i>
                  </div>
                </Col>
              </Row>
            </form>
          </CardBody>
        </Row>
      )}

      <div className={divClass}>
        <Table hover className={tableClass}>
          <thead className={theadClass}>
            {getHeaderGroups().map(headerGroup => (
              <tr className={trClass} key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className={`${thClass} ${header.column.columnDef.thClass || ''}`}
                    style={{ width: header.getSize() }}
                    {...{
                      onClick: header.column.getToggleSortingHandler(),
                    }}
                  >
                    {header.isPlaceholder ? null : (
                      <React.Fragment>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: ' ',
                          desc: ' ',
                        }[header.column.getIsSorted()] ?? null}
                        {header.column.getCanFilter() ? (
                          <div>
                            <Filter column={header.column} table={table} />
                          </div>
                        ) : null}
                      </React.Fragment>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {getRowModel().rows.map(row => (
              <tr key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className={cell.column.columnDef.tdClass || ''}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <Row className="align-items-center mt-2 g-3 text-center text-sm-start">
        <div className="col-sm">
          <div className="text-muted">
            <span className="fw-semibold ms-1">{getState().pagination.pageSize}</span> di <span className="fw-semibold">{data.length}</span> Risultati
          </div>
        </div>
        <div className="col-sm-auto">
          <ul className="pagination pagination-separated pagination-md justify-content-center justify-content-sm-start mb-0">
            <li className={!getCanPreviousPage() ? "page-item disabled" : "page-item"}>
              <Link to="#" className="page-link" onClick={() => {
                previousPage();
                setPageIndex(getState().pagination.pageIndex - 1); // Update internal page index
              }}>
                Precedente
              </Link>
            </li>
            {getPageOptions().map((item, key) => (
              <React.Fragment key={key}>
                <li className="page-item">
                  <Link to="#" className={getState().pagination.pageIndex === item ? "page-link active" : "page-link"} onClick={() => {
                    setPageIndex(item); // Update internal page index
                  }}>
                    {item + 1}
                  </Link>
                </li>
              </React.Fragment>
            ))}
            <li className={!getCanNextPage() ? "page-item disabled" : "page-item"}>
              <Link to="#" className="page-link" onClick={() => {
                nextPage();
                setPageIndex(getState().pagination.pageIndex + 1); // Update internal page index
              }}>
                Successiva
              </Link>
            </li>
          </ul>
        </div>
      </Row>
    </Fragment>
  );
};


export default TableContainer;
