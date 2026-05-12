"use client";

import { useMemo, useState, useEffect } from "react";
import { useT } from "next-i18next/client";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardFooter,
  CardHeader,
  CardTable,
  CardTitle,
  CardToolbar,
} from "@/components/ui/card";
import { DataGrid } from "@/components/ui/data-grid";
import { DataGridColumnHeader } from "@/components/ui/data-grid-column-header";
import { DataGridPagination } from "@/components/ui/data-grid-pagination";
import { DataGridTable } from "@/components/ui/data-grid-table";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { Filter, Search, X, CheckIcon } from "lucide-react";
import { Repository } from "@/types/repositories";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/debounce";
import { fetchGithubSearchRepositories } from "@/actions/fetch-github-search-repositories";
import { ActionsCell } from "./action-cell";
import {
  DEFAULT_PAGINATION_STATE,
  DEFAULT_SORTING_STATE,
  GITHUB_LANGUAGES,
} from "@/app/(protected)/repositories/components/constants";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";

export default function RepositoriesTable() {
  const { t } = useT();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>(
    DEFAULT_PAGINATION_STATE,
  );
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [sorting, setSorting] = useState<SortingState>(DEFAULT_SORTING_STATE);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [appliedLanguages, setAppliedLanguages] = useState<string[]>([]);
  const debouncedSearchQuery = useDebounce(
    searchQuery.length >= 3 ? searchQuery : "stars:>100000",
    500,
  );
  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      "search-repositories",
      pagination,
      sorting,
      debouncedSearchQuery,
      appliedLanguages,
    ],
    queryFn: () =>
      fetchGithubSearchRepositories({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        sorting,
        searchQuery: debouncedSearchQuery,
        selectedLanguages: appliedLanguages,
      }),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  const columns = useMemo<ColumnDef<Repository>[]>(() => {
    return [
      {
        accessorKey: "owner",
        id: "owner",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("repositories:owner")}
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-3">
              <Avatar className="size-8">
                <AvatarImage
                  src={row.original.owner.avatar_url}
                  alt={row.original.owner.login}
                />
              </Avatar>
              <div className="space-y-px">
                <div className="font-medium text-foreground">
                  {row.original.name}
                </div>
                <div className="text-muted-foreground">
                  {row.original.owner.type}
                </div>
              </div>
            </div>
          );
        },
        meta: {
          skeleton: (
            <div className="flex items-center gap-3 h-[41px]">
              <Skeleton className="size-8 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ),
        },
        size: 250,
        enableSorting: true,
        enableHiding: false,
        enableResizing: true,
      },
      {
        accessorKey: "name",
        id: "name",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("common:name")}
            visibility={true}
            column={column}
          />
        ),
        meta: {
          headerClassName: "",
          cellClassName: "text-start",
          skeleton: <Skeleton className="w-28 h-7" />,
        },
        size: 250,
        enableSorting: true,
        enableHiding: false,
        enableResizing: true,
      },
      {
        accessorKey: "description",
        id: "description",
        header: t("common:description"),
        size: 200,
        meta: {
          headerClassName: "",
          cellClassName: "text-start",
          skeleton: <Skeleton className="w-28 h-7" />,
        },
        enableSorting: false,
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: "language",
        id: "language",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("common:language")}
            visibility={true}
            column={column}
          />
        ),
        enableSorting: true,
        enableHiding: false,
        enableResizing: true,
        meta: {
          headerClassName: "",
          cellClassName: "text-start",
          skeleton: <Skeleton className="w-28 h-7" />,
        },
      },
      {
        accessorKey: "watchers",
        id: "watchers",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("repositories:watchers")}
            visibility={true}
            column={column}
          />
        ),
        enableSorting: true,
        enableHiding: false,
        enableResizing: true,
        meta: {
          headerClassName: "",
          cellClassName: "text-start",
          skeleton: <Skeleton className="w-28 h-7" />,
        },
      },
      {
        accessorKey: "visibility",
        id: "visibility",
        header: ({ column }) => (
          <DataGridColumnHeader
            title={t("repositories:visibility")}
            visibility={true}
            column={column}
          />
        ),
        cell: ({ row }) => {
          return (
            <Badge
              variant={
                row.original.visibility === "public" ? "primary" : "secondary"
              }
              appearance="outline"
            >
              {row.original.visibility}
            </Badge>
          );
        },
        meta: {
          headerClassName: "",
          cellClassName: "text-start",
          skeleton: <Skeleton className="w-28 h-7" />,
        },
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => <ActionsCell row={row} />,
        meta: {
          headerClassName: "",
          cellClassName: "text-start",
          skeleton: <Skeleton className="w-28 h-7" />,
        },
        size: 60,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
      },
    ];
  }, [t]);

  const table = useReactTable({
    columns,
    data: data?.data || [],
    pageCount: Math.ceil((data?.pagination.total || 0) / pagination.pageSize),
    getRowId: (row: Repository) => row.id.toString(),
    state: {
      pagination,
      sorting,
      columnOrder,
    },
    columnResizeMode: "onChange",
    onColumnOrderChange: setColumnOrder,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  });

  const resetFilters = (
    { searchQuery }: Partial<{ searchQuery: boolean }> = { searchQuery: true },
  ) => {
    setSorting(DEFAULT_SORTING_STATE);
    if (searchQuery) setSearchQuery("");
    setSelectedLanguages([]);
    setAppliedLanguages([]);
  };

  const resetPagination = () =>
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));

  const handleLanguagesChange = (value: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
    resetPagination();
  };

  const onClearFiltersClick = () => {
    if (searchQuery.length >= 3 || selectedLanguages.length > 0) resetFilters();
  };

  const onApplyClick = () => {
    setAppliedLanguages([...selectedLanguages].sort());
  };

  useEffect(() => {
    resetFilters({ searchQuery: false });
  }, [debouncedSearchQuery]);

  useEffect(() => {
    setColumnOrder(columns.map((column) => column.id as string));
  }, [columns]);

  return (
    <DataGrid
      table={table}
      recordCount={data?.pagination.total || 0}
      isLoading={isLoading}
      tableLayout={{
        columnsPinnable: true,
        columnsResizable: true,
        columnsMovable: true,
        columnsVisibility: true,
      }}
    >
      <Card className="w-full">
        <CardHeader className="py-4">
          <CardTitle>Repositories</CardTitle>
          <CardToolbar>
            <div className="flex items-center gap-2.5">
              <Button
                aria-label="Clear Filters"
                mode="link"
                size="sm"
                onClick={onClearFiltersClick}
              >
                {t("repositories:clearFilters")}
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="relative">
                <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder={t("repositories:searchInputPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-9 w-40"
                  aria-label="Search query"
                />
                {searchQuery.length > 0 && (
                  <Button
                    aria-label="Clear Search"
                    mode="icon"
                    variant="ghost"
                    className="absolute end-1.5 top-1/2 -translate-y-1/2 h-6 w-6"
                    onClick={() => setSearchQuery("")}
                  >
                    <X />
                  </Button>
                )}
              </div>
              <Separator orientation="vertical" className="h-6" />
              <Popover
                open={popoverOpen}
                onOpenChange={(open) => {
                  setPopoverOpen(open);
                  if (!open) onApplyClick();
                }}
              >
                <PopoverTrigger asChild>
                  <Button aria-label="Open Filter" variant="outline" size="sm">
                    <Filter />
                    {t("repositories:languages")}
                    {selectedLanguages.length > 0 && (
                      <Badge size="sm" appearance="outline">
                        {selectedLanguages.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-50 p-0" align="end">
                  <Command>
                    <CommandInput
                      placeholder={t("repositories:searchInputPlaceholder")}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {t("repositories:noLanguageFound")}
                      </CommandEmpty>
                      <CommandGroup>
                        {GITHUB_LANGUAGES.map((lang) => (
                          <CommandItem
                            className="flex justify-between"
                            key={lang}
                            value={lang}
                            onSelect={() => handleLanguagesChange(lang)}
                          >
                            <span className="truncate">{lang}</span>
                            {selectedLanguages.includes(lang) && <CheckIcon />}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                    <div className="flex p-2 gap-2">
                      <Button
                        aria-label="Reset Filter"
                        disabled={selectedLanguages.length === 0}
                        className="w-full"
                        variant="secondary"
                        mode="link"
                        size="sm"
                        onClick={() => setSelectedLanguages([])}
                      >
                        {t("common:reset")}
                      </Button>
                      <Button
                        aria-label="Apply Filter"
                        disabled={isLoading || isFetching}
                        className="w-full"
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          onApplyClick();
                          setPopoverOpen(false);
                        }}
                      >
                        {t("common:apply")}
                      </Button>
                    </div>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </CardToolbar>
        </CardHeader>
        <CardTable className="overflow-auto">
          <ScrollArea>
            <DataGridTable />
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardTable>
        <CardFooter>
          <DataGridPagination />
        </CardFooter>
      </Card>
    </DataGrid>
  );
}
